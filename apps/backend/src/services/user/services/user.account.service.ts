import bcrypt from "bcrypt";
import { UserModel } from "../models/user.model.js";
import {
  Unauthorized,
  NotFound,
  BadRequest,
  Conflict,
} from "../../../utils/errors/httpErrors.js";

/** Account service helpers for identity, credential, and lifecycle changes. */

const DELETION_GRACE_PERIOD_DAYS = 15;

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
