import type { PlayerInfo } from "../types";

export class Player {
  score = 0;
  hasGuessed = false;

  constructor(
    public readonly id: string,
    public name: string,
    public isHost = false,
    public readonly avatar = 0
  ) {}

  toJSON(): PlayerInfo {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isHost: this.isHost,
      avatar: this.avatar,
      hasGuessed: this.hasGuessed,
    };
  }
}