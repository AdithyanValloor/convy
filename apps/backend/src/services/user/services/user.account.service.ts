import bcrypt from "bcrypt";
import { UserModel } from "../models/user.model.js";
import {
  Unauthorized,
  NotFound,
  BadRequest,
} from "../../../utils/errors/httpErrors.js";
import { AuthUserModel } from "../../auth/models/auth.model.js";

/** Account service helpers for identity, credential, and lifecycle changes. */

const DELETION_GRACE_PERIOD_DAYS = 15;

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
  const user = await AuthUserModel.findById(userId).select("+password");

  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
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
