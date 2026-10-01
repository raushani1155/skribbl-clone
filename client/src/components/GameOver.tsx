import type { PlayerInfo } from "../types";
import { Avatar } from "./Avatar";

interface Props {
  winner: PlayerInfo | null;
  leaderboard: PlayerInfo[];
  isHost: boolean;
  onPlayAgain: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function GameOver({ winner, leaderboard, isHost, onPlayAgain }: Props) {
  return (
    <div className="overlay">
      <h2 className="overlay__title">🏆 {winner ? `${winner.name} wins!` : "Game over"}</h2>
      <ul className="scoreboard">
        {leaderboard.map((p, i) => (
          <li key={p.id}>
            <span>{MEDALS[i] ?? `#${i + 1}`}</span>
            <Avatar index={p.avatar} size={28} />
            <span>{p.name}</span>
            <strong>{p.score}</strong>
          </li>
        ))}
      </ul>
      {isHost ? (
        <button className="btn btn--green" onClick={onPlayAgain}>
          Back to lobby
        </button>
      ) : (
        <p className="overlay__sub">Waiting for the host...</p>
      )}
    </div>
  );
}