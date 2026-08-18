import { markRead } from "../cache/messages.cache.js";
import { MessageRepository } from "../repositories/mongo-message.repository.js";
import * as ChatAPI from "../../chat/api/chat.api.js";

const messageRepository = new MessageRepository();

export const latestIncomingMessageOfOtherUSer = async (
  chatId: string,
  userId: string,
) => {
  const latestIncomingMessage = await messageRepository.findLatestIncomingMessage(chatId, userId);
  return latestIncomingMessage;
};

export const latestMessage = async (
  chatId: string,
) => {
  const latestMessage = await messageRepository.findLatestMessage(chatId);
  return latestMessage;
};

