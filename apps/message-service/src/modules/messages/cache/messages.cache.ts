import { redis } from "../../../config/redis.js";

export const getCachedUnreadCountOfUser = async (
  userId: string,
): Promise<Record<string, number> | null> => {
  const unreadCount = await redis.hGetAll(`unread:${userId}`);

  if (Object.keys(unreadCount).length === 0) {
    return null;
  }

  const result: Record<string, number> = {};

  for (const [chatId, count] of Object.entries(unreadCount)) {
    result[chatId] = Number(count);
  }

  return result;
};

export const setCachedUnreadCountOfUser = (
  userId: string,
  unreadData: Record<string, number>,
) => {
  return redis.hSet(`unread:${userId}`, unreadData);
};

export const incrementUnreadCount = (
  userId: string,
  chatId: string,
): Promise<number> => {
  return redis.hIncrBy(`unread:${userId}`, chatId, 1);
};

export const markRead = (userId: string, chatId: string) => {
  return redis.hDel(`unread:${userId}`, chatId);
};

export const getUnreadCountOfChat = async (
  userId: string,
  chatId: string,
): Promise<number> => {
  const count = await redis.hGet(`unread:${userId}`, chatId);

  return Number(count ?? 0);
};
