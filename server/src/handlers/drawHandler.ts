import type { Server, Socket } from "socket.io";
import type { RoomManager } from "../classes/RoomManager";
import { getContext } from "./context";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const clamp01 = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
};

export function registerDrawHandlers(io: Server, socket: Socket, rooms: RoomManager) {
  socket.on("draw_start", (p) => {
    const ctx = getContext(socket, rooms);
    const game = ctx?.room.game;
    if (!ctx || !game) return;

    const stroke = {
      x: clamp01(p?.x),
      y: clamp01(p?.y),
      color: HEX_COLOR.test(String(p?.color)) ? String(p.color) : "#000000",
      size: Math.min(60, Math.max(1, Number(p?.size) || 4)),
    };
    if (game.startStroke(ctx.player.id, stroke)) {
      socket.to(ctx.room.id).emit("draw_data", { type: "start", ...stroke });
    }
  });

  socket.on("draw_move", (p) => {
    const ctx = getContext(socket, rooms);
    const game = ctx?.room.game;
    if (!ctx || !game) return;

    const point = { x: clamp01(p?.x), y: clamp01(p?.y) };
    if (game.extendStroke(ctx.player.id, point)) {
      socket.to(ctx.room.id).emit("draw_data", { type: "move", ...point });
    }
  });

  socket.on("draw_end", () => {
    const ctx = getContext(socket, rooms);
    if (ctx?.room.game?.endStroke(ctx.player.id)) {
      socket.to(ctx.room.id).emit("draw_data", { type: "end" });
    }
  });

  socket.on("draw_undo", () => {
    const ctx = getContext(socket, rooms);
    if (ctx?.room.game?.undo(ctx.player.id)) io.to(ctx.room.id).emit("draw_undo");
  });

  socket.on("canvas_clear", () => {
    const ctx = getContext(socket, rooms);
    if (ctx?.room.game?.clear(ctx.player.id)) io.to(ctx.room.id).emit("canvas_clear");
  });

  // A canvas that mounts late (or after a reconnect) asks for what it missed
  socket.on("request_history", () => {
    const ctx = getContext(socket, rooms);
    if (ctx?.room.game) socket.emit("draw_history", { strokes: ctx.room.game.getStrokes() });
  });
}