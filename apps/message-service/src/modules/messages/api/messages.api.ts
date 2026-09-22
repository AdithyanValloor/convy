import { NotFound } from "../../../errors/httpErrors.js";
import { toMessageDto } from "../../../types/message.dto.js";
import { MessageRepository } from "../repositories/mongo-message.repository.js";

const messageRepository = new MessageRepository();

export const latestIncomingMessageOfOtherUSer = async (
  chatId: string,
  userId: string,
) => messageRepository.findLatestIncomingMessage(chatId, userId);

export const latestMessage = async (chatId: string) =>
  messageRepository.findLatestMessage(chatId);

export const findMessageById = async (messageId: string) => {
  const message = await messageRepository.findById(messageId);
  if(!message){
    throw NotFound("Message not found")
  }
  return toMessageDto(message)
};
