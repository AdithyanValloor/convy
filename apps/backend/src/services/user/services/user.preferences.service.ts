import { UserModel } from "../models/user.model.js";
import { NotFound } from "../../../utils/errors/httpErrors.js";
import {
  getCachedUser,
  invalidateUserCache,
  setCachedUser,
} from "../cache/user.cache.js";
import { IUserRepository } from "../repositories/user.repository.js";

export interface NotificationSettings {
  allNotifications: boolean;
  newMessages: boolean;
  mentions: boolean;
  replies: boolean;
  friendRequests: boolean;
  friendRequestAccepted: boolean;
  groupAdded: boolean;
}

/** Notification settings service helpers for user preferences. */

export class UserPreferencesService {
  constructor(private readonly userRepository: IUserRepository) {}

  /** Returns the current user's notification settings. */
  async getNotificationSettings(userId: string) {
    const cached = await getCachedUser(userId);

    if (cached) {
      return cached.notificationSettings;
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw NotFound("User not found");

    await setCachedUser(userId, user);

    return user.notificationSettings;
  }

  /** Applies a partial update to the current user's notification settings. */
  async updateNotificationSettings(
    userId: string,
    updates: Partial<NotificationSettings>,
  ) {
    const user = await this.userRepository.updateNotificationSettings(
      userId,
      updates,
    );
    if (!user) throw NotFound("User not found");

    await invalidateUserCache(userId);

    return user.notificationSettings;
  }
}
