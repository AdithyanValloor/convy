import bcrypt from "bcrypt";
import { UserModel } from "../models/user.model.js";
import {
  Unauthorized,
  NotFound,
  BadRequest,
  Conflict,
} from "../../../utils/errors/httpErrors.js";
import crypto from "crypto";
import {
  saveOtp,
  verifyOtp,
  clearEmail,
} from "../../../utils/otp/otpStore.js";
import { sendOtpEmail } from "../../../utils/otp/mailer.js";

/** Account service helpers for identity, credential, and lifecycle changes. */

const generateOtp = () => crypto.randomInt(100_000, 999_999).toString();
const SALT_ROUNDS = 12;
const DELETION_GRACE_PERIOD_DAYS = 15;

/** Generates and emails an OTP for confirming a new email address. */
export const sendEmailChangeOtp = async (
  userId: string,
  newEmail: string,
): Promise<void> => {
  const normalized = newEmail.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) throw BadRequest("Invalid email address");

  const taken = await UserModel.findOne({
    email: normalized,
    _id: { $ne: userId },
  });
  if (taken) throw Conflict("Email is already registered to another account");

  const currentUser = await UserModel.findById(userId).select("email");
  if (!currentUser) throw NotFound("User not found");
  if (currentUser.email === normalized) {
    throw BadRequest("New email must differ from your current email");
  }

  const otp = generateOtp();
  saveOtp(normalized, otp);
  await sendOtpEmail(normalized, otp);
};

/** Verifies an email-change OTP and persists the new email address. */
export const verifyAndUpdateEmail = async (
  userId: string,
  newEmail: string,
  otp: string,
): Promise<ReturnType<typeof updateEmail>> => {
  const normalized = newEmail.trim().toLowerCase();

  if (!otp) throw BadRequest("OTP is required");

  const valid = verifyOtp(normalized, otp);
  if (!valid) throw BadRequest("Invalid or expired OTP");

  const updatedUser = await updateEmail(userId, normalized);

  clearEmail(normalized);

  return updatedUser;
};

/** Updates a user's username after server-side validation and uniqueness checks. */
export const updateUsername = async (userId: string, newUsername: string) => {
  if (!newUsername || newUsername.length < 3) {
    throw BadRequest("Username must be at least 3 characters");
  }

  if (!/^[a-z0-9_]+$/.test(newUsername)) {
    throw BadRequest(
      "Username may only contain lowercase letters, numbers, and underscores",
    );
  }

  const taken = await UserModel.findOne({
    username: newUsername,
    _id: { $ne: userId },
  });

  if (taken) {
    throw Conflict("Username is already taken");
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { username: newUsername },
    { new: true },
  ).select("-password");

  if (!user) throw NotFound("User not found");

  return user;
};

/** Updates a user's email after format and uniqueness validation. */
export const updateEmail = async (userId: string, newEmail: string) => {
  const normalized = newEmail.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw BadRequest("Invalid email address");
  }

  const taken = await UserModel.findOne({
    email: normalized,
    _id: { $ne: userId },
  });

  if (taken) {
    throw Conflict("Email is already registered to another account");
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      email: normalized,
      emailVerified: false,
    },
    { new: true },
  ).select("-password");

  if (!user) throw NotFound("User not found");

  return user;
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

  const user = await UserModel.findById(userId).select("+password");

  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw Unauthorized("Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
};

/** Soft-deactivates an account while retaining user data. */
export const deactivateAccount = async (userId: string) => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      isActive: false,
      deactivatedAt: new Date(),
    },
    { new: true },
  );

  if (!user) throw NotFound("User not found");
};

/** Schedules account deletion after the configured grace period. */
export const scheduleAccountDeletion = async (
  userId: string,
  password: string,
) => {
  const user = await UserModel.findById(userId).select("+password");

  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw Unauthorized("Incorrect password");

  const scheduledDeletionAt = new Date();
  scheduledDeletionAt.setDate(
    scheduledDeletionAt.getDate() + DELETION_GRACE_PERIOD_DAYS,
  );

  await UserModel.findByIdAndUpdate(userId, {
    scheduledDeletionAt,
    isActive: false,
  });

  return { scheduledDeletionAt };
};

/** Cancels a pending account deletion while the grace period is still active. */
export const cancelScheduledDeletion = async (userId: string) => {
  const user = await UserModel.findById(userId);

  if (!user) throw NotFound("User not found");

  if (!user.scheduledDeletionAt) {
    throw BadRequest("No deletion is scheduled for this account");
  }

  if (new Date() > user.scheduledDeletionAt) {
    throw BadRequest("Grace period has expired - account cannot be recovered");
  }

  await UserModel.findByIdAndUpdate(userId, {
    scheduledDeletionAt: null,
    isActive: true,
  });
};
