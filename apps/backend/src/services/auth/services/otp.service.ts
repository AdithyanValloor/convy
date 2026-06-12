import crypto from "crypto";
import { saveOtp, verifyOtp } from "../otp/otpStore.js";
import { sendOtpEmail } from "../otp/mailer.js";

import { BadRequest } from "../../../utils/errors/httpErrors.js";

export const generateOtp = () => crypto.randomInt(100_000, 999_999).toString();

export const sendOtpToEmail = async (email: string) => {
  const otp = generateOtp();

  saveOtp(email, otp);

  await sendOtpEmail(email, otp);
};

export const verifyEmailOtp = (email: string, otp: string) => {
  const valid = verifyOtp(email, otp);

  if (!valid) {
    throw BadRequest("Invalid or expired OTP");
  }

  return true;
};
