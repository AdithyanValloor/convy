import { UserModel } from "../user/models/user.model.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import {
  BadRequest,
  Unauthorized,
  NotFound,
} from "../../utils/errors/httpErrors.js";
import crypto from "crypto";
import {
  saveOtp,
  verifyOtp,
  markVerified,
  isVerified,
  clearEmail,
} from "../../utils/otp/otpStore.js";
import { sendOtpEmail } from "../../utils/otp/mailer.js";

/** Authentication service helpers for OTP, registration, login, and refresh flows. */

const HASH_SALT = 10;

const generateOtp = () => crypto.randomInt(100_000, 999_999).toString();

const buildJwtPayload = (user: { _id: any; email: string }) => ({
  id: user._id.toString(),
  email: user.email,
});

const buildSafeUser = (user: any) =>
  user.toObject({
    versionKey: false,
    transform: (_: any, ret: any) => {
      delete ret.password;
      return ret;
    },
  });

export const sendRegistrationOtp = async (email: string): Promise<void> => {
  if (!email) throw BadRequest("Email is required");

  if (await UserModel.findOne({ email })) {
    throw BadRequest("Email already registered");
  }

  const otp = generateOtp();
  saveOtp(email, otp);

  await sendOtpEmail(email, otp);
};

export const verifyRegistrationOtp = async (
  email: string,
  otp: string
): Promise<void> => {
  if (!email || !otp) throw BadRequest("Email and OTP are required");

  const valid = verifyOtp(email, otp);
  if (!valid) throw BadRequest("Invalid or expired OTP");

  // Verified emails are temporarily marked in the OTP store before registration completes.
  markVerified(email);
};

export const registerUser = async (
  displayName: string,
  username: string,
  email: string,
  password: string
) => {
  // Registration is only allowed after the OTP flow marks the email as verified.
  if (!isVerified(email)) throw BadRequest("Email not verified");

  if (!displayName || !username || !email || !password) {
    throw BadRequest("Missing required fields");
  }

  if (await UserModel.findOne({ email }))
    throw BadRequest("Email already exists");

  if (await UserModel.findOne({ username }))
    throw BadRequest("Username already exists");

  const hashedPassword = await bcrypt.hash(password, HASH_SALT);

  const user = await UserModel.create({
    username,
    displayName,
    email,
    password: hashedPassword,
  });

  // Clear the temporary verification marker after successful account creation.
  clearEmail(email);

  return {
    accessToken: generateAccessToken(buildJwtPayload(user)),
    refreshToken: generateRefreshToken(buildJwtPayload(user)),
    safeUser: buildSafeUser(user),
  };
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) throw BadRequest("Email and password required");

  const user = await UserModel.findOne({ email });

  // Use the same auth error for missing users and invalid passwords.
  if (!user) throw Unauthorized("Invalid email or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw Unauthorized("Invalid email or password");

  return {
    accessToken: generateAccessToken(buildJwtPayload(user)),
    refreshToken: generateRefreshToken(buildJwtPayload(user)),
    safeUser: buildSafeUser(user),
  };
};

export const refreshTokenFunction = async (token: string) => {
  if (!token) throw Unauthorized("Refresh token missing");

  const decoded = verifyRefreshToken(token);
  if (!decoded?.id) throw Unauthorized("Invalid refresh token");

  const user = await UserModel.findById(decoded.id).select("-password");
  if (!user) throw NotFound("User not found");

  return {
    accessToken: generateAccessToken(buildJwtPayload(user)),
    user,
  };
};
