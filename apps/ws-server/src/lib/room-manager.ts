import { WebSocket } from "ws";
import { generateRoomId } from "./room-id-generator";
import {  WSResponse } from "@repo/shared/types";

type Rooms = Record<string, Set<WebSocket>>
type UserConnections = Record<string, Set<WebSocket>>
type UserRooms = Record<string, string>

class RoomManager {

  rooms: Rooms = {}
  userConnections: UserConnections = {}
  userRooms: UserRooms = {}

  private generateUniqueRoomId = () => {
    let id 
    do {
      id = generateRoomId()
    } while(id in this.rooms);

    return id
  }

  private addToRoom = (client: WebSocket, newRoomId: string) => {  
    
    if(!client.userId) {
      console.error("no user_id or client id: from addToRoom()")
      return
    }
 
    // client -> solo-client
    if(!client.roomId) {
      client.roomId = newRoomId
      this.rooms[newRoomId] = new Set([client])
      return
    }

    // solo-client -> client inside a room (also delete the corresponding solo-room)
    const soloRoomId = client.roomId
    client.roomId = newRoomId
    delete this.rooms[soloRoomId]
    
    if(!this.rooms[newRoomId]) {
      this.rooms[newRoomId] = new Set()
    }

    this.rooms[newRoomId].add(client)
  }


  initializeConnection = (client: WebSocket) => {
    if(!client?.userId) return;

    const userId = client.userId
    
    
    if(!(userId in this.userConnections)) {
      this.userConnections[userId] = new Set([client]);
    }
    else {
      this.userConnections[userId]?.add(client)
    }

    // if client-userId is already in a room, join this client to that same room  
    if(this.userRooms[userId] && this.rooms[this.userRooms[userId]]) {
      const roomId = this.userRooms[userId]
      client.roomId = roomId
      this.rooms[roomId]?.add(client)

      const response: WSResponse<{roomId: string, message: string}> = {
        type: "response",
        eventType: "room:join",
        success: true,
        data: {
          roomId,
          message: `joined room: ${roomId} successfully`
        }
      }

      client.send(JSON.stringify(response))
    }

    else {
      this.addSoloClient(client)
    }
  }

  addSoloClient = (client: WebSocket) => {
    if(!client.userId) {
      console.log("no user_id")
      return
    }

    const roomId = `solo:${crypto.randomUUID()}`
    this.addToRoom(client, roomId)
    
    const response: WSResponse<{roomId: string, message: string}> = {
      type: "response",
      eventType: "solo:init",
      success: true,
      data: {
        roomId,
        message: "connection established successfully"
      }
    }

    client.send(JSON.stringify(response))
  }

  createRoom = (client: WebSocket) => {
    if(!client.userId) {
      console.log("no user_id")
      return
    }
    const userId = client.userId
    // prevent if already in other room
    if(this.userRooms[userId]) {  
      console.error(`user is already in a room: ${client.userId}`)
      return
    }
    const createdRoomId = this.generateUniqueRoomId()

    // prevent creating room if there are no connections
    if(!this.userConnections[userId]) {
      console.error("create error")
      return
    }

    // add each client in userConnections to newRoom (from solo-client -> client-in-room)
    const response: WSResponse<{roomId: string, message: string}> = {
      type: "response",
      eventType: "room:create",
      success: true,
      data: {
        roomId: createdRoomId,
        message: "room created successfully"
      }
    }
    for(const tabClient of this.userConnections[userId]) {
      this.addToRoom(tabClient, createdRoomId)
      tabClient.send(JSON.stringify(response))
    }

    this.userRooms[userId] = createdRoomId
  }

  joinRoom = (client: WebSocket, roomId: string) => {
    if(!client.userId) {
      console.log("no user_id")
      return
    }

    const userId = client.userId
    
    if(!(roomId in this.rooms)) {
      const errorResponse: WSResponse = {
        type: "response",
        eventType: "room:join",
        success: false,
        error: {
          message: `Invalid room_id: ${roomId}`
        }
      }
      client.send(JSON.stringify(errorResponse))
      return
    }

    if(!this.userConnections[userId]) {
      console.error("join error")
      return
    }

    // prevent if already in other room
    if(this.userRooms[userId]) {  
      console.error(`user is already in a room: ${client.userId}`)
      return
    }
    
    const response: WSResponse<{roomId: string, message: string}> = {
      type: "response",
      eventType: "room:join",
      success: true,
      data: {
        roomId,
        message: `joined room: ${roomId} successfully`
      }
    }

    for(const tabClient of this.userConnections[userId]) {
      this.addToRoom(tabClient, roomId)
      tabClient.send(JSON.stringify(response))
    }

    this.userRooms[userId] = roomId
  }


  leaveRoom = (client: WebSocket) => {
    if(!client.userId) {
      console.error("leave room: no user")
      return
    }

    if(!client.roomId) {
      console.error(`leave room: roomId is undefined`)
      return
    }

    const userId = client.userId
    if(!this.userRooms[userId]) {
      console.error(`leave room: player is not in any room`)
      return
    }

    if(!this.userConnections[userId] || !this.userRooms[userId]) {
      console.error("leave room: error")
      return
    }
    const roomId = client.roomId

    const response: WSResponse = {
      type: "response",
      eventType: "room:leave",
      success: true,
      data: {
        message: `you have left the room: ${roomId} successfully`
      }
    }

    delete this.userRooms[userId]
    
    for(const tabClient of this.userConnections[userId]) {
      tabClient.roomId = undefined
      this.rooms[roomId]?.delete(tabClient)
      tabClient.send(JSON.stringify(response))
      this.addSoloClient(tabClient)
    }
    
    if(this.rooms[roomId]?.size == 0) delete this.rooms[roomId]
  }

  handleDisconnect = (client: WebSocket) => {
    if(!client.userId) {
      console.error("no user id: handleDisconnect")
      return
    }

    if(!client.roomId) {
      console.error('no room id: handleDisconnect')
      return
    }

    const userId = client.userId
    const roomId = client.roomId

    this.rooms[roomId]?.delete(client)
    this.userConnections[userId]?.delete(client)

    if(this.rooms[roomId]?.size === 0) delete this.rooms[roomId]
    if(this.userConnections[userId]?.size === 0) {
      delete this.userConnections[userId]
      delete this.userRooms[userId]
    }
  } 

  handleCodeChange = (client: WebSocket, code: string) => {

    if(!client.userId) {
      console.error("no user id: handleCodeChange")
      return
    }

    if(!client.roomId) {
      console.error('no room id: handleCodeChange')
      return
    }

    const roomId = client.roomId

    if(!this.rooms[roomId]) {
      console.error('there are no rooms with this roomId: handleCodeChange')
      return
    }

    const response: WSResponse<{latestCode: string}> = {
      type: "response",
      eventType: "room:codeChange",
      success: true,
      data: {
        latestCode: code
      }
    }
    this.rooms[roomId].forEach((ws: WebSocket) => {
      if(ws != client && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response))
      }
    })
  }
}

export default RoomManager