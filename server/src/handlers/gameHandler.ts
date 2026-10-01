import type { Server, Socket } from "socket.io";
import type { RoomManager } from "../classes/RoomManager";
import { Game } from "../classes/Game";
import { sanitizeSettings } from "../utils/settings";
import { getContext } from "./context";
import { removeFromRoom } from "./roomHandler";
export function registerGameHandlers(io: Server, socket: Socket, rooms: RoomManager) {
  socket.on("update_settings", (raw) => {
    const ctx = getContext(socket, rooms);
    if (!ctx || !ctx.player.isHost || ctx.room.game) return;

    const settings = sanitizeSettings(raw);
    // The cap can never drop below the players already inside
    settings.maxPlayers = Math.max(settings.maxPlayers, ctx.room.playerCount);
    ctx.room.settings = settings;
    io.to(ctx.room.id).emit("settings_updated", settings);
  });

  socket.on("start_game", (_payload, ack) => {
    const ctx = getContext(socket, rooms);
    if (!ctx || !ctx.player.isHost) return ack?.({ error: "Only the host can start the game" });
    if (ctx.room.game) return ack?.({ error: "Game already started" });

    const game = new Game(ctx.room, io);
    ctx.room.game = game;
    const error = game.start();
    if (error) {
      ctx.room.game = null;
      return ack?.({ error });
    }
    ack?.({ ok: true });
  });

  socket.on("word_chosen", (payload) => {
    const ctx = getContext(socket, rooms);
    ctx?.room.game?.chooseWord(ctx.player.id, String(payload?.word ?? ""));
  });

  socket.on("play_again", () => {
    const ctx = getContext(socket, rooms);
    if (!ctx || !ctx.player.isHost || ctx.room.game?.phase !== "gameOver") return;
    ctx.room.game.destroy();
    ctx.room.game = null;
    ctx.room.resetScores();
    io.to(ctx.room.id).emit("lobby_reset", { players: ctx.room.listPlayers() });
  });

  socket.on("kick_player", (payload) => {
    const ctx = getContext(socket, rooms);
    const targetId = String(payload?.playerId ?? "");
    if (!ctx || !ctx.player.isHost || targetId === socket.id) return;

    const target = io.sockets.sockets.get(targetId);
    if (!target || target.data.roomId !== ctx.room.id) return;
    target.emit("kicked");
    removeFromRoom(io, target, rooms);
  });
}