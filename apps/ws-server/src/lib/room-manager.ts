import { WebSocket } from "ws";
import { generateRoomId } from "./room-id-generator";
import {  ExecutionResult,  WSEventType,  ErrorResponse, WSDataMap, SuccessResponse, SupportedLanguage } from "@repo/shared/types";
import Redis from 'ioredis'
import { getRedisClient, getRedisSubscriber } from "@repo/redis";

// room:roomId --> set of userIds
// user:userId --> roomId


const USER_KEY_PREFIX = 'user:'
const ROOM_KEY_PREFIX = 'room:'
const FLUSH_INTERVAL = 20 * 1000 // in ms

class RoomManager {
  private userConnections: Record<string, Set<WebSocket>> = {}
  private latestRoomCode: Record<string, string> = {}
  private redisSub: Redis
  private redis: Redis 
  
  private constructor(redisSub: Redis, redis: Redis) {
    this.redisSub = redisSub
    this.redis = redis
    this.subscribeToEvents()
  }

  static async create() {
    const redis = await getRedisClient()
    const redisSub = await getRedisSubscriber()
    const roomManager = new RoomManager(redisSub, redis)
    roomManager.persistRoomCodeToRedis()
    return roomManager
  }

  private getRoomKey = (roomId: string) => `room:${roomId}`
  private getUserKey = (userId: string) => `user:${userId}` 
  private getRoomCodeKey = (roomId: string) => `room:code:${roomId}`
  private getUserInfoKey = (userId: string) => `user:info:${userId}`
  private getRoomMetaKey = (roomId: string) => `room:meta:${roomId}`

  private subscribeToEvents = async () => {
    await this.redisSub.psubscribe(`${USER_KEY_PREFIX}*`, `${ROOM_KEY_PREFIX}*`, (err, count) => {
      if(err) {
        console.error("Failed to psubscribe", err)
        return
      }
      console.log(`Subscribed to ${count} patterns`)
    })

    this.redisSub.on("pmessage", async (pattern, channel, message) => {
      console.log(`Message channel ${channel} (pattern: ${pattern})`)

      const executionResult:ExecutionResult = JSON.parse(message)
      console.log(executionResult)

      if(channel.startsWith(`${ROOM_KEY_PREFIX}`)) {
        const users = await this.redis.smembers(channel)
        users.forEach(userId => this.broadcastToAll(userId, {executionResult}))
      }

      if(channel.startsWith(`${USER_KEY_PREFIX}`)) {
        const userId = channel.substring(USER_KEY_PREFIX.length)
        this.broadcastToAll(userId, {executionResult})
      }
    })
  }

  private broadcastToAll = (userId: string, data: {executionResult: ExecutionResult}) => {
    this.userConnections[userId]?.forEach((client) => {
      if(client.readyState === WebSocket.OPEN) {
        this.sendResponse(client, "execution:result", data)
      }
    })
  }

  public initializeConnection = async (client: WebSocket) => {
    const {userId} = client
    if(!userId) {
      console.error('Initialize error: Websocket is missing a userId.')
      client.close(1008, "User ID not provided")
      return 
    }

    if(!this.userConnections[userId]) {
      this.userConnections[userId] = new Set()
    }
    this.userConnections[userId].add(client)
    console.log(`User ${userId} connected. Total connections: ${this.userConnections[userId].size}`)

    const userKey = this.getUserKey(userId)
    const roomId = await this.redis.get(userKey)

    if(roomId) {
      await this.handleReconnect(client, roomId)
    }
    else {
      client.roomId = undefined 
      this.sendResponse(client, "session:init", {
        message: "Connection successful, you are in a solo session"
      })
    }
  }

  private sendResponse = <T extends WSEventType>(client: WebSocket, eventType: T, data: WSDataMap[T]) => {
    const response: SuccessResponse<T> = {eventType, success: true, data}
    client.send(JSON.stringify(response))
  }

  private sendError = (client: WebSocket, eventType: WSEventType, message: string) => {
    const response: ErrorResponse = {eventType, success: false, error: {message}}
    client.send(JSON.stringify(response))
  }

  public handleDisconnect = async (client: WebSocket) => {
    const {userId, roomId} = client 
    if(!userId) return 

    const userSockets = this.userConnections[userId]
    if(userSockets) {
      userSockets.delete(client)
      if(userSockets.size === 0) {
        delete this.userConnections[userId]
        console.log(`All connections for user ${userId} closed.`)
        
        if(roomId) {
          await this.redis.srem(this.getRoomKey(roomId), userId)
          const roomExists = await this.redis.exists(this.getRoomKey(roomId))
          if(!roomExists) await this.cleanupEmptyRoom(roomId)
          else {
            await this.broadcastUserLeaveToast(roomId, userId)
            await this.broadcastMembersToRoom(roomId)
          }
        }
      }
    }
  }

