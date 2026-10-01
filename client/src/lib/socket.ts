import { io } from "socket.io-client";

// In production the client is served by the same server, so same origin works
export const SERVER_URL = import.meta.env.DEV ? "http://localhost:4000" : window.location.origin;

export const socket = io(SERVER_URL);