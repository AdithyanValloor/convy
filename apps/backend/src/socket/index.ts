/**
 * Attaches Socket.IO to the HTTP server and wires shared socket setup.
 */

import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

import { setIO } from "./io.js";
import { cleanupPresence } from "./presence.js";
import { registerConnectionHandlers } from "./handlers/connection.js";
import { registerTypingHandlers } from "./handlers/typing.js";

const clientOrigins =
  process.env.CLIENT_URLS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

if (clientOrigins.length === 0) {
  console.warn(
    "CLIENT_URLS not set in environment variables. CORS may be misconfigured.",
  );
}

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      // Keep explicit dev origins until socket CORS is env-driven.
      origin: clientOrigins,
      credentials: true,
    },
  });

  // Store the instance so non-socket modules can emit events.
  setIO(io);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Split per-socket behavior into focused handler modules.
    registerConnectionHandlers(socket);
    registerTypingHandlers(socket);
  });

  // Periodically clear stale in-memory presence state.
  setInterval(cleanupPresence, 10_000);

  return io;
};
