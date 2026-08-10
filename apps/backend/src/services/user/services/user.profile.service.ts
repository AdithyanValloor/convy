import { IUser, UserModel } from "../models/user.model.js";
import {
  Unauthorized,
  NotFound,
  BadRequest,
  Conflict,
} from "../../../utils/errors/httpErrors.js";
import { deleteFile, generateDownloadUrl } from "../../media/s3.service.js";
import { PROFILE_KEY_REGEX } from "../constants/regex.js";
import { invalidateUserCache } from "../cache/user.cache.js";
import { findUserById } from "../api/user.api.js";
import { IUserRepository } from "../repositories/user.repository.js";
import { FlattenMaps } from "mongoose";

/** Input shape for allowed profile field updates. */
export interface UpdateProfileInput {
  displayName?: string;
  username?: string;
  pronouns?: string;
  bio?: string;
  status?: string;
}

/** User profile service helpers for account-facing profile operations. */

export class UserProfileService {
  constructor(private readonly userRepository: IUserRepository) {}

  /** Returns the authenticated user's profile. */
  async getProfileByUserId(userId: string) {
    const user = this.userRepository.findById(userId);
    if (!user) throw NotFound("User not found");

    return user;
  }

  /** Updates only the editable profile fields provided by the caller. */
  async updateProfileByUserId(
    userId: string,
    updates: Partial<UpdateProfileInput>,
  ) {
    const user = await this.userRepository.updateUserProfile(userId, updates);
    if (!user) throw NotFound("User not found");

    await invalidateUserCache(userId);
    return user;
  }

  /** Replaces the current profile picture and returns its download metadata. */
  async updateProfilePictureByUserId(userId: string, key: string) {
    const user = await this.userRepository.updateProfilePicture(userId, key);

    if (!user) throw NotFound("User not found");

    await invalidateUserCache(userId);

    return {
      profilePicture: user.profilePicture,
    };
  }

  /** Returns a temporary download URL for a validated profile picture key. */
  async getProfilePictureDownloadUrlService(key: string) {
    if (!key || typeof key !== "string") {
      throw BadRequest("Invalid key");
    }

    if (!PROFILE_KEY_REGEX.test(key)) {
      throw BadRequest("Invalid key format");
    }

    const url = await generateDownloadUrl(key);

    return url;
  }

  /** Updates a user's username after server-side validation and uniqueness checks. */
  async updateUsername(userId: string, newUsername: string) {
    if (!newUsername || newUsername.length < 3) {
      throw BadRequest("Username must be at least 3 characters");
    }

    if (!/^[a-z0-9_]+$/.test(newUsername)) {
      throw BadRequest(
        "Username may only contain lowercase letters, numbers, and underscores",
      );
    }

    const taken = await this.userRepository.isUsernameTakenByAnotherUser(
      userId,
      newUsername,
    );

    if (taken) {
      throw Conflict("Username is already taken");
    }

    const user = await this.userRepository.updateUsername(userId, newUsername);

    if (!user) {
      throw NotFound("User not found");
    }

    await invalidateUserCache(userId);

    return user;
  }
}
