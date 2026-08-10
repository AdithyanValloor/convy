import {
  Unauthorized,
  NotFound,
  BadRequest,
} from "../../../utils/errors/httpErrors.js";
import { invalidateUserCache } from "../cache/user.cache.js";
import * as AuthAPI from "../../auth/api/auth.api.js";
import { IUserRepository } from "../repositories/user.repository.js";

/** Account service helpers for identity, credential, and lifecycle changes. */

const DELETION_GRACE_PERIOD_DAYS = 15;

export class UserAccountService {
  constructor(private readonly userRepository: IUserRepository) {}

  /** Soft-deactivates an account while retaining user data. */
  async deactivateAccount(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) throw NotFound("User not found");
    await invalidateUserCache(userId);
  }

  /** Schedules account deletion after the configured grace period. */
  async scheduleAccountDeletion(userId: string, password: string) {
    //TODO match userId with AuthId
    const isMatch = await AuthAPI.verifyPassword(userId, password);
    if (!isMatch) throw Unauthorized("Incorrect password");

    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(
      scheduledDeletionAt.getDate() + DELETION_GRACE_PERIOD_DAYS,
    );

    await this.userRepository.scheduleDeletion(userId, scheduledDeletionAt);

    await invalidateUserCache(userId);

    return { scheduledDeletionAt };
  }

  /** Cancels a pending account deletion while the grace period is still active. */
  async cancelScheduledDeletion(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) throw NotFound("User not found");

    if (!user.scheduledDeletionAt) {
      throw BadRequest("No deletion is scheduled for this account");
    }

    if (new Date() > user.scheduledDeletionAt) {
      throw BadRequest(
        "Grace period has expired - account cannot be recovered",
      );
    }

    await this.userRepository.cancelScheduledDeletion(userId);

    await invalidateUserCache(userId);
  }
}
