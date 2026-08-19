import { emitInboxNotification } from "../../../socket/emitters/notification.emitters.js";
import { NotFound } from "../../../utils/errors/httpErrors.js";
import { InboxNotificationModel } from "../models/inboxNotification.model.js";
import { IInboxNotificationRepository } from "../repositories/inboxNotification.repository.js";
import {
  InboxNotificationDTO,
  InboxNotificationParams,
  InboxNotificationSocketPayload,
} from "../types/notification.socket.js";
import * as UserAPI from "../../user/api/user.api.js";
import * as ChatAPI from "../../chat/api/chat.api.js";
import * as MessageAPI from "../../messages/api/messages.api.js";

/** Inbox notification helpers for creation, read state, and inbox retrieval. */

export class InboxNotificationService {
  constructor(
    private readonly inboxNotificationRepository: IInboxNotificationRepository,
  ) {}

  /** Creates an inbox notification, emits it over sockets, and returns its DTO. */
  async createInboxNotification({
    userId,
    actorId,
    type,
    chatId,
    messageId,
    friendRequestId,
    groupId,
  }: InboxNotificationParams) {
    const notification =
      await this.inboxNotificationRepository.createInboxNotification({
        userId,
        actorId,
        type,
        chatId,
        messageId,
        friendRequestId,
        groupId,
      });

    const [actor, chat, message, group] = await Promise.all([
      actorId ? UserAPI.findUserById(actorId) : null,

      chatId ? ChatAPI.findChatById(chatId) : null,

      messageId ? MessageAPI.findMessageById(messageId) : null,

      groupId ? ChatAPI.findChatById(groupId) : null,
    ]);

    const dto: InboxNotificationDTO = {
      _id: notification._id.toString(),
      type: notification.type,

      actor: actor
        ? {
            _id: actor.id.toString(),
            username: actor.username,
            displayName: actor.displayName,
            profilePicture: actor.profilePicture,
          }
        : undefined,

      chat: chat
        ? {
            _id: chat._id.toString(),
            chatName: chat.chatName,
            isGroup: chat.isGroup,
          }
        : undefined,

      message: message
        ? {
            _id: message._id.toString(),
            content: message.content ?? "",
            chat: message.chat?.toString(),
          }
        : undefined,

      group: group
        ? {
            _id: group._id.toString(),
            chatName: group.chatName,
            isGroup: group.isGroup,
          }
        : undefined,

      read: notification.read,
      createdAt: notification.createdAt,
    };

    const payload: InboxNotificationSocketPayload = {
      type: dto.type,
      notification: dto,
    };

    emitInboxNotification(userId, payload);

    return dto;
  }

  /** Returns the unread inbox notification count for a user. */
  async getUnreadNotificationCount(userId: string) {
    const count = await this.inboxNotificationRepository.countUnread(userId);

    return { unreadCount: count };
  }

  /** Marks every unread inbox notification as read for a user. */
  async markAllNotificationsRead(userId: string) {
    await this.inboxNotificationRepository.markAllNotificationsAsRead(userId);

    return { success: true };
  }

  /** Returns paginated inbox notifications along with unread counts. */
  async getInboxNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const notifications =
      await this.inboxNotificationRepository.findInboxNotification(
        userId,
        skip,
        limit,
      );

    const populated = await Promise.all(
      notifications.map(async (notification) => {
        const [actor, chat, message, group] = await Promise.all([
          notification.actor
            ? UserAPI.findUserById(notification.actor.toString())
            : null,
          notification.chat
            ? ChatAPI.findChatById(notification.chat.toString())
            : null,
          notification.message
            ? MessageAPI.findMessageById(notification.message.toString())
            : null,
          notification.group
            ? ChatAPI.findChatById(notification.group.toString())
            : null,
        ]);

        return {
          ...notification,
          actor,
          chat,
          message,
          group,
        };
      }),
    );

    const [total, unreadCount] = await Promise.all([
      this.inboxNotificationRepository.totalCount(userId),
      this.inboxNotificationRepository.countUnread(userId),
    ]);

    return {
      notifications: populated,
      unreadCount,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /** Marks a single notification as read for its owner. */
  async markNotificationRead(notificationId: string, userId: string) {
    const notification =
      await this.inboxNotificationRepository.markNotificationAsRead(
        notificationId,
        userId,
      );

    if (!notification) throw NotFound("Notification not found");

    return notification;
  }

  /** Deletes the notification associated with a friend request, if present. */
  async deleteNotificationByFriendRequest(friendRequestId: string) {
    const notification =
      await this.inboxNotificationRepository.deleteNotificationByFriendRequest(
        friendRequestId,
      );
    if (!notification) return null;

    return {
      notificationId: String(notification._id),
      userId: String(notification.user),
    };
  }

  /** Deletes a single notification belonging to a user. */
  async deleteNotification(notificationId: string, userId: string) {
    const notification =
      await this.inboxNotificationRepository.deleteNotificationOfUser(
        notificationId,
        userId,
      );

    if (!notification) throw NotFound("Notification not found");

    return {
      success: true,
      notificationId: String(notification._id),
    };
  }

  /** Marks unread mention notifications as read for a specific chat. */
  async markMentionsReadForChat(userId: string, chatId: string) {
    await this.inboxNotificationRepository.markMentionsReadForChat(
      userId,
      chatId,
    );

    return { success: true };
  }
}
