import { UserModel } from "../models/user.model.js";
import { NotFound } from "../../../utils/errors/httpErrors.js";

export interface PrivacySettings {
  friendRequests: "everyone" | "friends" | "nobody";
  readReceipts: boolean;
  typingIndicators: boolean;
}

/** Privacy settings service helpers for user visibility preferences. */

/** Returns the current user's privacy settings. */
export const getPrivacySettings = async (userId: string) => {
  const user = await UserModel.findById(userId).select("privacy");
  if (!user) throw NotFound("User not found");
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

  return user.privacy;
};
