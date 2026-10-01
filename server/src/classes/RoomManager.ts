import { Room } from "./Room";
import type { RoomSettings } from "../types";
import { generateRoomCode } from "../utils/roomCode";

export interface PublicRoomSummary {
  id: string;
  host: string;
  players: number;
  maxPlayers: number;
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  create(settings: RoomSettings): Room {
    let id = generateRoomCode();
    while (this.rooms.has(id)) id = generateRoomCode();
    const room = new Room(id, settings);
    this.rooms.set(id, room);
    return room;
  }

  get(id: string) {
    return this.rooms.get(id.trim().toUpperCase());
  }

  remove(id: string) {
    this.rooms.delete(id);
  }

  listPublic(): PublicRoomSummary[] {
    return [...this.rooms.values()]
      .filter((r) => !r.settings.isPrivate && !r.game && !r.isFull)
      .map((r) => ({
        id: r.id,
        host: r.playerList.find((p) => p.isHost)?.name ?? "Unknown",
        players: r.playerCount,
        maxPlayers: r.settings.maxPlayers,
      }));
  }
}