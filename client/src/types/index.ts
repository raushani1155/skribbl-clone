export type Phase = "lobby" | "choosing" | "drawing" | "roundEnd" | "gameOver";
export type Tool = "pen" | "eraser";

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

export interface ChatMessage {
  id: number;
  kind: "chat" | "guess" | "private" | "system" | "correct" | "close";
  name?: string;
  text: string;
}

export interface PublicRoom {
  id: string;
  host: string;
  players: number;
  maxPlayers: number;
}