import type { Server, Socket } from "socket.io";
import type { RoomManager } from "../classes/RoomManager";
import { Player } from "../classes/Player";
import { sanitizeSettings } from "../utils/settings";
import { cleanName } from "../utils/sanitize";

const AVATAR_COUNT = 12;
const randomAvatar = () => Math.floor(Math.random() * AVATAR_COUNT);

export function removeFromRoom(io: Server, socket: Socket, rooms: RoomManager) {
  const roomId = socket.data.roomId as string | undefined;
  const room = roomId ? rooms.get(roomId) : undefined;
  if (!room) return;

  const leaving = room.removePlayer(socket.id);
  socket.leave(room.id);
  socket.data.roomId = undefined;

  if (room.isEmpty) {
    room.game?.destroy();
    rooms.remove(room.id);
    return;
  }

  io.to(room.id).emit("player_left", {
    playerId: socket.id,
    playerName: leaving?.name ?? "A player",
    players: room.listPlayers(),
  });
  room.game?.onPlayerLeave(socket.id);
}

export function registerRoomHandlers(io: Server, socket: Socket, rooms: RoomManager) {
  socket.on("create_room", (payload, ack) => {
    const name = cleanName(payload?.hostName);
    if (!name) return ack?.({ error: "Name is required" });
    if (socket.data.roomId) return ack?.({ error: "You are already in a room" });

    const room = rooms.create(sanitizeSettings(payload?.settings));
    const host = new Player(socket.id, name, true, randomAvatar());
    room.addPlayer(host);

    socket.join(room.id);
    socket.data.roomId = room.id;
    ack?.({ roomId: room.id, player: host.toJSON(), players: room.listPlayers(), settings: room.settings });
  });

  socket.on("join_room", (payload, ack) => {
    const room = rooms.get(String(payload?.roomId ?? ""));
    const name = cleanName(payload?.playerName);

    if (!room) return ack?.({ error: "Room not found" });
    if (!name) return ack?.({ error: "Name is required" });
    if (room.isFull) return ack?.({ error: "Room is full" });
    if (socket.data.roomId) return ack?.({ error: "You are already in a room" });

    const player = new Player(socket.id, name, false, randomAvatar());
    room.addPlayer(player);
    socket.join(room.id);
    socket.data.roomId = room.id;

    const players = room.listPlayers();
    socket.to(room.id).emit("player_joined", { player: player.toJSON(), players });
    ack?.({ roomId: room.id, player: player.toJSON(), players, settings: room.settings });

    // Late joiners get the current game state
    room.game?.syncPlayer(socket.id);
  });

  socket.on("disconnect", () => removeFromRoom(io, socket, rooms));
}