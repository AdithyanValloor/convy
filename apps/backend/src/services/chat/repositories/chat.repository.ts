import { FlattenMaps } from "mongoose";
import { IChat } from "../models/chat.model.js";

export interface IChatRepository {
  ensureChatExists(
    user1: string,
    user2: string,
  ): Promise<FlattenMaps<IChat> | null>;

  findById(id: string): Promise<FlattenMaps<IChat> | null>;

  findByIdForUser(
    chatId: string,
    userId: string,
  ): Promise<FlattenMaps<IChat> | null>;

  findByIdsForUser(
    chatIds: string[],
    userId: string,
  ): Promise<FlattenMaps<IChat>[]>;

  canJoinChat(
    chatId: string,
    userId: string,
  ): Promise<FlattenMaps<IChat> | null>;

  findUserChatIds(userId: string): Promise<FlattenMaps<IChat>[]>;

  updateLastMessage(
    chatId: string,
    messageId: string,
  ): Promise<FlattenMaps<IChat> | null>;

  findPendingDirectChat(
    user1: string,
    user2: string,
  ): Promise<FlattenMaps<IChat> | null>;

  acceptPendingDirectChat(
    user1: string,
    user2: string,
  ): Promise<FlattenMaps<IChat> | null>;

  deletePendingDirectChat(
    user1: string,
    user2: string,
    initiator: string,
  ): Promise<FlattenMaps<IChat> | null>;

  findChatsForUser(userId: string): Promise<IChat[]>;

  findDirectChat(user1: string, user2: string): Promise<IChat | null>;

  createPendingDirectChat(
    userId: string,
    currentUserId: string,
  ): Promise<IChat>;

  createDirectChat(userId: string, currentUserId: string): Promise<IChat>;

  removeMemberFromChat(chatId: string, userId: string): Promise<void>;

  //---- GROUP

  findGroupById(chatId: string): Promise<IChat | null>;

  findGroupByIdForUser(chatId: string, userId: string): Promise<IChat | null>;

  createGroup(data: {
    name: string;
    members: string[];
    creatorId: string;
  }): Promise<IChat>;

  addMembers(chatId: string, memberIds: string[]): Promise<IChat | null>;

  removeMember(chatId: string, memberId: string): Promise<IChat | null>;

  toggleAdmin(
    chatId: string,
    memberId: string,
    makeAdmin: boolean,
  ): Promise<IChat | null>;

  leaveGroup(chatId: string, userId: string): Promise<IChat | null>;

  softDeleteGroup(chatId: string, userId: string): Promise<IChat | null>;

  transferOwnership(chatId: string, newOwnerId: string): Promise<IChat | null>;

  updateGroupAvatar(chatId: string, key: string): Promise<IChat | null>;

  updateGroupName(chatId: string, name: string): Promise<IChat | null>;
}
