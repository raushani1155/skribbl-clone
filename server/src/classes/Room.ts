import type { Game } from "./Game";
import { Player } from "./Player";
import type { PlayerInfo, RoomSettings } from "../types";

export class Room {
  game: Game | null = null;
  private players = new Map<string, Player>();

  constructor(
    public readonly id: string,
    public settings: RoomSettings
  ) {}

  get playerCount() {
    return this.players.size;
  }

  get isFull() {
    return this.players.size >= this.settings.maxPlayers;
  }

  get isEmpty() {
    return this.players.size === 0;
  }

  get playerList(): Player[] {
    return [...this.players.values()];
  }

  addPlayer(player: Player) {
    this.players.set(player.id, player);
  }

  removePlayer(id: string): Player | undefined {
    const leaving = this.players.get(id);
    this.players.delete(id);
    // Hand host rights to the next player if the host leaves
    if (leaving?.isHost) {
      const next = this.players.values().next().value;
      if (next) next.isHost = true;
    }
    return leaving;
  }

  getPlayer(id: string) {
    return this.players.get(id);
  }

  playerIds(): string[] {
    return [...this.players.keys()];
  }

  listPlayers(): PlayerInfo[] {
    return this.playerList.map((p) => p.toJSON());
  }

  resetScores() {
    this.playerList.forEach((p) => {
      p.score = 0;
      p.hasGuessed = false;
    });
  }
}