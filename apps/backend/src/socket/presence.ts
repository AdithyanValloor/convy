/**
 * In-memory presence tracker with Redis.
 */

import { redis } from "../config/redis.js";
import { getIO } from "./io.js";

const TIMEOUT = 75_000;

/* -------------------- USER JOIN -------------------- */

export const userJoined = async (
  userId: string,
  socketId: string,
): Promise<void> => {
  await redis.sAdd(`user:${userId}:sockets`, socketId);

  const added = await redis.sAdd("online_users", userId);

  await redis.zAdd("presence:last_seen", {
    score: Date.now(),
    value: userId,
  });

  if (added === 1) {
    getIO().emit("presence_update", {
      userId,
      status: "online",
    });
  }
};

/* -------------------- HEARTBEAT -------------------- */

export const heartbeat = async (userId: string): Promise<void> => {
  await redis.zAdd("presence:last_seen", {
    score: Date.now(),
    value: userId,
  });
};

/* -------------------- USER DISCONNECTED -------------------- */

export const userDisconnected = async (
  userId: string,
  socketId: string,
): Promise<void> => {
  await redis.sRem(`user:${userId}:sockets`, socketId);

  const count = await redis.sCard(`user:${userId}:sockets`);

  if (count === 0) {
    await redis.sRem("online_users", userId);
    await redis.zRem("presence:last_seen", userId);
    await redis.del(`user:${userId}:sockets`);

    getIO().emit("presence_update", {
      userId,
      status: "offline",
    });
  }
};

/* -------------------- CLEANUP FALLBACK -------------------- */

export const cleanupPresence = async (): Promise<void> => {
  const cutoff = Date.now() - TIMEOUT;

  const expiredUsers = await redis.zRangeByScore(
    "presence:last_seen",
    0,
    cutoff,
  );

  const pipeline = redis.multi();

  for (const userId of expiredUsers) {
    pipeline.sRem("online_users", userId);
    pipeline.del(`user:${userId}:sockets`);
  }

  pipeline.zRemRangeByScore("presence:last_seen", 0, cutoff);

  await pipeline.exec();

  for (const userId of expiredUsers) {
    getIO().emit("presence_update", {
      userId,
      status: "offline",
    });
  }
};
/* -------------------- ONLINE USERS -------------------- */

export const getOnlineUsers = async (): Promise<string[]> => {
  const onlineUsers = await redis.sMembers("online_users");
  return onlineUsers;
};
