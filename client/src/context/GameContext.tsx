import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { socket } from "../lib/socket";
import type { ChatMessage, Phase, PlayerInfo, RoomSettings } from "../types";

interface RoomState {
  connected: boolean;
  error: string | null;
  roomId: string | null;
  myId: string | null;
  players: PlayerInfo[];
  settings: RoomSettings | null;
  phase: Phase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName: string;
  hint: string;
  timeLeft: number;
  drawTime: number;
  word: string | null;
  wordOptions: string[] | null;
  messages: ChatMessage[];
  roundResult: { word: string; scores: PlayerInfo[] } | null;
  gameOver: { winner: PlayerInfo | null; leaderboard: PlayerInfo[] } | null;
}

interface JoinAck {
  roomId: string;
  player: PlayerInfo;
  players: PlayerInfo[];
  settings: RoomSettings;
}

interface GameContextValue extends RoomState {
  createRoom: (name: string) => Promise<string>;
  joinRoom: (roomId: string, name: string) => Promise<string>;
  leaveRoom: () => void;
  startGame: () => Promise<unknown>;
  updateSettings: (settings: RoomSettings) => void;
  chooseWord: (word: string) => void;
  sendMessage: (text: string) => void;
  kickPlayer: (playerId: string) => void;
  playAgain: () => void;
}

const initialState: RoomState = {
  connected: socket.connected,
  error: null,
  roomId: null,
  myId: null,
  players: [],
  settings: null,
  phase: "lobby",
  round: 0,
  totalRounds: 0,
  drawerId: null,
  drawerName: "",
  hint: "",
  timeLeft: 0,
  drawTime: 0,
  word: null,
  wordOptions: null,
  messages: [],
  roundResult: null,
  gameOver: null,
};

// Promise wrapper around a Socket.IO acknowledgement. `apply` runs synchronously
// inside the ack so state is set before any event that follows it.
function request<T>(event: string, payload: unknown, apply?: (res: T) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res: T & { error?: string }) => {
      if (res?.error) return reject(new Error(res.error));
      apply?.(res);
      resolve(res);
    });
  });
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoomState>(initialState);
  const nextMessageId = useRef(0);

  const patch = (p: Partial<RoomState>) => setState((s) => ({ ...s, ...p }));

  useEffect(() => {
    const push = (m: Omit<ChatMessage, "id">) => {
      const id = nextMessageId.current++;
      setState((s) => ({ ...s, messages: [...s.messages.slice(-199), { ...m, id }] }));
    };

    const onConnect = () => setState((s) => ({ ...s, connected: true }));
    const onDisconnect = (reason: string) =>
      setState({
        ...initialState,
        connected: false,
        error: reason === "io client disconnect" ? null : "Connection lost. Please rejoin.",
      });

    const onGameState = (p: Partial<RoomState> & { phase: Phase }) =>
      setState((s) => ({
        ...s,
        ...p,
        word: p.phase === "drawing" ? s.word : null,
        wordOptions: p.phase === "choosing" ? s.wordOptions : null,
        roundResult: p.phase === "roundEnd" ? s.roundResult : null,
        gameOver: p.phase === "gameOver" ? s.gameOver : null,
      }));

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game_state", onGameState);
    socket.on("players_update", (p: { players: PlayerInfo[] }) => patch({ players: p.players }));
    socket.on("timer", (p: { timeLeft: number }) => patch({ timeLeft: p.timeLeft }));
    socket.on("hint", (p: { hint: string }) => patch({ hint: p.hint }));
    socket.on("your_word", (p: { word: string }) => patch({ word: p.word }));
    socket.on("word_options", (p: { words: string[] }) => patch({ wordOptions: p.words }));
    socket.on("settings_updated", (settings: RoomSettings) => patch({ settings }));

    socket.on("round_start", (p: { drawerName: string; round: number; totalRounds: number }) =>
      push({ kind: "system", text: `Round ${p.round}/${p.totalRounds}: ${p.drawerName} is drawing` })
    );
    socket.on("round_end", (p: { word: string; scores: PlayerInfo[] }) => {
      patch({ roundResult: { word: p.word, scores: p.scores }, players: p.scores });
      push({ kind: "system", text: `The word was "${p.word}"` });
    });
    socket.on("game_over", (p: { winner: PlayerInfo | null; leaderboard: PlayerInfo[] }) =>
      patch({ gameOver: { winner: p.winner, leaderboard: p.leaderboard } })
    );
    socket.on("lobby_reset", (p: { players: PlayerInfo[] }) =>
      patch({
        phase: "lobby",
        players: p.players,
        drawerId: null,
        hint: "",
        word: null,
        wordOptions: null,
        roundResult: null,
        gameOver: null,
      })
    );

    socket.on("guess_result", (p: { playerName: string; points: number }) =>
      push({ kind: "correct", text: `${p.playerName} guessed the word! (+${p.points})` })
    );
    socket.on("close_guess", (p: { text: string }) =>
      push({ kind: "close", text: `"${p.text}" is close!` })
    );
    socket.on("chat_message", (p: { playerName: string; text: string; kind: ChatMessage["kind"] }) =>
      push({ kind: p.kind, name: p.playerName, text: p.text })
    );

    socket.on("player_joined", (p: { player: PlayerInfo; players: PlayerInfo[] }) => {
      patch({ players: p.players });
      push({ kind: "system", text: `${p.player.name} joined the room` });
    });
    socket.on("player_left", (p: { playerName: string; players: PlayerInfo[] }) => {
      patch({ players: p.players });
      push({ kind: "system", text: `${p.playerName} left the room` });
    });
    socket.on("kicked", () =>
      setState({ ...initialState, connected: true, error: "You were removed from the room by the host." })
    );

    return () => {
      [
        "connect", "disconnect", "game_state", "players_update", "timer", "hint", "your_word",
        "word_options", "settings_updated", "round_start", "round_end", "game_over", "lobby_reset",
        "guess_result", "close_guess", "chat_message", "player_joined", "player_left", "kicked",
      ].forEach((event) => socket.off(event));
    };
  }, []);

  const enterRoom = (res: JoinAck) =>
    setState((s) => ({
      ...initialState,
      connected: s.connected,
      roomId: res.roomId,
      myId: res.player.id,
      players: res.players,
      settings: res.settings,
    }));

  const createRoom = async (name: string) => {
    patch({ error: null });
    const res = await request<JoinAck>("create_room", { hostName: name }, enterRoom);
    return res.roomId;
  };

  const joinRoom = async (roomId: string, name: string) => {
    patch({ error: null });
    const res = await request<JoinAck>("join_room", { roomId, playerName: name }, enterRoom);
    return res.roomId;
  };

  const leaveRoom = () => {
    socket.disconnect();
    setState({ ...initialState, connected: false });
    socket.connect();
  };

  const sendMessage = (text: string) => {
    const me = state.players.find((p) => p.id === state.myId);
    const isGuessing = state.phase === "drawing" && state.myId !== state.drawerId && !me?.hasGuessed;
    socket.emit(isGuessing ? "guess" : "chat", { text });
  };

  const value: GameContextValue = {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    startGame: () => request("start_game", {}),
    updateSettings: (settings) => socket.emit("update_settings", settings),
    chooseWord: (word) => {
      patch({ wordOptions: null });
      socket.emit("word_chosen", { word });
    },
    kickPlayer: (playerId) => socket.emit("kick_player", { playerId }),
    playAgain: () => socket.emit("play_again"),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}