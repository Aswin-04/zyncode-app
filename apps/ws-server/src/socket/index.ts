import "dotenv/config";
import { Server } from 'http'
import { verifyJwt } from "@repo/auth";
import {WebSocket,  WebSocketServer } from "ws";
import RoomManager from "../lib/room-manager";
import { WSClientRequest } from "../types/types"

  const HEARTBEAT_INTERVAL = 1000 * 10  // 10 sec
  const HEARTBEAT_VALUE = 1

  const ping = (ws: WebSocket) => {
    ws.send(HEARTBEAT_VALUE, {binary: true})
  }

export default function configureWebSocketServer(server: Server) {

  const wss = new WebSocketServer({ noServer: true });
  const roomManager = new RoomManager();
  
  server.on("upgrade", (req, socket, head) => {
    let user;
    try {
      const url = new URL(req?.url as string, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      if (!token) throw new Error("Missing token");
      user = verifyJwt(token);
    } catch (err: any) {
      console.error("WebSocket Auth Failed:", err.message);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    console.log("WebSocket Auth Success, (user):", user);

    wss.handleUpgrade(req, socket, head, (ws: WebSocket, req) => {
      ws.userId = (user as any).userId || ""
      wss.emit("connection", ws, req);
    });
  });


  wss.on("wsClientError", (err) => {
    console.error("Web Socket Client Error", err);
  });

  wss.on("error", (err) => {
    console.error("Web Socket Server Error", err);
  });


  wss.on("connection", (ws: WebSocket, req) => {
    ws.isAlive = true
    roomManager.initializeConnection(ws);
    const obj = Object.entries(roomManager.rooms)
    console.log(obj)

    ws.on("message", (data, isBinary) => {

      if(isBinary && (data as any)[0] === HEARTBEAT_VALUE) {
        ws.isAlive = true
        console.log('firing to server: pong')
        return
      }

      const request:WSClientRequest = JSON.parse(data.toString())
      switch (request.type) {
        case "create":
          roomManager.createRoom(ws);
          break;

        case "join":
          roomManager.joinRoom(ws, request.payload.roomId);
          break;

        case "leave":
          roomManager.leaveRoom(ws);
          break;

        case "codeChange":
          break;

        default:
          console.error(`Invalid request type ${(request as any).type}`);
          break;
      }

      const obj = Object.entries(roomManager.rooms)
      console.log(obj)
    });

    ws.on('close', () => {
      console.log('Connection closed');
      roomManager.handleDisconnect(ws)
      const obj = Object.entries(roomManager.rooms)
      console.log(obj)
    });
  });
  

  const interval = setInterval(() => {
    wss.clients.forEach((client: WebSocket) => {
      if(!client.isAlive) {
        client.terminate()
        return
      }

      client.isAlive = false 
      console.log('firing to client: ping')
      ping(client)
    })
  }, HEARTBEAT_INTERVAL)


  wss.on('close', () => {
    clearInterval(interval)
  })
}