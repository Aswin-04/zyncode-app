import express from "express";
import "dotenv/config";
import configureWebSocketServer from "./socket";


const PORT = process.env.PORT || 8080;
const app = express();

const server = app.listen(PORT, () => {
  console.log("listening on port: ", PORT);
});

server.on("error", (err) => {
  console.error("Socket Error", err);
});

configureWebSocketServer(server)
