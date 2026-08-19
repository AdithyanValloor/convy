import { inboxNotificationRepository } from "../composition/container.js";
import { inboxNotificationService } from "../composition/container.js";

export const notifyMention = async (
  userId: string,
  actorId: string,
  chatId: string,
  messageId: string,
) => {
  return inboxNotificationService.createInboxNotification({
    userId,
    actorId,
    type: "mention",
    chatId,
    messageId,
  });
};

export const notifyReply = async (
  userId: string,
  actorId: string,
  chatId: string,
  messageId: string,
) => {
  return inboxNotificationService.createInboxNotification({
    userId,
    actorId,
    type: "reply",
    chatId,
    messageId,
  });
};

export const notifyGroupAdded = async (
  userId: string,
  actorId: string,
  groupId: string,
) => {
  return inboxNotificationService.createInboxNotification({
    userId,
    actorId,
    type: "group_added",
    groupId,
  });
};

export const notifyFriendRequestAccepted = async (
  userId: string,
  actorId: string,
) => {
  return inboxNotificationService.createInboxNotification({
    userId,
    actorId,
    type: "friend_request_accepted",
  });
};

export const notifyFriendRequestReceived = async (
  userId: string,
  actorId: string,
  friendRequestId: string,
) => {
  return inboxNotificationService.createInboxNotification({
    userId,
    actorId,
    type: "friend_request_received",
    friendRequestId,
  });
};

export const countUnread = async (userId: string) => {
  return inboxNotificationRepository.countUnread(userId);
};

export const deleteNotificationByFriendReq = async (
  friendRequestId: string,
) => {
  return inboxNotificationRepository.deleteNotificationByFriendRequest(
    friendRequestId,
  );
};
