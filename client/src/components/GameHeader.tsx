import { useGame } from "../context/GameContext";

function WordDisplay({ text }: { text: string }) {
  const letters = text.replace(/ /g, "").length;
  return (
    <div className="word">
      {[...text].map((ch, i) =>
        ch === " " ? (
          <span key={i} className="word__gap" />
        ) : (
          <span key={i} className="word__char">
            {ch === "_" ? "" : ch}
          </span>
        )
      )}
      <small className="word__len">{letters}</small>
    </div>
  );
}

export function GameHeader() {
  const g = useGame();
  const isDrawer = g.myId === g.drawerId;

  let label = "WAITING";
  let center = <span className="word-status">Get ready...</span>;

  if (g.phase === "drawing") {
    label = isDrawer ? "DRAW THIS" : "GUESS THIS";
    center = <WordDisplay text={isDrawer ? (g.word ?? "") : g.hint} />;
  } else if (g.phase === "choosing") {
    center = (
      <span className="word-status">
        {isDrawer ? "Pick a word to draw" : `${g.drawerName} is choosing a word`}
      </span>
    );
  } else if (g.phase === "roundEnd") {
    label = "ROUND OVER";
    center = <span className="word-status">Next turn starting...</span>;
  } else if (g.phase === "gameOver") {
    label = "GAME OVER";
    center = <span className="word-status">Final results</span>;
  }

  return (
    <header className="game-header">
      <div className="game-header__timer" title="Time left">
        <span aria-hidden>⏰</span>
        <strong>{g.phase === "drawing" ? g.timeLeft : "-"}</strong>
      </div>
      <div className="game-header__center">
        <span className="word-label">{label}</span>
        {center}
      </div>
      <div className="game-header__round">
        Round {Math.max(g.round, 1)} of {g.totalRounds}
      </div>
    </header>
  );
}