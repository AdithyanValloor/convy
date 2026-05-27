/**
 * In-memory presence tracker.
 *
 * Uses heartbeat timestamps to determine online/offline status.
 * NOTE: This works only for single-instance deployments.
 * Use Redis or a shared store for horizontal scaling.
 */

import { getIO } from "./io.js";

type PresenceEntry = {
  lastActive: number;
  connections: number;
};

const presence = new Map<string, PresenceEntry>();
const TIMEOUT = 75_000;

/* -------------------- USER JOIN -------------------- */

export const userJoined = (userId: string): void => {
  const existing = presence.get(userId);

  if (existing) {
    existing.connections += 1;
    existing.lastActive = Date.now();
    return;
  }

  presence.set(userId, {
    lastActive: Date.now(),
    connections: 1,
  });

  getIO().emit("presence_update", {
    userId,
    status: "online",
  });
};

/* -------------------- HEARTBEAT -------------------- */

export const heartbeat = (userId: string): void => {
  const entry = presence.get(userId);
  if (!entry) return;

  entry.lastActive = Date.now();
};

/* -------------------- USER DISCONNECTED -------------------- */

export const userDisconnected = (userId: string): void => {
  const entry = presence.get(userId);
  if (!entry) return;

  entry.connections -= 1;

  if (entry.connections <= 0) {
    presence.delete(userId);

    getIO().emit("presence_update", {
      userId,
      status: "offline",
    });
  }
};

/* -------------------- CLEANUP FALLBACK -------------------- */

export const cleanupPresence = (): void => {
  const now = Date.now();

  for (const [userId, entry] of presence.entries()) {
    if (now - entry.lastActive > TIMEOUT) {
      presence.delete(userId);

      getIO().emit("presence_update", {
        userId,
        status: "offline",
      });
    }
  }
};

/* -------------------- ONLINE USERS -------------------- */

export const getOnlineUsers = (): string[] => {
  return [...presence.keys()];
};
