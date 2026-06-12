import { IUser } from "../../user/models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { ChatUserState } from "../models/chatUserState.model.js";

export const ensureChatExists = async (user1: string, user2: string) => {
  const existing = await Chat.findOne({
    isGroup: false,
    members: { $all: [user1, user2], $size: 2 },
  });

  if (existing) return existing;

  return Chat.create({
    isGroup: false,
    members: [user1, user2],
  });
};

export const findChatById = async (id: string) => {
  const chat = await Chat.findById(id);
  return chat;
};

export const findChat = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    members: userId,
  });
  return chat;
};

export const findChats = async (chatIds: string[], userId: string) => {
  const chats = await Chat.find({
    _id: { $in: chatIds },
    members: userId,
  });
  return chats;
};

export const canJoinChat = async (chatId: string, userId: string) => {
  return Chat.findOne({
    _id: chatId,
    members: userId,
    isDeleted: false,
  }).select("_id");
};

export const findUserChatIds = async (userId: string) => {
  const chat = await Chat.find({ members: userId }).select("_id");
  return chat;
};

export const updateLastMessage = async (chatId: string, messageId: string) => {
  return Chat.findByIdAndUpdate(
    chatId,
    { lastMessage: messageId },
    { new: true },
  );
};

export const findPendingDirectChat = async (user1: string, user2: string) => {
  return Chat.findOne({
    isGroup: false,
    members: { $all: [user1, user2], $size: 2 },
    requestPending: true,
  });
};

export const acceptPendingDirectChat = async (user1: string, user2: string) => {
  const chat = await Chat.findOne({
    isGroup: false,
    members: { $all: [user1, user2], $size: 2 },
    requestPending: true,
  });

  if (!chat) return null;

  chat.requestPending = false;
  await chat.save();

  return chat.populate<{ members: IUser[] }>("members", "-password");
};

export const deletePendingDirectChat = async (
  user1: string,
  user2: string,
  initiator: string,
) => {
  return Chat.findOneAndDelete({
    isGroup: false,
    members: { $all: [user1, user2], $size: 2 },
    requestPending: true,
    requestInitiator: initiator,
  });
};

// ===============================================

export const getChatUserState = async (userId: string, chatId: string) => {
  return ChatUserState.findOne({ userId, chatId });
};

export const getUserChatStates = async (chatId: string, userIds: string[]) => {
  return ChatUserState.find({
    chatId,
    userId: { $in: userIds },
  });
};

export const getChatStatesForUser = async (
  userId: string,
  chatIds: string[],
) => {
  return ChatUserState.find({
    userId,
    chatId: { $in: chatIds },
  });
};

export const updateChatState = (
  userId: string,
  chatId: string,
  lastReadAt: Date,
) => {
  return ChatUserState.findOneAndUpdate(
    { userId, chatId },
    {
      $max: {
        lastReadAt,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );
};
