import { IChat } from "../models/chat.model.js";
import { ChatRepository } from "../repositories/mongo-chat.repository.js";
import { ChatUserStateRepository } from "../repositories/mongo-chatUserState.repository.js";

const chatRepository = new ChatRepository();
const chatUserStateRepository = new ChatUserStateRepository();

export const ensureChatExists = async (
  user1: string,
  user2: string,
): Promise<IChat> => {
  return chatRepository.ensureChatExists(user1, user2);
};

export const findChatById = async (id: string) => {
  return chatRepository.findById(id);
};

export const findChat = async (chatId: string, userId: string) => {
  return chatRepository.findByIdForUser(chatId, userId);
};

export const findChats = async (chatIds: string[], userId: string) => {
  return chatRepository.findByIdsForUser(chatIds, userId);
};

export const canJoinChat = async (chatId: string, userId: string) => {
  return chatRepository.canJoinChat(chatId, userId);
};

export const findUserChatIds = async (userId: string) => {
  return chatRepository.findUserChatIds(userId);
};

export const updateLastMessage = async (chatId: string, messageId: string) => {
  return chatRepository.updateLastMessage(chatId, messageId);
};

export const findPendingDirectChat = async (user1: string, user2: string) => {
  return chatRepository.findPendingDirectChat(user1, user2);
};

//TODO make chat Service call members.
export const acceptPendingDirectChat = async (user1: string, user2: string) => {
  return chatRepository.acceptPendingDirectChat(user1, user2);
};

export const deletePendingDirectChat = async (
  user1: string,
  user2: string,
  initiator: string,
) => {
  return chatRepository.deletePendingDirectChat(user1, user2, initiator);
};

// ===============================================

export const getChatUserState = async (userId: string, chatId: string) => {
  return chatUserStateRepository.findByUserAndChat(userId, chatId);
};

export const getUserChatStates = async (chatId: string, userIds: string[]) => {
  return chatUserStateRepository.findByChatAndUsers(chatId, userIds);
};

export const getChatStatesForUser = async (
  userId: string,
  chatIds: string[],
) => {
  return chatUserStateRepository.findByUserAndChats(userId, chatIds);
};

export const updateChatState = (
  userId: string,
  chatId: string,
  lastReadAt: Date,
) => {
  return chatUserStateRepository.updateLastReadAt(userId, chatId, lastReadAt);
};
