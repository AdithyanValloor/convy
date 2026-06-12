import { UserModel } from "../models/user.model.js";
import { NotFound } from "../../../utils/errors/httpErrors.js";
import { getCachedUser, invalidateUserCache, setCachedUser } from "../cache/user.cache.js";

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

/** Returns the current user's notification settings. */
export const getNotificationSettings = async (userId: string) => {
  const cached = await getCachedUser(userId);

  if (cached) {
    return cached.notificationSettings;
  }

  const user = await UserModel.findById(userId).lean();
  if (!user) throw NotFound("User not found");

  await setCachedUser(userId, user);

  return user.notificationSettings;
};

/** Applies a partial update to the current user's notification settings. */
export const updateNotificationSettings = async (
  userId: string,
  updates: Partial<NotificationSettings>,
) => {
  const user = await UserModel.findById(userId);

  if (!user) throw NotFound("User not found");

  if (updates.allNotifications !== undefined)
    user.notificationSettings.allNotifications = updates.allNotifications;

  if (updates.newMessages !== undefined)
    user.notificationSettings.newMessages = updates.newMessages;

  if (updates.mentions !== undefined)
    user.notificationSettings.mentions = updates.mentions;

  if (updates.replies !== undefined)
    user.notificationSettings.replies = updates.replies;

  if (updates.friendRequests !== undefined)
    user.notificationSettings.friendRequests = updates.friendRequests;

  if (updates.friendRequestAccepted !== undefined)
    user.notificationSettings.friendRequestAccepted =
      updates.friendRequestAccepted;

  if (updates.groupAdded !== undefined)
    user.notificationSettings.groupAdded = updates.groupAdded;

  await user.save();
  await invalidateUserCache(userId);

  return user.notificationSettings;
};
