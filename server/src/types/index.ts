export type Phase = "lobby" | "choosing" | "drawing" | "roundEnd" | "gameOver";

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  isPrivate: boolean;
}

export interface PlayerInfo {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  avatar: number;
  hasGuessed: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  color: string;
  size: number;
  points: Point[];
}