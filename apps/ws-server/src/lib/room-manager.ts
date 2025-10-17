import { WebSocket } from "ws";
import { generateRoomId } from "./room-id-generator";
import {  WSResponse, WSEventType } from "@repo/shared/types";
import Redis from 'ioredis'
import { getRedisClient, getRedisSubscriber } from "@repo/redis";

// room:roomId --> set of userIds
// user:userId --> roomId

interface ExecutionResult {
  username: string, 
  stdin: string,
  stdout: string
  stderr: string 
  verdict: string
}

const USER_KEY_PREFIX = 'user:'
const ROOM_KEY_PREFIX = 'room:'
const TTL = 120 * 1000  // in ms
const FLUSH_INTERVAL = 20 * 1000 // in ms

class RoomManager {
  private userConnections: Record<string, Set<WebSocket>> = {}
  private latestRoomCode: Record<string, string> = {}
  private roomCleanupTimers: Record<string, NodeJS.Timeout> = {}
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
        users.forEach(userId => this.broadcastToAll(userId, executionResult))
      }

      if(channel.startsWith(`${USER_KEY_PREFIX}`)) {
        const userId = channel.substring(USER_KEY_PREFIX.length)
        this.broadcastToAll(userId, executionResult)
      }
    })
  }

  private broadcastToAll = (userId: string, data: object) => {
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

  private sendResponse = (client: WebSocket, eventType: WSEventType, data: object) => {
    const response: WSResponse = {type: "response", eventType, success: true, data}
    client.send(JSON.stringify(response))
  }

  private sendError = (client: WebSocket, eventType: WSEventType, message: string) => {
    const response: WSResponse = {type: "response", eventType, success: false, error: {message}}
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
          const roomSize = await this.redis.scard(this.getRoomKey(roomId))
          if(roomSize == 0) this.scheduleRoomCleanup(roomId)
        }
      }
    }
  }

  public createRoom = async (client: WebSocket) => {
    const {userId} = client
    if(!userId) return this.sendError(client, "room:create", "User not authenticated.")
    
    const newRoomId = await this.generateUniqueRoomId()
    await this.setUserRoomState(userId, newRoomId, "room:create")
  }

  public joinRoom = async (client: WebSocket, roomIdToJoin: string) => {
    console.log(roomIdToJoin)
    const {userId} = client
    if(!userId) return this.sendError(client, "room:join", "User not authenticated.")

    const roomKey = this.getRoomKey(roomIdToJoin)
    if(!(await this.redis.exists(roomKey))) {
      this.sendError(client, "room:join", `Room with ID '${roomIdToJoin}' does not exist.`)
    }
    await this.setUserRoomState(userId, roomIdToJoin, "room:join")    
  }

  public leaveRoom = async (client: WebSocket) => {
    const {userId, roomId} = client 
    if(!userId || !roomId) return this.sendError(client, "room:leave", "You are not currently in a room")
    
    const pipeline = this.redis.pipeline()
    pipeline.srem(this.getRoomKey(roomId), userId)
    pipeline.del(this.getUserKey(userId))
    pipeline.del(this.getRoomCodeKey(roomId))
    await pipeline.exec()

    delete this.latestRoomCode[roomId]

    this.userConnections[userId]?.forEach((conn) => {
      conn.roomId = undefined 
      this.sendResponse(conn, "room:leave", {roomId, message: `You have successfully left room: ${roomId}.` })
    })
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
  }

  private getLatestRoomCode = async(roomId: string) => {
    let latestCode = this.latestRoomCode[roomId] || ""
    if(!latestCode) {
      latestCode = await this.redis.get(this.getRoomCodeKey(roomId)) || ""
    }
    return latestCode
  }

  private scheduleRoomCleanup = (roomId: string) => {
    if(roomId in this.roomCleanupTimers) {
      clearTimeout(this.roomCleanupTimers[roomId])
    }

    const timeout = setTimeout(async () => {
      const pipeline = this.redis.pipeline()
      pipeline.del(this.getRoomKey(roomId))
      pipeline.del(this.getRoomCodeKey(roomId))
      await pipeline.exec()

      delete this.latestRoomCode[roomId]
      delete this.roomCleanupTimers[roomId]

      console.log(`Room ${roomId} cleaned up after TTL`)      
    }, TTL)

    this.roomCleanupTimers[roomId] = timeout
  }

  private cancelRoomCleanup = (roomId: string) => {
    if(roomId in this.roomCleanupTimers) {
      clearTimeout(this.roomCleanupTimers[roomId])
      delete this.roomCleanupTimers[roomId]
    }
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

      client.roomId = roomId 
      this.cancelRoomCleanup(roomId)

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
  }
}

export default RoomManager