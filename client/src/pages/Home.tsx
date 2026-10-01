import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useGame } from "../context/GameContext";
import { NAME_KEY } from "../lib/constants";
import { SERVER_URL } from "../lib/socket";
import type { PublicRoom } from "../types";

export function Home() {
  const game = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [code, setCode] = useState("");
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch(`${SERVER_URL}/api/rooms`)
        .then((r) => r.json())
        .then(setRooms)
        .catch(() => setRooms([]));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const submit = async (action: (playerName: string) => Promise<string>) => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a name to continue");
    localStorage.setItem(NAME_KEY, trimmed);
    setBusy(true);
    setError(null);
    try {
      const roomId = await action(trimmed);
      navigate(`/room/${roomId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const joinByCode = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) submit((n) => game.joinRoom(code, n));
  };

  const shownError = error ?? game.error;

  return (
    <main className="home">
      <Logo />

      <section className="home__card">
        {shownError && <div className="error-banner">{shownError}</div>}
        {!game.connected && <div className="error-banner">Connecting to server...</div>}

        <input
          className="input input--lg"
          placeholder="Enter your name"
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="btn btn--green btn--lg"
          disabled={busy || !game.connected}
          onClick={() => submit((n) => game.createRoom(n))}
        >
          Create room
        </button>

        <div className="home__divider">or join with a code</div>

        <form className="home__row" onSubmit={joinByCode}>
          <input
            className="input"
            placeholder="Room code"
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button className="btn btn--orange" disabled={busy || !game.connected}>
            Join
          </button>
        </form>
      </section>

      <section className="home__card">
        <h2 className="panel__title panel__title--light">Public rooms</h2>
        {rooms.length === 0 ? (
          <p className="rooms__empty">No public rooms right now. Create one and untick "Private room" in the lobby.</p>
        ) : (
          <ul className="rooms">
            {rooms.map((r) => (
              <li key={r.id} className="rooms__item">
                <div>
                  <strong>{r.host}'s room</strong>
                  <small>
                    {r.players}/{r.maxPlayers} players
                  </small>
                </div>
                <button
                  className="btn btn--orange"
                  disabled={busy || !game.connected}
                  onClick={() => submit((n) => game.joinRoom(r.id, n))}
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}