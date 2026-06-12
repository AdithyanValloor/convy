import { FlattenMaps } from "mongoose";
import { redis } from "../../../config/redis.js";
import { IUser } from "../models/user.model.js";

const TTL = 60 * 5;

export const getCachedUser = async (userId: string) => {
  const cached = await redis.get(`user:${userId}`);
  if (!cached) return null;
  return JSON.parse(cached) as FlattenMaps<IUser>;
};

export const setCachedUser = async (userId: string, user: unknown) => {
  await redis.set(`user:${userId}`, JSON.stringify(user), {
    EX: TTL,
  });
};

export const invalidateUserCache = async (userId: string) => {
  await redis.del(`user:${userId}`);
};
