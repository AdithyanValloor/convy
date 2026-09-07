import { Request, Response, NextFunction } from "express";
import { redis } from "../../../config/redis.js";

/**
 * Redis message limiter.
 */

export const messageRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;
  const chatId = req.body?.chatId;

  if (!userId || !chatId) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  // Track message cadence separately for each user in each chat.
  const key = `rate:${userId}:${chatId}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 10);
  }

  if (count > 20) {
    res.status(429).json({
      error: "Too many messages. Please slow down.",
    });
    return;
  }

  next();
};
