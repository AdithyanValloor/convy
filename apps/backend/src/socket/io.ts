/** Shared Socket.IO server instance. */

import type { Server } from "socket.io";

let io: Server | null = null;

export const setIO = (instance: Server): void => {
  io = instance;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};
