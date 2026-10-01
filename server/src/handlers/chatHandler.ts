import type { Server, Socket } from "socket.io";
import type { RoomManager } from "../classes/RoomManager";
import { cleanText } from "../utils/sanitize";
import { getContext } from "./context";

export function registerChatHandlers(io: Server, socket: Socket, rooms: RoomManager) {
  // Guess and chat share one path on purpose: the server decides what a message
  // is, so a modified client can't leak the word by sending it as "chat".
  const onMessage = (payload: { text?: unknown }) => {
    const ctx = getContext(socket, rooms);
    const text = cleanText(payload?.text);
    if (!ctx || !text) return;

    if (ctx.room.game) {
      ctx.room.game.handleGuess(ctx.player, text);
    } else {
      io.to(ctx.room.id).emit("chat_message", {
        playerId: ctx.player.id,
        playerName: ctx.player.name,
        text,
        kind: "chat",
      });
    }
  };

  socket.on("guess", onMessage);
  socket.on("chat", onMessage);
}