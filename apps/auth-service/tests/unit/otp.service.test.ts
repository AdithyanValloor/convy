import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

import {
  generateOtp,
  sendOtpToEmail,
  verifyEmailOtp,
} from "../../src/services/otp.service.js";

import { saveOtp, verifyOtp } from "../../src/otp/otpStore.js";
import { sendOtpEmail } from "../../src/otp/mailer.js";

// Mock dependencies
vi.mock("crypto", () => ({
  default: {
    randomInt: vi.fn(),
  },
}));

vi.mock("../../src/otp/otpStore.js", () => ({
  saveOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("../../src/otp/mailer.js", () => ({
  sendOtpEmail: vi.fn(),
}));

describe("OTP Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateOtp()", () => {
    it("generateOtp(): Should return a 6-digit OTP string", () => {
      vi.mocked(crypto.randomInt as unknown as ReturnType<typeof vi.fn>).mockReturnValue(123456);

      const result = generateOtp();

      expect(result).toBe("123456");

      expect(crypto.randomInt).toHaveBeenCalledWith(
        100_000,
        999_999,
      );
    });
  });

  describe("sendOtpToEmail()", () => {
    it("sendOtpToEmail(): Should save and send the generated OTP", async () => {
      vi.mocked(crypto.randomInt as unknown as ReturnType<typeof vi.fn>).mockReturnValue(123456);

      await sendOtpToEmail("test@gmail.com");

      expect(saveOtp).toHaveBeenCalledWith(
        "test@gmail.com",
        "123456",
      );

      expect(sendOtpEmail).toHaveBeenCalledWith(
        "test@gmail.com",
        "123456",
      );
    });

    it("sendOtpToEmail(): Should propagate email sending failure", async () => {
      vi.mocked(crypto.randomInt as unknown as ReturnType<typeof vi.fn>).mockReturnValue(123456);

      const error = new Error("Email service failed");

      vi.mocked(sendOtpEmail).mockRejectedValue(error);

      await expect(
        sendOtpToEmail("test@gmail.com"),
      ).rejects.toThrow("Email service failed");

      // OTP should still have been saved before sending the email.
      expect(saveOtp).toHaveBeenCalledWith(
        "test@gmail.com",
        "123456",
      );
    });
  });

  describe("verifyEmailOtp()", () => {
    it("verifyEmailOtp(): Should return true for a valid OTP", () => {
      vi.mocked(verifyOtp as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = verifyEmailOtp(
        "test@gmail.com",
        "123456",
      );

      expect(result).toBe(true);

      expect(verifyOtp).toHaveBeenCalledWith(
        "test@gmail.com",
        "123456",
      );
    });

    it("verifyEmailOtp(): Should throw for an invalid or expired OTP", () => {
      vi.mocked(verifyOtp as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      expect(() =>
        verifyEmailOtp(
          "test@gmail.com",
          "123456",
        ),
      ).toThrow("Invalid or expired OTP");

      expect(verifyOtp).toHaveBeenCalledWith(
        "test@gmail.com",
        "123456",
      );
    });
  });
});

