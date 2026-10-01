import type { Server } from "socket.io";
import type { Room } from "./Room";
import type { Player } from "./Player";
import type { Phase, Point, Stroke } from "../types";
import { pickWords } from "../utils/words";
import { isClose, isCorrect } from "../utils/wordMatcher";
import { buildHint, nextHintIndex } from "../utils/hints";
import { drawerPoints, guesserPoints } from "../utils/scoring";

const CHOOSE_TIME_SEC = 15;
const ROUND_END_DELAY_MS = 5000;
const MAX_STROKES = 2000;
const MAX_POINTS_PER_STROKE = 5000;

type Timer = ReturnType<typeof setTimeout>;

/**
 * Owns everything that happens between "start game" and "game over":
 * turn order, timers, hints, scoring and the stroke history.
 */
export class Game {
  phase: Phase = "lobby";
  round = 0;
  drawerId: string | null = null;

  private turnOrder: string[] = [];
  private turnIndex = -1;
  private word = "";
  private wordOptions: string[] = [];
  private revealed = new Set<number>();
  private hintTimes: number[] = [];
  private timeLeft = 0;
  private timer: Timer | null = null;
  private pause: Timer | null = null;
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;

  constructor(
    private room: Room,
    private io: Server
  ) {}

  // ---------- lifecycle ----------

  start(): string | null {
    if (this.room.playerCount < 2) return "You need at least 2 players to start";
    this.room.resetScores();
    this.round = 1;
    this.turnOrder = this.room.playerIds();
    this.turnIndex = -1;
    this.nextTurn();
    return null;
  }

  destroy() {
    this.clearTimers();
  }

  onPlayerLeave(playerId: string) {
    if (this.phase === "lobby" || this.phase === "gameOver") return;
    if (this.room.playerCount < 2) return this.endGame();
    if (playerId === this.drawerId && (this.phase === "drawing" || this.phase === "choosing")) {
      return this.endRound();
    }
    if (this.phase === "drawing" && this.allGuessed()) this.endRound();
  }

  syncPlayer(socketId: string) {
    this.emitState(socketId);
  }

  // ---------- turn flow ----------

  private nextTurn() {
    this.clearTimers();
    if (this.room.playerCount < 2) return this.endGame();

    // Find the next drawer that is still in the room
    let drawer: Player | undefined;
    while (!drawer) {
      this.turnIndex++;
      if (this.turnIndex >= this.turnOrder.length) {
        this.round++;
        if (this.round > this.room.settings.rounds) return this.endGame();
        this.turnOrder = this.room.playerIds();
        this.turnIndex = 0;
      }
      drawer = this.room.getPlayer(this.turnOrder[this.turnIndex]);
    }

    this.drawerId = drawer.id;
    this.word = "";
    this.revealed.clear();
    this.strokes = [];
    this.currentStroke = null;
    this.timeLeft = 0;
    this.wordOptions = pickWords(this.room.settings.wordCount);
    this.room.playerList.forEach((p) => (p.hasGuessed = false));
    this.phase = "choosing";

    const roomId = this.room.id;
    this.io.to(roomId).emit("round_start", {
      drawerId: drawer.id,
      drawerName: drawer.name,
      round: this.round,
      totalRounds: this.room.settings.rounds,
      drawTime: this.room.settings.drawTime,
    });
    this.emitState();
    this.io.to(roomId).emit("canvas_clear");
    this.io.to(drawer.id).emit("word_options", { words: this.wordOptions, chooseTime: CHOOSE_TIME_SEC });

    // Auto-pick if the drawer is AFK
    this.pause = setTimeout(() => {
      if (this.phase === "choosing" && this.drawerId) {
        this.chooseWord(this.drawerId, this.wordOptions[0]);
      }
    }, CHOOSE_TIME_SEC * 1000);
  }

