import { FlattenMaps } from "mongoose";
import { IUser } from "../models/user.model.js";
import { NotificationSettings } from "../services/user.preferences.service.js";
import { PrivacySettings } from "../services/user.privacy.service.js";
import { UpdateProfileInput } from "../services/user.profile.service.js";

export interface IUserRepository {

  createProfile(data: {
    authUserId: string;
    username: string;
    displayName: string;
  }): Promise<IUser>;

  findById(userId: string): Promise<FlattenMaps<IUser> | null>;

  findByUsername(username: string): Promise<FlattenMaps<IUser> | null>;

  findByIds(userIds: string[]): Promise<FlattenMaps<IUser>[]>;

  usernameExists(username: string): Promise<boolean>;

  createProfile(data: {
    authUserId: string;
    username: string;
    displayName: string;
  }): Promise<IUser>;

  findByAuthUserId(authUserId: string): Promise<FlattenMaps<IUser> | null>;

  clearProfilePicture(userId: string, key: string): Promise<void>;

  deactivate(userId: string): Promise<FlattenMaps<IUser> | null>;

  scheduleDeletion(
    userId: string,
    scheduledDeletionAt: Date,
  ): Promise<FlattenMaps<IUser> | null>;

  cancelScheduledDeletion(userId: string): Promise<void>;

  updateNotificationSettings(
    userId: string,
    updates: Partial<NotificationSettings>,
  ): Promise<FlattenMaps<IUser> | null>;

  updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
  ): Promise<FlattenMaps<IUser> | null>;

  updateUserProfile(
    userId: string,
    updates: Partial<UpdateProfileInput>,
  ): Promise<FlattenMaps<IUser> | null>;

  updateProfilePicture(
    userId: string,
    key: string,
  ): Promise<FlattenMaps<IUser> | null>;

  isUsernameTakenByAnotherUser(
    userId: string,
    username: string,
  ): Promise<boolean>;

  updateUsername(
    userId: string,
    username: string,
  ): Promise<FlattenMaps<IUser> | null>;
}
