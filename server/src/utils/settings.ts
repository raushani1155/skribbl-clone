import type { RoomSettings } from "../types";

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

export function sanitizeSettings(raw: Partial<RoomSettings> = {}): RoomSettings {
  return {
    maxPlayers: clamp(raw.maxPlayers, 2, 20, 8),
    rounds: clamp(raw.rounds, 2, 10, 3),
    drawTime: clamp(raw.drawTime, 15, 240, 80),
    wordCount: clamp(raw.wordCount, 1, 5, 3),
    hints: clamp(raw.hints, 0, 5, 2),
    isPrivate: raw.isPrivate === undefined ? true : Boolean(raw.isPrivate),
  };
}