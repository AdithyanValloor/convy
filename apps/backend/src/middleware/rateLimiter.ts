import { Request, Response, NextFunction } from "express";

/**
 * In-memory message limiter scoped to a user/chat pair.
 * Helps slow down rapid message spam on a single server instance.
 */
const rateMap = new Map<string, number>();
const RATE_LIMIT_MS = 1000;
const MAX_KEYS = 10_000;

export const messageRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.user?.id;
  const chatId = req.body?.chatId;

  if (!userId || !chatId) {
    res.status(400).json({ error: "Invalid request for rate limiting" });
    return;
  }

  // Track message cadence separately for each user in each chat.
  const key = `${userId}:${chatId}`;

  const now = Date.now();
  const lastSentAt = rateMap.get(key);

  if (lastSentAt && now - lastSentAt < RATE_LIMIT_MS) {
    res.status(429).json({
      error: "You're sending messages too fast",
    });
    return;
  }

  rateMap.set(key, now);

  // Drop the oldest tracked key to keep the in-memory map bounded.
  if (rateMap.size > MAX_KEYS) {
    const iterator = rateMap.keys().next();
    if (!iterator.done) {
      rateMap.delete(iterator.value);
    }
  }

  next();
};
