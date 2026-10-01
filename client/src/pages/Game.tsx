import { useState } from "react";
import { Canvas } from "../components/Canvas";
import { ChatBox } from "../components/ChatBox";
import { GameHeader } from "../components/GameHeader";
import { GameOver } from "../components/GameOver";
import { PlayerList } from "../components/PlayerList";
import { RoundSummary } from "../components/RoundSummary";
import { Toolbar } from "../components/Toolbar";
import { WordPicker } from "../components/WordPicker";
import { useGame } from "../context/GameContext";
import type { Tool } from "../types";

export function Game() {
  const game = useGame();
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(10);
  const [tool, setTool] = useState<Tool>("pen");

  const me = game.players.find((p) => p.id === game.myId);
  const isDrawer = game.myId === game.drawerId;
  const canDraw = isDrawer && game.phase === "drawing";

  let placeholder = "Type your guess here...";
  if (isDrawer) placeholder = "Chat with other players...";
  else if (me?.hasGuessed) placeholder = "You guessed it! Chat with fellow guessers...";

  const renderOverlay = () => {
    if (game.phase === "choosing") {
      if (isDrawer && game.wordOptions) {
        return <WordPicker words={game.wordOptions} onPick={game.chooseWord} />;
      }
      return (
        <div className="overlay">
          <h2 className="overlay__title">{game.drawerName} is choosing a word...</h2>
        </div>
      );
    }
    if (game.phase === "roundEnd" && game.roundResult) {
      return <RoundSummary word={game.roundResult.word} scores={game.roundResult.scores} />;
    }
    if (game.phase === "gameOver" && game.gameOver) {
      return (
        <GameOver
          winner={game.gameOver.winner}
          leaderboard={game.gameOver.leaderboard}
          isHost={Boolean(me?.isHost)}
          onPlayAgain={game.playAgain}
        />
      );
    }
    return null;
  };

  return (
    <div className="game">
      <GameHeader />

      <div className="game__body">
        <aside className="game__side game__players">
          <PlayerList players={game.players} myId={game.myId} drawerId={game.drawerId} ranked />
        </aside>

        <section className="game__center">
          <div className="canvas-wrap">
            <Canvas canDraw={canDraw} color={color} size={size} tool={tool} />
            {renderOverlay()}
          </div>
          {canDraw && (
            <Toolbar
              color={color}
              size={size}
              tool={tool}
              onColor={setColor}
              onSize={setSize}
              onTool={setTool}
            />
          )}
        </section>

        <aside className="game__side game__chat">
          <ChatBox messages={game.messages} placeholder={placeholder} onSend={game.sendMessage} />
        </aside>
      </div>
    </div>
  );
}