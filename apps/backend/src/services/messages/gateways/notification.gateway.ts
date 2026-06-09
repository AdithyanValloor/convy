import { createInboxNotification } from "../../notifications/services/inboxNotification.service.js";

export const notifyMention = async (
  userId: string,
  actorId: string,
  chatId: string,
  messageId: string,
) => {
  return createInboxNotification({
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
  return createInboxNotification({
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
  return createInboxNotification({
    userId,
    actorId,
    type: "group_added",
    groupId,
  });
};
