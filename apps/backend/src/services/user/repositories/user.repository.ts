
import { IUser } from "../models/user.model.js";
import { NotificationSettings } from "../services/user.preferences.service.js";
import { PrivacySettings } from "../services/user.privacy.service.js";
import { UpdateProfileInput } from "../services/user.profile.service.js";

export interface IUserRepository {

  findById(userId: string): Promise<IUser | null>;

  findByUsername(username: string): Promise<IUser | null>;

  findByIds(userIds: string[]): Promise<IUser[]>;

  usernameExists(username: string): Promise<boolean>;

  createProfile(data: {
    authUserId: string;
    username: string;
    displayName: string;
  }): Promise<IUser>;

  findByAuthUserId(authUserId: string): Promise<IUser | null>;

  clearProfilePicture(userId: string, key: string): Promise<void>;

  deactivate(userId: string): Promise<IUser | null>;

  scheduleDeletion(
    userId: string,
    scheduledDeletionAt: Date,
  ): Promise<IUser | null>;

  cancelScheduledDeletion(userId: string): Promise<void>;

  updateNotificationSettings(
    userId: string,
    updates: Partial<NotificationSettings>,
  ): Promise<IUser | null>;

  updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
  ): Promise<IUser | null>;

  updateUserProfile(
    userId: string,
    updates: Partial<UpdateProfileInput>,
  ): Promise<IUser | null>;

  updateProfilePicture(
    userId: string,
    key: string,
  ): Promise<IUser | null>;

  isUsernameTakenByAnotherUser(
    userId: string,
    username: string,
  ): Promise<boolean>;

  updateUsername(
    userId: string,
    username: string,
  ): Promise<IUser | null>;

  findAuthUserIdByUserId(userId: string): Promise<string | null>;

}
