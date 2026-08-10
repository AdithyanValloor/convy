import { FlattenMaps } from "mongoose";
import { IUser, UserModel } from "../models/user.model.js";
import { IUserRepository } from "./user.repository.js";
import { NotificationSettings } from "../services/user.preferences.service.js";
import { PrivacySettings } from "../services/user.privacy.service.js";
import { UpdateProfileInput } from "../services/user.profile.service.js";

export class MongoUserRepository implements IUserRepository {
  async findById(userId: string): Promise<FlattenMaps<IUser> | null> {
    return UserModel.findById(userId).lean();
  }

  async findByUsername(username: string): Promise<FlattenMaps<IUser> | null> {
    return UserModel.findOne({ username }).lean();
  }

  async findByIds(userIds: string[]): Promise<FlattenMaps<IUser>[]> {
    return UserModel.find({
      _id: { $in: userIds },
    })
      .select("displayName username profilePicture")
      .lean();
  }

  async usernameExists(username: string): Promise<boolean> {
    const exists = await UserModel.exists({ username });

    return exists !== null;
  }

  async createProfile(data: {
    authUserId: string;
    username: string;
    displayName: string;
  }): Promise<IUser> {
    return UserModel.create(data);
  }

  async findByAuthUserId(
    authUserId: string,
  ): Promise<FlattenMaps<IUser> | null> {
    return UserModel.findOne({ authUserId }).lean();
  }

  async clearProfilePicture(userId: string, key: string): Promise<void> {
    await UserModel.updateOne(
      {
        _id: userId,
        "profilePicture.key": key,
      },
      {
        $set: {
          "profilePicture.key": null,
        },
      },
    );
  }

  async deactivate(userId: string): Promise<FlattenMaps<IUser> | null> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        deactivatedAt: new Date(),
      },
      { new: true },
    ).lean();

    return user;
  }

  async scheduleDeletion(
    userId: string,
    scheduledDeletionAt: Date,
  ): Promise<FlattenMaps<IUser> | null> {
    const user = await UserModel.findByIdAndUpdate(userId, {
      scheduledDeletionAt,
      isActive: false,
    }).lean();
    return user;
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      scheduledDeletionAt: null,
      isActive: true,
    });
  }

  async updateNotificationSettings(
    userId: string,
    updates: Partial<NotificationSettings>,
  ): Promise<FlattenMaps<IUser> | null> {
    const updateFields: Record<string, boolean> = {};

    if (updates.allNotifications !== undefined) {
      updateFields["notificationSettings.allNotifications"] =
        updates.allNotifications;
    }

    if (updates.newMessages !== undefined) {
      updateFields["notificationSettings.newMessages"] = updates.newMessages;
    }

    if (updates.mentions !== undefined) {
      updateFields["notificationSettings.mentions"] = updates.mentions;
    }

    if (updates.replies !== undefined) {
      updateFields["notificationSettings.replies"] = updates.replies;
    }

    if (updates.friendRequests !== undefined) {
      updateFields["notificationSettings.friendRequests"] =
        updates.friendRequests;
    }

    if (updates.friendRequestAccepted !== undefined) {
      updateFields["notificationSettings.friendRequestAccepted"] =
        updates.friendRequestAccepted;
    }

    if (updates.groupAdded !== undefined) {
      updateFields["notificationSettings.groupAdded"] = updates.groupAdded;
    }

    return UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    ).lean();
  }

  async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
  ): Promise<FlattenMaps<IUser> | null> {
    const updateFields: Record<string, boolean | string> = {};

    if (updates.friendRequests !== undefined) {
      updateFields["privacy.friendRequests"] = updates.friendRequests;
    }

    if (updates.readReceipts !== undefined) {
      updateFields["privacy.readReceipts"] = updates.readReceipts;
    }

    if (updates.typingIndicators !== undefined) {
      updateFields["privacy.typingIndicators"] = updates.typingIndicators;
    }

    return UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    ).lean();
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<{
      displayName: string;
      pronouns: string | null;
      bio: string | null;
      status: string | null;
    }>,
  ): Promise<FlattenMaps<IUser> | null> {
    const updateFields: Record<string, unknown> = {};

    if (updates.displayName !== undefined) {
      updateFields["displayName"] = updates.displayName;
    }

    if (updates.pronouns !== undefined) {
      updateFields["pronouns"] = updates.pronouns;
    }

    if (updates.bio !== undefined) {
      updateFields["bio"] = updates.bio;
    }

    if (updates.status !== undefined) {
      updateFields["status"] = updates.status;
    }

    return UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    ).lean();
  }

  async updateProfilePicture(
    userId: string,
    key: string,
  ): Promise<FlattenMaps<IUser> | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profilePicture.key": key,
        },
      },
      { new: true },
    ).lean();
  }

  async isUsernameTakenByAnotherUser(
    userId: string,
    username: string,
  ): Promise<boolean> {
    const user = await UserModel.findOne({
      username,
      _id: { $ne: userId },
    })
      .select("_id")
      .lean();

    return user !== null;
  }

  async updateUsername(
    userId: string,
    username: string,
  ): Promise<FlattenMaps<IUser> | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          username,
        },
      },
      { new: true },
    ).lean();
  }
}
