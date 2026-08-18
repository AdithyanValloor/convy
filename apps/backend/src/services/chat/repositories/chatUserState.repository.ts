import { FlattenMaps } from "mongoose";
import { IChatUserState } from "../models/chatUserState.model.js";

export interface IChatUserStateRepository {
  findByUserAndChat(
    userId: string,
    chatId: string,
  ): Promise<FlattenMaps<IChatUserState> | null>;

  findByChatAndUsers(
    chatId: string,
    userIds: string[],
  ): Promise<FlattenMaps<IChatUserState>[]>;

  findByUserAndChats(
    userId: string,
    chatIds: string[],
  ): Promise<FlattenMaps<IChatUserState>[]>;

  updateLastReadAt(
    userId: string,
    chatId: string,
    lastReadAt: Date,
  ): Promise<FlattenMaps<IChatUserState> | null>;

  findByUser(userId: string): Promise<IChatUserState[]>;

  updatePinChat(
    userId: string,
    chatId: string,
    newValue: boolean,
  ): Promise<void>;

  toggleArchiveChat(
    userId: string,
    chatId: string,
    newValue: boolean,
  ): Promise<void>;

  clearChat(userId: string, chatId: string, date: Date): Promise<void>;

  setMutedUntil(
    userId: string,
    chatId: string,
    mutedUntil: Date,
  ): Promise<void>;

  unmuteChat(userId: string, chatId: string): Promise<void>;

  incrementUnreadCount(userId: string, chatId: string): Promise<number>;

  resetUnreadCount(userId: string, chatId: string): Promise<void>;

  findUnreadCountsByUser(
    userId: string,
  ): Promise<FlattenMaps<IChatUserState>[]>;
}
