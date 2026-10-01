import type { PlayerInfo } from "../types";
import { Avatar } from "./Avatar";

interface Props {
  word: string;
  scores: PlayerInfo[];
}

export function RoundSummary({ word, scores }: Props) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  return (
    <div className="overlay">
      <p className="overlay__sub">The word was</p>
      <h2 className="overlay__title overlay__title--word">{word}</h2>
      <ul className="scoreboard">
        {sorted.map((p) => (
          <li key={p.id}>
            <Avatar index={p.avatar} size={28} />
            <span>{p.name}</span>
            <strong>{p.score}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}