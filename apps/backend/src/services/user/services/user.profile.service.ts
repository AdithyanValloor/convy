import { UserModel } from "../models/user.model.js";
import {
  Unauthorized,
  NotFound,
  BadRequest,
  Conflict,
} from "../../../utils/errors/httpErrors.js";
import { deleteFile, generateDownloadUrl } from "../../media/s3.service.js";
import { PROFILE_KEY_REGEX } from "../constants/regex.js";

/** Input shape for allowed profile field updates. */
interface UpdateProfileInput {
  displayName?: string;
  username?: string;
  pronouns?: string;
  bio?: string;
  status?: string;
}

/** User profile service helpers for account-facing profile operations. */

/** Returns the authenticated user's profile without the password field. */
export const getProfileByUserId = async (userId: string) => {
  if (!userId) {
    throw Unauthorized("No user info found");
  }

  const profile = await UserModel.findById(userId).select("-password");

  if (!profile) {
    throw NotFound("User not found");
  }

  return profile;
};

/** Updates only the editable profile fields provided by the caller. */
export const updateProfileByUserId = async (
  userId: string,
  updates: UpdateProfileInput,
) => {
  const profile = await UserModel.findById(userId);

  if (!profile) {
    throw NotFound("User not found");
  }

  // Apply only provided fields to avoid accidental overwrites.
  if (updates.displayName !== undefined)
    profile.displayName = updates.displayName;

  if (updates.pronouns !== undefined)
    profile.pronouns = updates.pronouns;

  if (updates.bio !== undefined)
    profile.bio = updates.bio;

  if (updates.status !== undefined)
    profile.status = updates.status;

  await profile.save();

  return profile;
};

/** Replaces the current profile picture and returns its download metadata. */
export const updateProfilePictureByUserId = async (
  userId: string,
  key: string,
) => {
  const user = await UserModel.findById(userId);

  if (!user) throw NotFound("User not found");

  if (user.profilePicture?.key) {
    await deleteFile(user.profilePicture.key);
  }

  const url = await generateDownloadUrl(key);

  user.profilePicture = {
    key: key,
  };

  await user.save();

  return {
    profilePicture: user.profilePicture,
  };
};

/** Returns a temporary download URL for a validated profile picture key. */
export const getProfilePictureDownloadUrlService = async (
  userId: string,
  key: string,
) => {
  if (!key || typeof key !== "string") {
    throw BadRequest("Invalid key");
  }

  if (!PROFILE_KEY_REGEX.test(key)) {
    throw BadRequest("Invalid key format");
  }

  const url = await generateDownloadUrl(key);

  return url;
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
