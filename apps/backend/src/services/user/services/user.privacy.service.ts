import { UserModel } from "../models/user.model.js";
import { NotFound } from "../../../utils/errors/httpErrors.js";
import {
  getCachedUser,
  invalidateUserCache,
  setCachedUser,
} from "../cache/user.cache.js";
import { IUserRepository } from "../repositories/user.repository.js";

export interface PrivacySettings {
  friendRequests: "everyone" | "friends" | "nobody";
  readReceipts: boolean;
  typingIndicators: boolean;
}

/** Privacy settings service helpers for user visibility preferences. */

export class UserPrivacyService {
  constructor(private readonly userRepository: IUserRepository) {}

  /** Returns the current user's privacy settings. */
  async getPrivacySettings(userId: string) {
    const cached = await getCachedUser(userId);
    if (cached) {
      return cached.privacy;
    }
    const user = await this.userRepository.findById(userId);
    if (!user) throw NotFound("User not found");
    await setCachedUser(userId, user);
    return user.privacy;
  }

  /** Applies a partial update to the current user's privacy settings. */
  async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
  ) {
    const user = await this.userRepository.updatePrivacySettings(
      userId,
      updates,
    );
    if (!user) throw NotFound("User not found");

    await invalidateUserCache(userId);
    return user.privacy;
  }
}
