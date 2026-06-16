import { redis } from "../../../config/redis.js";
import { UserDTO } from "../types/user.dto.js";

const TTL = 60 * 5;

export const getCachedUser = async (userId: string): Promise<UserDTO | null> => {
  const cached = await redis.get(`user:${userId}`);
  if (!cached) return null;
  return JSON.parse(cached) as UserDTO;
};

export const setCachedUser = async (userId: string, user: unknown) => {
  await redis.set(`user:${userId}`, JSON.stringify(user), {
    EX: TTL,
  });
};

export const invalidateUserCache = async (userId: string) => {
  await redis.del(`user:${userId}`);
};
