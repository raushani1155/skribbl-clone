import "dotenv/config";
import fs from "fs";
import http from "http";
import path from "path";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { RoomManager } from "./classes/RoomManager";
import { registerRoomHandlers } from "./handlers/roomHandler";
import { registerGameHandlers } from "./handlers/gameHandler";
import { registerDrawHandlers } from "./handlers/drawHandler";
import { registerChatHandlers } from "./handlers/chatHandler";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
const rooms = new RoomManager();

app.use(cors());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/rooms", (_req, res) => res.json(rooms.listPublic()));

// In production the same service serves the built React app
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_URL } });

io.on("connection", (socket) => {
  registerRoomHandlers(io, socket, rooms);
  registerGameHandlers(io, socket, rooms);
  registerDrawHandlers(io, socket, rooms);
  registerChatHandlers(io, socket, rooms);
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));