import { FlattenMaps } from "mongoose";
import {
  ChatUserState,
  IChatUserState,
} from "../models/chatUserState.model.js";
import { IChatUserStateRepository } from "./chatUserState.repository.js";

export class ChatUserStateRepository implements IChatUserStateRepository {
  async findByUserAndChat(
    userId: string,
    chatId: string,
  ): Promise<FlattenMaps<IChatUserState> | null> {
    return ChatUserState.findOne({
      userId,
      chatId,
    }).lean();
  }

  async findByUser(userId: string): Promise<IChatUserState[]> {
    return ChatUserState.find({
      userId,
    }).lean();
  }

  async findByChatAndUsers(
    chatId: string,
    userIds: string[],
  ): Promise<FlattenMaps<IChatUserState>[]> {
    return ChatUserState.find({
      chatId,
      userId: { $in: userIds },
    }).lean();
  }

  async findByUserAndChats(
    userId: string,
    chatIds: string[],
  ): Promise<FlattenMaps<IChatUserState>[]> {
    return ChatUserState.find({
      userId,
      chatId: { $in: chatIds },
    }).lean();
  }

  async updateLastReadAt(
    userId: string,
    chatId: string,
    lastReadAt: Date,
  ): Promise<FlattenMaps<IChatUserState> | null> {
    return ChatUserState.findOneAndUpdate(
      {
        userId,
        chatId,
      },
      {
        $max: {
          lastReadAt,
        },
      },
      {
        upsert: true,
        new: true,
      },
    ).lean();
  }

  async updatePinChat(
    userId: string,
    chatId: string,
    newValue: boolean,
  ): Promise<void> {
    await ChatUserState.findOneAndUpdate(
      { userId, chatId },
      { isPinned: newValue },
      { upsert: true },
    );
  }

  async toggleArchiveChat(
    userId: string,
    chatId: string,
    newValue: boolean,
  ): Promise<void> {
    await ChatUserState.findOneAndUpdate(
      { userId, chatId },
      { isArchived: newValue },
      { upsert: true },
    );
  }

  async clearChat(userId: string, chatId: string, date: Date): Promise<void> {
    await ChatUserState.findOneAndUpdate(
      { userId, chatId },
      {
        clearedAt: date,
        lastReadAt: date,
        isArchived: false,
      },
      { upsert: true },
    );
  }

  async setMutedUntil(
    userId: string,
    chatId: string,
    mutedUntil: Date,
  ): Promise<void> {
    await ChatUserState.findOneAndUpdate(
      { userId, chatId },
      { mutedUntil },
      {
        upsert: true,
        new: true,
      },
    );
  }

  async unmuteChat(userId: string, chatId: string): Promise<void> {
    await ChatUserState.findOneAndUpdate(
      { userId, chatId },
      { mutedUntil: null },
      {
        upsert: true,
        new: true,
      },
    );
  }
}
