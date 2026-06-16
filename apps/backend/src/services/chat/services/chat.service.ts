import { Chat } from "../models/chat.model.js";
import {
  BadRequest,
  Forbidden,
  NotFound,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import { ChatUserState } from "../models/chatUserState.model.js";

import * as SocialAPI from "../../social/api/social.api.js";
import * as MessagesAPI from "../../messages/api/messages.api.js";

/** Chat service helpers for chat access, user state, and mute/archive actions. */

/** Returns chats for a user with their per-chat UI state merged in. */
export const fetchChatsFunction = async (userId: string) => {
  if (!userId) {
    throw BadRequest("User ID is required");
  }

  const chats = await Chat.find({
    members: userId,
    isDeleted: { $ne: true },
    $or: [{ requestPending: { $ne: true } }, { requestInitiator: userId }],
  })
    .populate("members", "-password")
    .populate("admin", "-password")
    .populate("createdBy", "-password")
    .populate("lastMessage");

  const states = await ChatUserState.find({ userId });

  const stateMap = new Map(states.map((s) => [s.chatId.toString(), s]));

  const enriched = chats.map((chat) => {
    const state = stateMap.get(chat._id.toString());

    return {
      ...chat.toObject(),
      isPinned: state?.isPinned ?? false,
      isArchived: state?.isArchived ?? false,
      clearedAt: state?.clearedAt ?? null,
      lastReadAt: state?.lastReadAt ?? null,
      mutedUntil: state?.mutedUntil ?? null,
    };
  });

  // Pinned chats stay on top, with the rest ordered by recent activity.
  enriched.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return enriched;
};

/** Returns an existing direct chat or creates a new direct or pending chat. */
export const accessChatFunction = async (
  userId: string,
  currentUserId: string,
  firstMessage?: string,
) => {
  if (!userId || !currentUserId) {
    throw BadRequest("Both user IDs are required");
  }

  if (userId === currentUserId) {
    throw BadRequest("Cannot create chat with yourself");
  }

  const allowed = await SocialAPI.blockExists(userId, currentUserId);

  if (!allowed) {
    throw Forbidden("Cannot access chat with this user");
  }

  // Reuse the existing direct chat, including pending request chats.
  const existingChat = await Chat.findOne({
    isGroup: false,
    members: { $all: [userId, currentUserId], $size: 2 },
  })
    .populate("members", "-password")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username profilePicture email" },
    });

  if (existingChat) {
    return {
      type: existingChat.requestPending ? "pending_chat" : "chat",
      data: existingChat,
    };
  }

  const friends = await SocialAPI.areFriends(currentUserId, userId);

  if (!friends) {
    const chat = await Chat.create({
      isGroup: false,
      members: [userId, currentUserId],
      requestPending: true,
      requestInitiator: currentUserId,
    });

    const populatedChat = await Chat.findById(chat._id).populate(
      "members",
      "-password",
    );

    return { type: "pending_chat", data: populatedChat };
  }

  const newChat = await Chat.create({
    chatName: "sender",
    isGroup: false,
    members: [userId, currentUserId],
  });

  const fullChat = await Chat.findById(newChat._id).populate(
    "members",
    "-password",
  );

  if (!fullChat) {
    throw NotFound("Chat creation failed");
  }

  return {
    type: "chat",
    data: fullChat,
  };
};

/** Toggles the pinned state for a user's chat. */
export const togglePinChatFunction = async (userId: string, chatId: string) => {
  if (!userId) throw Unauthorized();

  const state = await ChatUserState.findOne({ userId, chatId });

  const newValue = !state?.isPinned;

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    { isPinned: newValue },
    { upsert: true },
  );

  return { isPinned: newValue };
};

/** Toggles the archived state for a user's chat. */
export const toggleArchiveChatFunction = async (
  userId: string,
  chatId: string,
) => {
  if (!userId) throw Unauthorized();

  const state = await ChatUserState.findOne({ userId, chatId });

  const newValue = !state?.isArchived;

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    { isArchived: newValue },
    { upsert: true },
  );

  return { isArchived: newValue };
};

