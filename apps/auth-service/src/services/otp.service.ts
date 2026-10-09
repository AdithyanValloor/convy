import crypto from "node:crypto";
import { saveOtp, verifyOtp } from "../otp/otpStore.js";
import { sendOtpEmail } from "../otp/mailer.js";
import { BadRequest } from "../errors/httpErrors.js";
import { logger } from "../infra/logger/logger.js";

export const generateOtp = () =>
  crypto.randomInt(100_000, 999_999).toString();

export const sendOtpToEmail = async (email: string) => {
  const otp = generateOtp();

  saveOtp(email, otp);

  try {
    await sendOtpEmail(email, otp);
  } catch (error) {
    logger.error(
      {
        event: "otp_email_delivery_failed",
        errorName: error instanceof Error ? error.name : "UnknownError",
      },
      "Failed to deliver OTP email",
    );

    throw error;
  }
};

export const verifyEmailOtp = (email: string, otp: string) => {
  const valid = verifyOtp(email, otp);

  if (!valid) {
    throw BadRequest("Invalid or expired OTP");
  }

  return true;
};