  chooseWord(playerId: string, word: string) {
    if (this.phase !== "choosing" || playerId !== this.drawerId) return;
    if (!this.wordOptions.includes(word)) return;

    this.clearTimers();
    this.word = word;
    this.phase = "drawing";
    this.timeLeft = this.room.settings.drawTime;
    this.scheduleHints();

    this.emitState();
    this.io.to(playerId).emit("your_word", { word });
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private scheduleHints() {
    const { drawTime, hints } = this.room.settings;
    this.hintTimes = Array.from({ length: hints }, (_, i) =>
      Math.round((drawTime * (i + 1)) / (hints + 1))
    );
  }

  private tick() {
    this.timeLeft -= 1;
    const elapsed = this.room.settings.drawTime - this.timeLeft;
    if (this.hintTimes.includes(elapsed)) this.revealHint();
    this.io.to(this.room.id).emit("timer", { timeLeft: this.timeLeft });
    if (this.timeLeft <= 0) this.endRound();
  }

  private revealHint() {
    const index = nextHintIndex(this.word, this.revealed);
    if (index === null) return;
    this.revealed.add(index);
    this.io.to(this.room.id).emit("hint", { hint: buildHint(this.word, this.revealed) });
  }

  private endRound() {
    if (this.phase !== "drawing" && this.phase !== "choosing") return;
    this.clearTimers();
    this.phase = "roundEnd";
    this.io.to(this.room.id).emit("round_end", {
      word: this.word || "-",
      scores: this.room.listPlayers(),
      drawerId: this.drawerId,
    });
    this.emitState();
    this.pause = setTimeout(() => this.nextTurn(), ROUND_END_DELAY_MS);
  }

  private endGame() {
    this.clearTimers();
    this.phase = "gameOver";
    this.drawerId = null;
    const leaderboard = this.room.listPlayers().sort((a, b) => b.score - a.score);
    this.io.to(this.room.id).emit("game_over", { winner: leaderboard[0] ?? null, leaderboard });
    this.emitState();
  }

  // ---------- guessing & chat ----------

  handleGuess(player: Player, text: string) {
    const canGuess =
      this.phase === "drawing" && player.id !== this.drawerId && !player.hasGuessed;
    if (!canGuess) return this.handleChat(player, text);

    if (isCorrect(text, this.word)) {
      player.hasGuessed = true;
      const points = guesserPoints(this.timeLeft, this.room.settings.drawTime);
      player.score += points;
      const drawer = this.drawerId ? this.room.getPlayer(this.drawerId) : undefined;
      if (drawer) drawer.score += drawerPoints(points);

      this.io.to(this.room.id).emit("guess_result", {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
      });
      this.io.to(this.room.id).emit("players_update", { players: this.room.listPlayers() });
      if (this.allGuessed()) this.endRound();
      return;
    }

    if (isClose(text, this.word)) this.io.to(player.id).emit("close_guess", { text });
    this.broadcastMessage(player, text, "guess");
  }

  handleChat(player: Player, text: string) {
    const drawing = this.phase === "drawing";
    const insider = player.hasGuessed || player.id === this.drawerId;
    if (drawing && insider) {
      // Keep spoilers away from players who are still guessing
      this.room.playerList
        .filter((p) => p.hasGuessed || p.id === this.drawerId)
        .forEach((p) => this.sendMessage(p.id, player, text, "private"));
      return;
    }
    this.broadcastMessage(player, text, "chat");
  }

  private allGuessed(): boolean {
    const guessers = this.room.playerList.filter((p) => p.id !== this.drawerId);
    return guessers.length > 0 && guessers.every((p) => p.hasGuessed);
  }

  private broadcastMessage(player: Player, text: string, kind: string) {
    this.io
      .to(this.room.id)
      .emit("chat_message", { playerId: player.id, playerName: player.name, text, kind });
  }

  private sendMessage(to: string, player: Player, text: string, kind: string) {
    this.io.to(to).emit("chat_message", { playerId: player.id, playerName: player.name, text, kind });
  }

  // ---------- drawing ----------

  private canDraw(playerId: string) {
    return this.phase === "drawing" && playerId === this.drawerId;
  }

  startStroke(playerId: string, s: { x: number; y: number; color: string; size: number }): boolean {
    if (!this.canDraw(playerId) || this.strokes.length >= MAX_STROKES) return false;
    this.currentStroke = { color: s.color, size: s.size, points: [{ x: s.x, y: s.y }] };
    this.strokes.push(this.currentStroke);
    return true;
  }

  extendStroke(playerId: string, point: Point): boolean {
    if (!this.canDraw(playerId) || !this.currentStroke) return false;
    if (this.currentStroke.points.length >= MAX_POINTS_PER_STROKE) return false;
    this.currentStroke.points.push(point);
    return true;
  }

  endStroke(playerId: string): boolean {
    if (!this.canDraw(playerId)) return false;
    this.currentStroke = null;
    return true;
  }

  undo(playerId: string): boolean {
    if (!this.canDraw(playerId)) return false;
    this.strokes.pop();
    this.currentStroke = null;
    return true;
  }

  clear(playerId: string): boolean {
    if (!this.canDraw(playerId)) return false;
    this.strokes = [];
    this.currentStroke = null;
    return true;
  }

  getStrokes(): Stroke[] {
    return this.strokes;
  }

  // ---------- helpers ----------

  private emitState(to?: string) {
    const drawer = this.drawerId ? this.room.getPlayer(this.drawerId) : undefined;
    const target = to ? this.io.to(to) : this.io.to(this.room.id);
    target.emit("game_state", {
      phase: this.phase,
      round: this.round,
      totalRounds: this.room.settings.rounds,
      drawerId: this.drawerId,
      drawerName: drawer?.name ?? "",
      hint: this.phase === "drawing" ? buildHint(this.word, this.revealed) : "",
      timeLeft: this.timeLeft,
      drawTime: this.room.settings.drawTime,
      players: this.room.listPlayers(),
    });
  }

  private clearTimers() {
    if (this.timer) clearInterval(this.timer);
    if (this.pause) clearTimeout(this.pause);
    this.timer = null;
    this.pause = null;
  }
}