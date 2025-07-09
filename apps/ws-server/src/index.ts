import express from "express";
import { verifyJwt } from "@repo/auth";
import { WebSocket, WebSocketServer } from "ws";
import "dotenv/config";
import RoomManager from "./lib/room-manager";
import { WSClientRequest } from "./types/types";

const PORT = process.env.PORT || 3002;
const app = express();

const server = app.listen(PORT, () => {
  console.log("listening on port: ", PORT);
});

server.on("error", (err) => {
  console.error("Socket Error", err);
});

const wss = new WebSocketServer({ noServer: true });
const roomManager = new RoomManager();

wss.on("wsClientError", (err) => {
  console.error("Web Socket Client Error", err);
});

wss.on("error", (err) => {
  console.error("Web Socket Server Error", err);
});

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

wss.on("connection", (ws: WebSocket, req) => {

  roomManager.initializeConnection(ws);
  const obj = Object.entries(roomManager.rooms)
  console.log(obj)

  ws.on("message", (data) => {

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
});