  public createRoom = async (client: WebSocket) => {
    const {userId} = client
    if(!userId) return this.sendError(client, "room:create", "User not authenticated.")
    
    const newRoomId = await this.generateUniqueRoomId()
    await this.redis.hset(this.getRoomMetaKey(newRoomId), {
      'ownerId': userId,
      'language': 'JavaScript'
    })
    await this.setUserRoomState(userId, newRoomId, "room:create")
  }

  public joinRoom = async (client: WebSocket, roomIdToJoin: string) => {
    console.log(roomIdToJoin)
    const {userId} = client
    if(!userId) return this.sendError(client, "room:join", "User not authenticated.")

    const roomKey = this.getRoomKey(roomIdToJoin)
    if(!(await this.redis.exists(roomKey))) {
      return this.sendError(client, "room:join", `Room with ID '${roomIdToJoin}' does not exist.`)
    }
    await this.setUserRoomState(userId, roomIdToJoin, "room:join")    
  }

  public leaveRoom = async (client: WebSocket) => {
    const {userId, roomId} = client 
    if(!userId || !roomId) return this.sendError(client, "room:leave", "You are not currently in a room")
    
    const pipeline = this.redis.pipeline()
    pipeline.srem(this.getRoomKey(roomId), userId)
    pipeline.del(this.getUserKey(userId))
    await pipeline.exec()

    const roomExists = await this.redis.exists(this.getRoomKey(roomId))
    if(!roomExists) await this.cleanupEmptyRoom(roomId)
    else {
      await this.broadcastUserLeaveToast(roomId, userId)
      await this.broadcastMembersToRoom(roomId)
    }
    
    this.userConnections[userId]?.forEach((conn) => {
      conn.roomId = undefined 
      this.sendResponse(conn, "room:leave", {roomId, message: `You have successfully left room: ${roomId}.` })
    })
  }

  private cleanupEmptyRoom = async (roomId: string) => {
    const pipeline = this.redis.pipeline()
    pipeline.del(this.getRoomCodeKey(roomId))
    pipeline.del(this.getRoomMetaKey(roomId))
    pipeline.exec()
    delete this.latestRoomCode[roomId]
    console.log(`Cleaned up empty room ${roomId}`)
  }

  public handleCodeChange = async (client: WebSocket, latestCode: string) => {
    const {userId, roomId} = client 
    if(!userId || !roomId) return

    this.latestRoomCode[roomId] = latestCode

    const usersInRoom = await this.redis.smembers(this.getRoomKey(roomId))
    usersInRoom.forEach((userId) => {
      this.userConnections[userId]?.forEach((conn) => {
        if(conn != client && conn.readyState === WebSocket.OPEN) {
          this.sendResponse(conn, "room:code-update", {latestCode})
        }
      })
    })
  }

  public changeLanguage = async (client: WebSocket, language: SupportedLanguage) => {
    const {userId, roomId} = client 
    if(!userId || !roomId) return

    const ownerId = await this.redis.hget(this.getRoomMetaKey(roomId), 'ownerId')
    if(userId !== ownerId) {
      this.sendError(client, 'room:language-update', 'Only the room owner can change the language.')
    }

    await this.redis.hset(this.getRoomMetaKey(roomId), 'language', language)

    const usersInRoom = await this.redis.smembers(this.getRoomKey(roomId))
    usersInRoom.forEach((userId) => {
      this.userConnections[userId]?.forEach((conn) => {
        if(conn.readyState === WebSocket.OPEN) {
          this.sendResponse(conn, 'room:language-update', {language})
        }
      })
    }) 
  }

  private generateUniqueRoomId = async () => {
    let roomId: string 
    do {
      roomId = generateRoomId()
    } while(await this.redis.exists(this.getRoomKey(roomId)))
    
    return roomId
  }

  private setUserRoomState = async (userId: string, newRoomId: string, eventType: "room:create" | "room:join") => {
    const pipeline = this.redis.pipeline()
    pipeline.sadd(this.getRoomKey(newRoomId), userId)
    pipeline.set(this.getUserKey(userId), newRoomId)
    await pipeline.exec()

    const message = eventType == "room:create" ? "Room created successfully." : "Joined room successfully."
    const latestCode = await this.getLatestRoomCode(newRoomId)
    this.userConnections[userId]?.forEach(client => {
      client.roomId = newRoomId
      this.sendResponse(client, eventType, {roomId: newRoomId, latestCode, message})
    })

    if(eventType === 'room:join') {
      await this.broadcastUserJoinToast(newRoomId, userId)
    }

    await this.broadcastMembersToRoom(newRoomId)
  }

