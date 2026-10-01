import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { PlayerList } from "../components/PlayerList";
import { SettingsForm } from "../components/SettingsForm";
import { useGame } from "../context/GameContext";

export function Lobby() {
  const game = useGame();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = game.players.find((p) => p.id === game.myId);
  const isHost = Boolean(me?.isHost);
  const inviteLink = `${window.location.origin}/room/${game.roomId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy automatically, please copy the link manually.");
    }
  };

  const start = () => {
    setError(null);
    game.startGame().catch((e: Error) => setError(e.message));
  };

  const leave = () => {
    game.leaveRoom();
    navigate("/");
  };

  return (
    <main className="lobby">
      <Logo small />

      <div className="lobby__grid">
        <section className="panel">
          <h2 className="panel__title">Settings</h2>
          {game.settings && (
            <SettingsForm settings={game.settings} editable={isHost} onChange={game.updateSettings} />
          )}
          {!isHost && <p className="lobby__hint">Only the host can change settings.</p>}
        </section>

        <section className="panel">
          <h2 className="panel__title">
            Players {game.players.length}/{game.settings?.maxPlayers}
          </h2>
          <PlayerList
            players={game.players}
            myId={game.myId}
            onKick={isHost ? game.kickPlayer : undefined}
          />
        </section>
      </div>

      <section className="lobby__actions">
        {error && <div className="error-banner">{error}</div>}

        <div className="invite">
          <span className="invite__code">Room code: {game.roomId}</span>
          <input className="input invite__link" readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
          <button className="btn btn--orange" onClick={copyLink}>
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>

        <div className="lobby__buttons">
          <button className="btn btn--ghost" onClick={leave}>
            Leave
          </button>
          {isHost ? (
            <button className="btn btn--green btn--lg" onClick={start} disabled={game.players.length < 2}>
              {game.players.length < 2 ? "Waiting for players..." : "Start game"}
            </button>
          ) : (
            <span className="lobby__waiting">Waiting for the host to start...</span>
          )}
        </div>
      </section>
    </main>
  );
}