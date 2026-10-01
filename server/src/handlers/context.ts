import type { Socket } from "socket.io";
import type { RoomManager } from "../classes/RoomManager";

// Resolves the room and player that belong to a socket, or null if it isn't in one
export function getContext(socket: Socket, rooms: RoomManager) {
  const roomId = socket.data.roomId as string | undefined;
  const room = roomId ? rooms.get(roomId) : undefined;
  const player = room?.getPlayer(socket.id);
  return room && player ? { room, player } : null;
}