import { IInboxNotification } from "../models/inboxNotification.model.js";
import { InboxNotificationParams } from "../types/notification.socket.js";

export interface IInboxNotificationRepository {
  createInboxNotification(
    data: InboxNotificationParams,
  ): Promise<IInboxNotification>;

  countUnread(userId: string): Promise<number>;

  totalCount(userId: string): Promise<number>;

  markAllNotificationsAsRead(userId: string): Promise<void>;

  markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<IInboxNotification | null>;

  findInboxNotification(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<IInboxNotification[]>;

  deleteNotificationByFriendRequest(
    friendRequestId: string,
  ): Promise<IInboxNotification | null>;

  deleteNotificationOfUser(
    notificationId: string,
    userId: string,
  ): Promise<IInboxNotification | null>;

  markMentionsReadForChat(userId: string, chatId: string): Promise<void>;
}
