import { markRead } from "../cache/messages.cache.js";
import { Message } from "../models/message.model.js";

export const latestIncomingMessageOfOtherUSer = async (
  chatId: string,
  userId: string,
) => {
  const latestIncomingMessage = await Message.findOne({
    chat: chatId,
    deleted: false,
    sender: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .select("createdAt");

  return latestIncomingMessage;
};

export const latestMessage = async (
  chatId: string,
) => {
  const latestMessage = await Message.findOne({
    chat: chatId,
    deleted: false,
  })
    .sort({ createdAt: -1 })
    .select("createdAt");

  return latestMessage;
};

export const resetUnreadCount = (
  userId: string,
  chatId: string,
) => {
  return markRead(userId, chatId);
};