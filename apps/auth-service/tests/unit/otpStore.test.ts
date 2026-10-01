import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  saveOtp,
  verifyOtp,
  markVerified,
  isVerified,
  clearEmail,
} from "../../src/otp/otpStore.js";

import { redis } from "../../src/config/redis.config.js";

vi.mock("../../src/config/redis.config.js", () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

describe("otpStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveOtp()", () => {
    it("should save OTP with correct key and TTL", async () => {
      await saveOtp("test@gmail.com", "123456");

      expect(redis.set).toHaveBeenCalledWith(
        "otp:test@gmail.com",
        "123456",
        {
          PX: 10 * 60 * 1000,
        },
      );
    });
  });

  describe("verifyOtp()", () => {
    it("should return true and delete OTP when OTP is valid", async () => {
      vi.mocked(redis.get).mockResolvedValue("123456");

      const result = await verifyOtp("test@gmail.com", "123456");

      expect(result).toBe(true);

      expect(redis.get).toHaveBeenCalledWith(
        "otp:test@gmail.com",
      );

      expect(redis.del).toHaveBeenCalledWith(
        "otp:test@gmail.com",
      );
    });

    it("should return false when OTP does not exist", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await verifyOtp("test@gmail.com", "123456");

      expect(result).toBe(false);

      expect(redis.del).not.toHaveBeenCalled();
    });

    it("should return false when OTP is incorrect", async () => {
      vi.mocked(redis.get).mockResolvedValue("654321");

      const result = await verifyOtp("test@gmail.com", "123456");

      expect(result).toBe(false);

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe("markVerified()", () => {
    it("should mark email as verified with TTL", async () => {
      await markVerified("test@gmail.com");

      expect(redis.set).toHaveBeenCalledWith(
        "verified:test@gmail.com",
        "true",
        {
          PX: 10 * 60 * 1000,
        },
      );
    });
  });

  describe("isVerified()", () => {
    it("should return true when verification marker is true", async () => {
      vi.mocked(redis.get).mockResolvedValue("true");

      const result = await isVerified("test@gmail.com");

      expect(result).toBe(true);

      expect(redis.get).toHaveBeenCalledWith(
        "verified:test@gmail.com",
      );
    });

    it("should return false when email is not verified", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await isVerified("test@gmail.com");

      expect(result).toBe(false);
    });
  });

  describe("clearEmail()", () => {
    it("should delete OTP and verification keys", async () => {
      await clearEmail("test@gmail.com");

      expect(redis.del).toHaveBeenCalledWith(
        "otp:test@gmail.com",
      );

      expect(redis.del).toHaveBeenCalledWith(
        "verified:test@gmail.com",
      );

      expect(redis.del).toHaveBeenCalledTimes(2);
    });
  });
});