  private getLatestRoomCode = async(roomId: string) => {
    let latestCode = this.latestRoomCode[roomId] || ""
    if(!latestCode) {
      latestCode = await this.redis.get(this.getRoomCodeKey(roomId)) || ""
    }
    return latestCode
  }

  private persistRoomCodeToRedis = () => {
    setInterval(async () => {
      const roomIds = Object.keys(this.latestRoomCode)
      if(roomIds.length === 0) return 
      const pipeline = this.redis.pipeline()
      roomIds.forEach(async (roomId) => {
        if(!(roomId in this.latestRoomCode)) return 
        const latestCode = this.latestRoomCode[roomId] || ""
        if(latestCode) pipeline.set(this.getRoomCodeKey(roomId), latestCode)
      })

      try {
        await pipeline.exec()
      }

      catch(err) {
        console.error("Error flushing latestRoomCode to Redis:", err)
      }
    }, FLUSH_INTERVAL)
  }

  private handleReconnect = async (client: WebSocket, roomId: string) => {
      const { userId } = client
      if (!userId || !roomId) return

      const roomExists = await this.redis.exists(this.getRoomKey(roomId))
      if(!roomExists) {
        console.log(`Room ${roomId} not found for reconnecting user ${userId}, starting fresh session`)

        client.roomId = undefined 
        await this.redis.del(this.getUserKey(userId))
        this.sendResponse(client, "session:init", {
          message: "Previous room not found, starting new session"
        })
        return 
      }

      client.roomId = roomId 

      const pipeline = this.redis.pipeline()
      pipeline.sadd(this.getRoomKey(roomId), userId)
      pipeline.set(this.getUserKey(userId), roomId)
      await pipeline.exec()

      const latestCode = await this.getLatestRoomCode(roomId)
      this.sendResponse(client, "room:join", {
        roomId,
        latestCode,
        message: `Reconnected to room ${roomId}`
      })
      
      await this.broadcastUserJoinToast(roomId, userId)
      await this.broadcastMembersToRoom(roomId)
  }

  private broadcastMembersToRoom = async (roomId: string) => {
    const usersInRoom = await this.redis.smembers(this.getRoomKey(roomId))
    const pipeline = this.redis.pipeline()
    usersInRoom.forEach((userId) => pipeline.hget(this.getUserInfoKey(userId), "username"))
    const results = await pipeline.exec()
    const members = usersInRoom.map((userId, index) => {
      const raw = results?.[index]?.[1] as unknown 
      return {
        userId,
        username: (typeof raw === 'string') ? raw : 'Anonymous'
      }
    }).filter(member => member.username)
    usersInRoom.forEach((userId) => {
      this.userConnections[userId]?.forEach((conn) => {
        if(conn.readyState === WebSocket.OPEN) {
          this.sendResponse(conn, "room:members-update", {members})
        }
      })
    })
  } 

  private broadcastUserJoinToast = async (roomId: string, uid: string) => {
    const username = await this.redis.hget(this.getUserInfoKey(uid), 'username')
    if(!username) {
      console.log(`username for user:${uid} not found`)
      return
    }
    const usersInRoom = await this.redis.smembers(this.getRoomKey(roomId))
    usersInRoom.forEach((userId) => {
      this.userConnections[userId]?.forEach((conn) => {
        if(userId != uid && conn.readyState === WebSocket.OPEN) {
          this.sendResponse(conn, "room:user-join", {
            username,
            message: `${username} joined the room`
          })
        }
      })
    })
  }

  private broadcastUserLeaveToast = async (roomId: string, uid: string) => {
    const username = await this.redis.hget(this.getUserInfoKey(uid), 'username')
    if(!username) {
      console.log(`username for user:${uid} not found`)
      return
    }
    const usersInRoom = await this.redis.smembers(this.getRoomKey(roomId))
    usersInRoom.forEach((userId) => {
      this.userConnections[userId]?.forEach((conn) => {
        if(userId != uid && conn.readyState === WebSocket.OPEN) {
          this.sendResponse(conn, "room:user-leave", {
            username,
            message: `${username} left the room`
          })
        }
      })
    })
  }
}

export default RoomManager