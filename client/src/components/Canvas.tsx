import { useEffect, useRef, type PointerEvent } from "react";
import { socket } from "../lib/socket";
import type { Point, Stroke, Tool } from "../types";

// Logical resolution. Points travel as 0..1 fractions, so any CSS size renders the same picture.
const WIDTH = 800;
const HEIGHT = 600;
const BACKGROUND = "#ffffff";

type DrawEvent =
  | { type: "start"; x: number; y: number; color: string; size: number }
  | { type: "move"; x: number; y: number }
  | { type: "end" };

function paintStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (rest.length === 0) {
    ctx.beginPath();
    ctx.arc(first.x * WIDTH, first.y * HEIGHT, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first.x * WIDTH, first.y * HEIGHT);
  rest.forEach((p) => ctx.lineTo(p.x * WIDTH, p.y * HEIGHT));
  ctx.stroke();
}

function paintSegment(ctx: CanvasRenderingContext2D, stroke: Stroke, from: Point, to: Point) {
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x * WIDTH, from.y * HEIGHT);
  ctx.lineTo(to.x * WIDTH, to.y * HEIGHT);
  ctx.stroke();
}

function repaint(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  strokes.forEach((s) => paintStroke(ctx, s));
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

interface Props {
  canDraw: boolean;
  color: string;
  size: number;
  tool: Tool;
}

export function Canvas({ canDraw, color, size, tool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef(false);

  // Remote events: other players' strokes, undo, clear and history replay
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    repaint(ctx, strokes.current);

    const onData = (e: DrawEvent) => {
      if (e.type === "start") {
        const stroke: Stroke = { color: e.color, size: e.size, points: [{ x: e.x, y: e.y }] };
        strokes.current.push(stroke);
        paintStroke(ctx, stroke);
      } else if (e.type === "move") {
        const stroke = strokes.current[strokes.current.length - 1];
        if (!stroke) return;
        const prev = stroke.points[stroke.points.length - 1];
        const next = { x: e.x, y: e.y };
        stroke.points.push(next);
        paintSegment(ctx, stroke, prev, next);
      }
    };
    const onUndo = () => {
      strokes.current.pop();
      repaint(ctx, strokes.current);
    };
    const onClear = () => {
      strokes.current = [];
      repaint(ctx, strokes.current);
    };
    const onHistory = (p: { strokes: Stroke[] }) => {
      strokes.current = p.strokes;
      repaint(ctx, strokes.current);
    };

    socket.on("draw_data", onData);
    socket.on("draw_undo", onUndo);
    socket.on("canvas_clear", onClear);
    socket.on("draw_history", onHistory);
    socket.emit("request_history");

    return () => {
      socket.off("draw_data", onData);
      socket.off("draw_undo", onUndo);
      socket.off("canvas_clear", onClear);
      socket.off("draw_history", onHistory);
    };
  }, []);

  const toPoint = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  };

  const handleDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = toPoint(e);
    const stroke: Stroke = {
      color: tool === "eraser" ? BACKGROUND : color,
      size,
      points: [point],
    };
    strokes.current.push(stroke);
    paintStroke(canvasRef.current!.getContext("2d")!, stroke);
    drawing.current = true;
    socket.emit("draw_start", { ...point, color: stroke.color, size: stroke.size });
  };

  const handleMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const stroke = strokes.current[strokes.current.length - 1];
    if (!stroke) return;
    const point = toPoint(e);
    const prev = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);
    paintSegment(canvasRef.current!.getContext("2d")!, stroke, prev, point);
    socket.emit("draw_move", point);
  };

  const handleUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    socket.emit("draw_end");
  };

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
      width={WIDTH}
      height={HEIGHT}
      style={{ cursor: canDraw ? "crosshair" : "default" }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    />
  );
}