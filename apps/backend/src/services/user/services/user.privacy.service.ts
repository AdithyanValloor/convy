import { UserModel } from "../models/user.model.js";
import { NotFound } from "../../../utils/errors/httpErrors.js";
import {
  getCachedUser,
  invalidateUserCache,
  setCachedUser,
} from "../cache/user.cache.js";

export interface PrivacySettings {
  friendRequests: "everyone" | "friends" | "nobody";
  readReceipts: boolean;
  typingIndicators: boolean;
}

/** Privacy settings service helpers for user visibility preferences. */

/** Returns the current user's privacy settings. */
export const getPrivacySettings = async (userId: string) => {
  const cached = await getCachedUser(userId);
  if (cached) {
    return cached.privacy;
  }
  const user = await UserModel.findById(userId).lean();
  if (!user) throw NotFound("User not found");
  await setCachedUser(userId, user);
  return user.privacy;
};

/** Applies a partial update to the current user's privacy settings. */
export const updatePrivacySettings = async (
  userId: string,
  updates: Partial<PrivacySettings>,
) => {
  const user = await UserModel.findById(userId);
  if (!user) throw NotFound("User not found");

  if (updates.friendRequests !== undefined)
    user.privacy.friendRequests = updates.friendRequests;

  if (updates.readReceipts !== undefined)
    user.privacy.readReceipts = updates.readReceipts;

  if (updates.typingIndicators !== undefined)
    user.privacy.typingIndicators = updates.typingIndicators;

  await user.save();
  await invalidateUserCache(userId);
  return user.privacy;
};
