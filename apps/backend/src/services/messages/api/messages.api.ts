import { MessageRepository } from "../repositories/mongo-message.repository.js";

const messageRepository = new MessageRepository();

export const latestIncomingMessageOfOtherUSer = async (
  chatId: string,
  userId: string,
) => messageRepository.findLatestIncomingMessage(chatId, userId);

export const latestMessage = async (chatId: string) =>
  messageRepository.findLatestMessage(chatId);

export const findMessageById = async (messageId: string) =>
  messageRepository.findById(messageId);
