import {
  IInboxNotification,
  InboxNotificationModel,
} from "../models/inboxNotification.model.js";
import { InboxNotificationParams } from "../types/notification.socket.js";
import { IInboxNotificationRepository } from "./inboxNotification.repository.js";

export class InboxNotificationRepository implements IInboxNotificationRepository {
  async createInboxNotification(
    data: InboxNotificationParams,
  ): Promise<IInboxNotification> {
    const notification = await InboxNotificationModel.create({
      user: data.userId,
      actor: data.actorId,
      type: data.type,
      chat: data.chatId,
      message: data.messageId,
      friendRequest: data.friendRequestId,
      group: data.groupId,
    });

    return notification.toObject();
  }

  async countUnread(userId: string): Promise<number> {
    return InboxNotificationModel.countDocuments({
      user: userId,
      read: false,
    });
  }

  async totalCount(userId: string): Promise<number> {
    return InboxNotificationModel.countDocuments({
      user: userId,
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await InboxNotificationModel.updateMany(
      { user: userId, read: false },
      { $set: { read: true } },
    );
  }

  async markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<IInboxNotification | null> {
    return InboxNotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true },
    ).lean();
  }

  async findInboxNotification(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<IInboxNotification[]> {
    return InboxNotificationModel.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async deleteNotificationByFriendRequest(
    friendRequestId: string,
  ): Promise<IInboxNotification | null> {
    return InboxNotificationModel.findOneAndDelete({
      friendRequest: friendRequestId,
    }).lean();
  }

  async deleteNotificationOfUser(
    notificationId: string,
    userId: string,
  ): Promise<IInboxNotification | null> {
    return InboxNotificationModel.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });
  }

  async markMentionsReadForChat(userId: string, chatId: string): Promise<void> {
    await InboxNotificationModel.updateMany(
      {
        user: userId,
        chat: chatId,
        type: "mention",
        read: false,
      },
      {
        $set: { read: true },
      },
    );
  }
}