/** Moves the read boundary back to preserve a single unread message. */
export const markChatAsUnreadFunction = async (
  userId: string,
  chatId: string,
) => {
  if (!userId) throw Unauthorized();

  const latestIncomingMessage =
    await MessagesAPI.latestIncomingMessageOfOtherUSer(chatId, userId);

  if (!latestIncomingMessage) {
    return { chatId, count: 0 };
  }

  // Move lastReadAt just before the latest incoming message to keep one unread.
  const newLastReadAt = new Date(latestIncomingMessage.createdAt.getTime() - 1);

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    { lastReadAt: newLastReadAt },
    { upsert: true },
  );

  return { chatId, count: 1 };
};

/** Marks a chat as read for a user by advancing their read boundary. */
export const markChatAsReadFunction = async (
  userId: string,
  chatId: string,
) => {
  if (!userId) throw Unauthorized();
  if (!chatId) throw BadRequest("ChatId is required");

  const chat = await Chat.findOne({
    _id: chatId,
    members: userId,
  });
  if (!chat) throw Forbidden("Not allowed");

  const latestMessage = await MessagesAPI.latestMessage(chatId);

  if (!latestMessage) {
    return { unreadCount: 0 };
  }

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    {
      $max: {
        lastReadAt: latestMessage.createdAt,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  console.log("Chat state updated =========== ");
  await MessagesAPI.resetUnreadCount(userId, chatId)

  return { unreadCount: 0 };
};

/** Clears chat history for a user without deleting the shared chat itself. */
export const clearChatForUser = async (userId: string, chatId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    members: userId,
  });

  if (!chat) {
    throw Forbidden("Not allowed");
  }

  const now = new Date();

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    {
      clearedAt: now,
      lastReadAt: now,
      isArchived: false,
    },
    { upsert: true },
  );

  return true;
};

/** Removes a chat from one user's membership and resets their local chat state. */
export const deleteChatForUser = async (userId: string, chatId: string) => {
  const chat = await Chat.findOne({ _id: chatId, members: userId });
  if (!chat) throw Forbidden("Not allowed");

  const now = new Date();

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    { clearedAt: now, lastReadAt: now, isArchived: false, isPinned: false },
    { upsert: true },
  );

  await Chat.findByIdAndUpdate(chatId, {
    $pull: { members: userId },
  });

  return { chatId };
};

// Represents an indefinite mute without special-case null handling.
const MUTED_FOREVER_SENTINEL = new Date("9999-12-31T23:59:59.999Z");

export type MuteDuration = "1h" | "8h" | "24h" | "1w" | "forever";

const MUTE_DURATIONS_MS: Record<Exclude<MuteDuration, "forever">, number> = {
  "1h": 1 * 60 * 60 * 1000,
  "8h": 8 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

/** Applies a chat mute until the requested duration expires. */
export const muteChatFunction = async (
  userId: string,
  chatId: string,
  duration: MuteDuration,
) => {
  if (!userId) throw Unauthorized();

  const chat = await Chat.findOne({ _id: chatId, members: userId });
  if (!chat) throw Forbidden("Not allowed");

  const mutedUntil =
    duration === "forever"
      ? MUTED_FOREVER_SENTINEL
      : new Date(Date.now() + MUTE_DURATIONS_MS[duration]);

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    { mutedUntil },
    { upsert: true, new: true },
  );

  return { chatId, mutedUntil };
};

/** Removes any active mute for a user's chat. */
export const unmuteChatFunction = async (userId: string, chatId: string) => {
  if (!userId) throw Unauthorized();

  const chat = await Chat.findOne({ _id: chatId, members: userId });
  if (!chat) throw Forbidden("Not allowed");

  await ChatUserState.findOneAndUpdate(
    { userId, chatId },
    { mutedUntil: null },
    { upsert: true, new: true },
  );

  return { chatId, mutedUntil: null };
};
