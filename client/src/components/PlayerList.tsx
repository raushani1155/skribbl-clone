import type { PlayerInfo } from "../types";
import { Avatar } from "./Avatar";

interface Props {
  players: PlayerInfo[];
  myId: string | null;
  drawerId?: string | null;
  ranked?: boolean;
  onKick?: (playerId: string) => void;
}

export function PlayerList({ players, myId, drawerId = null, ranked = false, onKick }: Props) {
  const list = ranked ? [...players].sort((a, b) => b.score - a.score) : players;

  return (
    <ul className="players">
      {list.map((p, i) => (
        <li
          key={p.id}
          className={`players__item${p.hasGuessed ? " players__item--guessed" : ""}`}
        >
          {ranked && <span className="players__rank">#{i + 1}</span>}
          <Avatar index={p.avatar} size={36} />
          <div className="players__info">
            <span className="players__name">
              {p.name}
              {p.id === myId && <small> (you)</small>}
              {p.isHost && <span title="Host"> 👑</span>}
            </span>
            {ranked && <span className="players__score">{p.score} pts</span>}
          </div>
          {p.id === drawerId && <span title="Drawing">✏️</span>}
          {onKick && p.id !== myId && (
            <button className="players__kick" onClick={() => onKick(p.id)} title="Kick player">
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}