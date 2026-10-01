import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useGame } from "../context/GameContext";
import { NAME_KEY } from "../lib/constants";
import { Game } from "./Game";
import { Lobby } from "./Lobby";

// Shown when someone opens an invite link without being in the room yet
function JoinPrompt({ roomId }: { roomId: string }) {
  const game = useGame();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const join = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a name to continue");
    localStorage.setItem(NAME_KEY, trimmed);
    setBusy(true);
    setError(null);
    try {
      await game.joinRoom(roomId, trimmed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shownError = error ?? game.error;

  return (
    <main className="home">
      <Logo />
      <form className="home__card" onSubmit={join}>
        <h2 className="panel__title panel__title--light">Join room {roomId}</h2>
        {shownError && <div className="error-banner">{shownError}</div>}
        <input
          className="input input--lg"
          placeholder="Enter your name"
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn--green btn--lg" disabled={busy || !game.connected}>
          Join game
        </button>
        <Link to="/" className="home__link">
          Back to home
        </Link>
      </form>
    </main>
  );
}

export function RoomPage() {
  const { roomId = "" } = useParams();
  const game = useGame();
  const id = roomId.toUpperCase();

  if (game.roomId !== id) return <JoinPrompt roomId={id} />;
  return game.phase === "lobby" ? <Lobby /> : <Game />;
}