/**
 * In-memory OTP store.
 * Replace with Redis or another shared store for multi-instance deployments.
 */

import { redis } from "../config/redis.config.js";

const OTP_TTL_MS = 10 * 60 * 1000;

export const saveOtp = async (email: string, otp: string) => {
  await redis.set(`otp:${email}`, otp, {
    PX: OTP_TTL_MS,
  });
};

export const verifyOtp = async (email: string, otp: string) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) return false;

  if (storedOtp !== otp) return false;

  await redis.del(`otp:${email}`);

  return true;
};

export const markVerified = async (email: string) => {
  await redis.set(`verified:${email}`, "true", { PX: OTP_TTL_MS });
};

export const isVerified = async (email: string): Promise<boolean> => {
  const verified = await redis.get(`verified:${email}`);
  return verified === "true";
};

export const clearEmail = async (email: string) => {
  await redis.del(`otp:${email}`);
  await redis.del(`verified:${email}`);
};
