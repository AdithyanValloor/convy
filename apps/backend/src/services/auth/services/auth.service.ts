import { IUser, UserModel } from "../../user/models/user.model.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  BadRequest,
  Unauthorized,
  NotFound,
  Conflict,
} from "../../../utils/errors/httpErrors.js";
import {
  markVerified,
  isVerified,
  clearEmail,
} from "../otp/otpStore.js";
import { validateEmail } from "../utils/email.js";
import { sendOtpToEmail, verifyEmailOtp } from "./otp.service.js";
import { AuthUserModel, IAuthUser } from "../models/auth.model.js";
import mongoose from "mongoose";
import * as UserAPI from "../../user/api/user.api.js";

//TODO fix register accessing UserModel when implementing message queue.

/** Authentication service helpers for OTP, registration, login, and refresh flows. */
const HASH_SALT = 10;

const validateNewEmail = async (userId: string, email: string) => {
  const normalized = validateEmail(email);

  const currentUser = await AuthUserModel.findById(userId).select("email");
  if (!currentUser) throw NotFound("User not found");

  if (currentUser.email === normalized) {
    throw BadRequest("New email must differ from your current email");
  }

  const taken = await AuthUserModel.findOne({
    email: normalized,
    _id: { $ne: userId },
  });

  if (taken) {
    throw Conflict("Email is already registered to another account");
  }

  return normalized;
};

const buildJwtPayload = (user: { _id: any; email: string }) => ({
  id: user._id.toString(),
  email: user.email,
});

const buildSafeUser = (user: any) =>
  user.toObject({
    versionKey: false,
  });

export const sendRegistrationOtp = async (email: string): Promise<void> => {
  if (!email) throw BadRequest("Email is required");

  if (await AuthUserModel.findOne({ email })) {
    throw BadRequest("Email already registered");
  }

  await sendOtpToEmail(email);
};

export const verifyRegistrationOtp = async (
  email: string,
  otp: string,
): Promise<void> => {
  if (!email || !otp) throw BadRequest("Email and OTP are required");

  const valid = verifyEmailOtp(email, otp);
  if (!valid) throw BadRequest("Invalid or expired OTP");

  // Verified emails are temporarily marked in the OTP store before registration completes.
  markVerified(email);
};

export const registerUser = async (
  displayName: string,
  username: string,
  email: string,
  password: string,
) => {
  // Registration is only allowed after the OTP flow marks the email as verified.
  if (!isVerified(email)) throw BadRequest("Email not verified");

  if (!displayName || !username || !email || !password) {
    throw BadRequest("Missing required fields");
  }

  if (await AuthUserModel.findOne({ email }))
    throw Conflict("Email already exists");

  if (await UserAPI.userNameExists(username))
    throw Conflict("Username already exists");

  const hashedPassword = await bcrypt.hash(password, HASH_SALT);

  const session = await mongoose.startSession();

  let authUser: IAuthUser | undefined;
  let profileUser: IUser | undefined;

  try {
    session.startTransaction();

    const userId = new mongoose.Types.ObjectId();

    [authUser] = await AuthUserModel.create(
      [
        {
          _id: userId,
          email: email,
          hashedPassword,
        },
      ],
      { session },
    );
    [profileUser] = await UserModel.create(
      [
        {
          _id: userId,
          username,
          displayName,
        },
      ],
      { session },
    );
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  // Clear the temporary verification marker after successful account creation.
  clearEmail(email);

  if (!authUser || !profileUser) {
    throw new Error("User creation failed");
  }

  return {
    accessToken: generateAccessToken(buildJwtPayload(authUser)),
    refreshToken: generateRefreshToken(buildJwtPayload(authUser)),
    safeUser: buildSafeUser(profileUser),
  };
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) throw BadRequest("Email and password required");

  console.log(email);
  

  const authUser = await AuthUserModel.findOne({ email });

  console.log(authUser);
  

  // Use the same auth error for missing users and invalid passwords.
  if (!authUser) throw Unauthorized("Invalid email or password");
  
  const profileUser = await UserAPI.findUserById(authUser._id.toString());

  const match = await bcrypt.compare(password, authUser.hashedPassword);
  if (!match) throw Unauthorized("Invalid email or password");

  return {
    accessToken: generateAccessToken(buildJwtPayload(authUser)),
    refreshToken: generateRefreshToken(buildJwtPayload(authUser)),
    safeUser: profileUser,
  };
};

export const refreshTokenFunction = async (token: string) => {
  if (!token) throw Unauthorized("Refresh token missing");

  const decoded = verifyRefreshToken(token);
  if (!decoded?.id) throw Unauthorized("Invalid refresh token");

  const user = await AuthUserModel.findById(decoded.id).select("-password");
  if (!user) throw NotFound("User not found");

  return {
    accessToken: generateAccessToken(buildJwtPayload(user)),
    user,
  };
};

/** Verifies whether a provided password matches the stored hash. */
export const checkPassword = async (userId: string, password: string) => {
  const user = await AuthUserModel.findById(userId).select("+hashedPassword");

  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(password, user.hashedPassword);

  return { isMatch };
};

/** Replaces a user's password after confirming the current password. */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  if (!newPassword || newPassword.length < 8) {
    throw BadRequest("New password must be at least 8 characters");
  }

  const user = await AuthUserModel.findById(userId).select("+hashedPassword");

  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);

  if (!isMatch) {
    throw Unauthorized("Current password is incorrect");
  }

  user.hashedPassword = await bcrypt.hash(newPassword, HASH_SALT);
  await user.save();
};

/** Generates and emails an OTP for confirming a new email address. */
export const sendEmailChangeOtp = async (
  userId: string,
  newEmail: string,
): Promise<void> => {
  const normalized = await validateNewEmail(userId, newEmail);
  await sendOtpToEmail(normalized);
};

/** Verifies an email-change OTP and persists the new email address. */
export const verifyAndUpdateEmail = async (
  userId: string,
  newEmail: string,
  otp: string,
): Promise<ReturnType<typeof updateEmail>> => {
  const normalized = await validateNewEmail(userId, newEmail);

  if (!otp) throw BadRequest("OTP is required");

  const valid = verifyEmailOtp(normalized, otp);
  if (!valid) throw BadRequest("Invalid or expired OTP");

  const updatedUser = await updateEmail(userId, normalized);

  clearEmail(normalized);

  return updatedUser;
};

/** Updates a user's email after format and uniqueness validation. */
export const updateEmail = async (userId: string, newEmail: string) => {
  const user = await AuthUserModel.findByIdAndUpdate(
    userId,
    {
      email: newEmail,
    },
    { new: true },
  ).select("-password");

  if (!user) throw NotFound("User not found");

  return user;
};
