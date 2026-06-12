import mongoose, { FilterQuery, Types } from "mongoose";
import { IMessage, Message } from "../models/message.model.js";
import {
  BadRequest,
  Unauthorized,
  NotFound,
  Forbidden,
} from "../../../utils/errors/httpErrors.js";

import { extractFirstUrl } from "../utils/linkPreview.js";
import { emitMessageRequestSent } from "../../../socket/emitters/messageRequest.emitters.js";
import { MessageRequestModel } from "../models/messageRequest.model.js";
import { MessageFile } from "../types/message.types.js";
import { deleteFile } from "../../media/s3.service.js";

import * as UserAPI from "../../user/api/user.api.js";
import * as SocialAPI from "../../social/api/social.api.js";
import * as NotificationAPI from "../../notifications/api/notifications.api.js";
import * as ChatAPI from "../../chat/api/chat.api.js";
import {
  getCachedUnreadCountOfUser,
  incrementUnreadCount,
  setCachedUnreadCountOfUser,
} from "../cache/messages.cache.js";

/** Message service helpers for message delivery, search, reactions, and read state. */

/** Resolves valid group mention IDs and rejects mentions in direct chats. */
const resolveMentions = (
  rawMentionIds: string[] | undefined,
  chat: { isGroup: boolean; members: Types.ObjectId[] },
): Types.ObjectId[] => {
  if (!rawMentionIds || rawMentionIds.length === 0) return [];

  if (!chat.isGroup) {
    throw BadRequest("Mentions are only allowed in group chats");
  }

  const memberIdSet = new Set(chat.members.map((member) => member.toString()));

  return rawMentionIds
    .filter((id) => memberIdSet.has(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

/** Returns paginated messages for a chat, respecting per-user clear history. */
export const getAllMessagesFunction = async (
  chatId: string,
  userId: string,
  page: number,
  limit: number,
) => {
  if (!chatId) throw BadRequest("ChatId is required");

  const chat = await ChatAPI.findChat(chatId, userId);

  if (!chat) {
    throw Forbidden("Not allowed to access this chat");
  }

  const state = await ChatAPI.getChatUserState(userId, chatId);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IMessage> = { chat: chatId };

  if (state?.clearedAt) {
    filter.createdAt = { $gt: state.clearedAt };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "displayName username profilePicture")
    .populate({
      path: "replyTo",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "username displayName profilePicture",
      },
    })
    .populate("reactions.user", "username displayName profilePicture")
    .populate("chat", "_id chatName isGroup");

  const total = await Message.countDocuments(filter);

  return {
    messages,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

/** Returns unread message counts for all chats the user belongs to. */
export const getUnreadCountsFunction = async (userId: string) => {
  if (!userId) throw Unauthorized();

  const unread = await getCachedUnreadCountOfUser(userId);
  if (unread) return unread;

  // Collect every chat first so unread counts can be keyed by chat ID.
  const userChats = await ChatAPI.findUserChatIds(userId);
  const chatIds = userChats.map((chat) => chat._id);

  if (chatIds.length === 0) return {};

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        chat: { $in: chatIds },
        deleted: false,
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $lookup: {
        from: "chatuserstates",
        let: {
          chatId: "$chat",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$chatId", "$$chatId"] },
                  { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                ],
              },
            },
          },
        ],
        as: "state",
      },
    },
    {
      $unwind: {
        path: "$state",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        readPoint: {
          $ifNull: [
            "$state.lastReadAt",
            {
              $ifNull: ["$state.clearedAt", new Date(0)],
            },
          ],
        },
      },
    },
    {
      $match: {
        $expr: {
          $gt: ["$createdAt", "$readPoint"],
        },
      },
    },
    {
      $group: {
        _id: "$chat",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadData: Record<string, number> = {};

  for (let chatId of chatIds) {
    unreadData[chatId.toString()] = 0;
  }

  for (let row of unreadCounts) {
    unreadData[row._id.toString()] = row.count;
  }

  await setCachedUnreadCountOfUser(userId, unreadData);

  return unreadData;
};

/** Creates a message, updates unread state, and queues reply or mention notifications. */
export const sendMessageFunction = async (
  chatId: string,
  content: string,
  senderId: string,
  replyTo?: string | null,
  mentionIds?: string[],
  file?: MessageFile,
) => {
  if (!senderId) throw Unauthorized();
  if (!chatId) throw BadRequest("ChatId is required");
  if (!content && !file) {
    throw BadRequest("Message must contain content or file");
  }

  const chat = await ChatAPI.findChat(chatId, senderId);
  if (!chat) throw Forbidden("Not allowed to send message in this chat");

  if (!chat.isGroup) {
    const otherMember = chat.members
      .map((member) => member.toString())
      .find((id) => id !== senderId);

    if (otherMember) {
      const allowed = await SocialAPI.blockExists(senderId, otherMember);

      if (!allowed) {
        throw Forbidden("Cannot send message to this user");
      }
    }
  }

  const deliveredTo = chat.members.filter((id) => id.toString() !== senderId);
  const firstUrl = content ? extractFirstUrl(content) : null;
  const resolvedMentions = resolveMentions(mentionIds, chat);

  const message = await Message.create({
    sender: senderId,
    content: content || "",
    file: file || undefined,
    chat: chatId,
    deliveredTo,
    replyTo: replyTo || null,
    linkPreview: null,
    mentions: resolvedMentions,
  });

  const uniqueMentions = new Set(resolvedMentions.map((id) => id.toString()));

  if (replyTo) {
    const repliedMessage = await Message.findById(replyTo);

    if (repliedMessage) {
      const replyUserId = repliedMessage.sender.toString();

      if (replyUserId !== senderId) {
        await NotificationAPI.notifyReply(
          replyUserId,
          senderId,
          chatId,
          message._id.toString(),
        );
      }
    }
  }

  const populated = await message.populate([
    { path: "sender", select: "displayName username profilePicture" },
    {
      path: "replyTo",
      select: "content sender",
      populate: {
        path: "sender",
        select: "username displayName",
      },
    },
  ]);

  // Persist the latest message pointer before unread counts are recalculated.
  await ChatAPI.updateLastMessage(chatId, message._id.toString());

  if (
    !chat.isGroup &&
    chat.requestPending &&
    chat.requestInitiator?.toString() === senderId
  ) {
    const toUserId = chat.members
      .map((member) => member.toString())
      .find((id) => id !== senderId);

    if (toUserId) {
      const existing = await MessageRequestModel.findOne({
        from: senderId,
        to: toUserId,
        status: "pending",
      });

      if (!existing) {
        const request = await MessageRequestModel.create({
          from: senderId,
          to: toUserId,
          firstMessage: content,
        });

        const populatedRequest = await request.populate([
          { path: "from", select: "username displayName profilePicture" },
          { path: "to", select: "username displayName profilePicture" },
        ]);
        emitMessageRequestSent(senderId, toUserId, populatedRequest);
      }
    }
  }

  const memberIds = chat.members.map((member) => member.toString());

  await Promise.all(
    [...uniqueMentions]
      .filter((id) => id !== senderId && memberIds.includes(id))
      .map((userId) =>
        NotificationAPI.notifyMention(
          userId,
          senderId,
          chatId,
          message._id.toString(),
        ),
      ),
  );

  const unreadCounts: Record<string, number> = {};

  const updates = memberIds
    .filter((member) => member !== senderId)
    .map(async (member) => {
      const count = await incrementUnreadCount(member, chatId);
      unreadCounts[member] = count;
    });

  await Promise.all(updates);

  return {
    populated,
    messageId: message._id.toString(),
    firstUrl,
    chatMembers: chat.members.map((member) => member.toString()),
    unreadCounts,
    mentionedUserIds: resolvedMentions.map((id) => id.toString()),
  };
};

/** Forwards a message into target chats the sender can still access. */
export const forwardMessageFunction = async (
  messageId: string,
  targetChatIds: string[],
  senderId: string,
) => {
  if (!senderId) throw Unauthorized();
  if (!messageId) throw BadRequest("MessageId is required");
  if (!targetChatIds || targetChatIds.length === 0) {
    throw BadRequest("At least one target chat is required");
  }

  if (targetChatIds.length > 10) {
    throw BadRequest(
      "You can forward messages to a maximum of 10 chats at once",
    );
  }

  const original = await Message.findById(messageId);
  if (!original) throw NotFound("Original message not found");

  const originChat = await ChatAPI.findChat(original.chat.toString(), senderId);

  if (!originChat) {
    throw Forbidden("Not allowed to forward this message");
  }

  const chats = await ChatAPI.findChats(targetChatIds, senderId);

  const results = (
    await Promise.all(
      chats.map(async (chat) => {
        if (!chat.isGroup) {
          const otherMember = chat.members
            .map((member) => member.toString())
            .find((id) => id !== senderId);

          if (otherMember) {
            const allowed = await SocialAPI.blockExists(senderId, otherMember);

            if (!allowed) {
              return null;
            }
          }
        }

        const deliveredTo = chat.members.filter(
          (id) => id.toString() !== senderId,
        );

        const forwardedMessage = await Message.create({
          chat: chat._id,
          sender: senderId,
          content: original.content,
          deliveredTo,
          forwarded: true,
          forwardedFrom: original._id,
          linkPreview: original.linkPreview || null,
        });

        await ChatAPI.updateLastMessage(
          chat._id.toString(),
          forwardedMessage._id.toString(),
        );

        const populated = await forwardedMessage.populate([
          { path: "sender", select: "displayName username profilePicture" },
          {
            path: "forwardedFrom",
            select: "content sender",
            populate: {
              path: "sender",
              select: "username displayName profilePicture",
            },
          },
        ]);

        const memberIds = chat.members.map((member) => member.toString());

        const unreadCounts: Record<string, number> = {};

        const updates = memberIds
          .filter((member) => member !== senderId)
          .map(async (member) => {
            const count = await incrementUnreadCount(member, chat._id.toString());
            unreadCounts[member] = count;
          });

        await Promise.all(updates);

        return {
          chatId: chat._id,
          message: populated,
          chatMembers: chat.members.map((member) => member.toString()),
          unreadCounts,
        };
      }),
    )
  ).filter((result) => result !== null);

  return results;
};

/** Toggles a user's reaction on a message and returns the updated payload. */
export const toggleReactionFunction = async (
  messageId: string,
  userId: string,
  emoji: string,
) => {
  if (!userId) throw Unauthorized();
  if (!emoji) throw BadRequest("Emoji is required");

  const message = await Message.findById(messageId);
  if (!message) throw NotFound("Message not found");

  const chat = await ChatAPI.findChatById(message.chat.toString());
  if (!chat) throw Forbidden("Chat does not exist");

  if (!chat.isGroup) {
    const otherMember = chat.members
      .map((member) => member.toString())
      .find((id) => id !== userId);

    if (otherMember) {
      const allowed = await SocialAPI.blockExists(userId, otherMember);

      if (!allowed) {
        throw Forbidden("Cannot interact in this chat");
      }
    }
  }

  const existingReactionIndex = message.reactions.findIndex(
    (reaction) => reaction.user.toString() === userId,
  );

  if (existingReactionIndex !== -1) {
    const existingReaction = message.reactions[existingReactionIndex];

    if (existingReaction.emoji === emoji) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    message.reactions.push({
      emoji,
      user: new mongoose.Types.ObjectId(userId),
    });
  }

  await message.save();

  const populated = await message.populate([
    { path: "sender", select: "displayName username profilePicture" },
    { path: "reactions.user", select: "username displayName profilePicture" },
  ]);

  return {
    populated,
    chatId: message.chat.toString(),
  };
};


/** Marks incoming messages as seen, honoring the user's read receipt preference. */
export const markMessagesAsSeenFunction = async (
  userId: string,
  chatId: string,
) => {
  if (!userId) throw Unauthorized();
  if (!chatId) throw BadRequest("ChatId is required");

  const chat = await ChatAPI.findChat(chatId, userId);
  if (!chat) throw Forbidden("Not allowed");

  // Read receipt privacy only affects outward seen status, not unread tracking.
  const privacy = await UserAPI.getUserPrivacy(userId);

  const latestIncomingMessage = await Message.findOne({
    chat: chatId,
    deleted: false,
    sender: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .select("createdAt");

  // Always advance lastReadAt so unread counts clear consistently.
  if (latestIncomingMessage) {
    await ChatAPI.updateChatState(
      userId,
      chatId,
      latestIncomingMessage.createdAt,
    );
  }

  // When read receipts are off, keep seen state private but still clear unread counts.
  if (privacy.readReceipts) {
    await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, seenBy: { $ne: userId } },
      { $addToSet: { seenBy: userId } },
    );

    await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, deliveredTo: userId },
      { $pull: { deliveredTo: userId } },
    );
  }

  const updated = await Message.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    seenBy: { $ne: userId },
  });

  return {
    success: true,
    modifiedCount: updated,
    emitSeen: privacy.readReceipts,
  };
};

/** Updates a message in place and marks it as edited. */
export const editMessageFunction = async (
  messageId: string,
  newContent: string,
  userId: string,
) => {
  if (!userId) throw Unauthorized();
  if (!newContent) throw BadRequest("Content is required");

  const message = await Message.findById(messageId);
  if (!message) throw NotFound("Message not found");

  if (message.sender.toString() !== userId) {
    throw Forbidden("Not authorized to edit this message");
  }

  message.content = newContent;
  message.edited = true;
  await message.save();

  const populated = await message.populate("sender", "username profilePicture");

  return {
    populated,
    chatId: message.chat.toString(),
  };
};

/** Soft-deletes a message while keeping the document for history and audit needs. */
export const deleteMessageFunction = async (
  messageId: string,
  userId: string,
) => {
  if (!userId) throw Unauthorized();

  const message = await Message.findById(messageId);
  if (!message) throw NotFound("Message not found");

  if (message.sender.toString() !== userId) {
    throw Forbidden("Not authorized to delete this message");
  }

  message.content = "This message was deleted";
  message.deleted = true;
  message.edited = false;
  message.replyTo = null;
  message.forwarded = false;
  message.forwardedFrom = null;
  message.reactions = [];
  message.linkPreview = undefined;

  if (message.file?.key) {
    await deleteFile(message.file.key);
  }

  await message.save();

  const populated = await message.populate(
    "sender",
    "username displayName profilePicture",
  );

  return {
    populated,
    chatId: message.chat.toString(),
  };
};

/** Searches messages within a chat using text and optional day-based filtering. */
export const searchMessagesFunction = async (
  chatId: string,
  userId: string,
  query?: string,
  date?: string,
  page: number = 1,
  limit: number = 20,
) => {
  if (!chatId) throw BadRequest("ChatId is required");
  if (!userId) throw Unauthorized();

  const chat = await ChatAPI.findChat(chatId, userId);

  if (!chat) throw Forbidden("Not allowed to search this chat");

  const state = await ChatAPI.getChatUserState(userId, chatId);
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IMessage> = { chat: chatId, deleted: false };

  if (state?.clearedAt) {
    filter.createdAt = { $gt: state.clearedAt };
  }

  if (query?.trim()) {
    filter.$text = { $search: query };
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    filter.createdAt = {
      $gte: state?.clearedAt
        ? new Date(Math.max(start.getTime(), state.clearedAt.getTime()))
        : start,
      $lte: end,
    };
  }

  const messages = await Message.find(
    filter,
    query ? { score: { $meta: "textScore" } } : {},
  )
    .sort(
      query
        ? { score: { $meta: "textScore" }, createdAt: -1 }
        : { createdAt: -1 },
    )
    .skip(skip)
    .limit(limit)
    .populate("sender", "displayName username profilePicture")
    .populate({
      path: "replyTo",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "username displayName profilePicture",
      },
    })
    .populate("reactions.user", "username displayName profilePicture");

  const total = await Message.countDocuments(filter);

  return {
    messages,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    hasMore: skip + messages.length < total,
  };
};

/** Returns a target message with surrounding context for jumps and deep links. */
export const getMessageContextFunction = async (
  messageId: string,
  userId: string,
  limit: number = 20,
) => {
  const populateConfig = [
    { path: "sender", select: "username displayName profilePicture" },
    {
      path: "replyTo",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "username displayName profilePicture",
      },
    },
    { path: "reactions.user", select: "username displayName profilePicture" },
  ];

  const target = await Message.findById(messageId).populate(populateConfig);
  if (!target) throw NotFound("Message not found");

  const chat = await ChatAPI.findChat(target.chat.toString(), userId);
  if (!chat) throw Forbidden("Not allowed");

  const state = await ChatAPI.getChatUserState(userId, target.chat.toString());

  if (state?.clearedAt && target.createdAt <= state.clearedAt) {
    throw Forbidden("Message no longer accessible");
  }

  const beforeFilter: FilterQuery<IMessage> = {
    chat: target.chat.toString(),
    createdAt: {
      $lt: target.createdAt,
      ...(state?.clearedAt && { $gt: state.clearedAt }),
    },
  };

  const afterFilter: FilterQuery<IMessage> = {
    chat: target.chat.toString(),
    createdAt: {
      $gt: state?.clearedAt
        ? new Date(
            Math.max(target.createdAt.getTime(), state.clearedAt.getTime()),
          )
        : target.createdAt,
    },
  };

  const [before, after] = await Promise.all([
    Message.find(beforeFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(populateConfig),
    Message.find(afterFilter)
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate(populateConfig),
  ]);

  return { target, before: before.reverse(), after };
};

/** Returns messages newer than a given timestamp for incremental chat loading. */
export const getNewerMessagesFunction = async (
  chatId: string,
  after: string,
  userId: string,
  limit: number = 20,
) => {
  const chat = await ChatAPI.findChat(chatId, userId);
  if (!chat) throw Forbidden("Not allowed");

  const afterDate = new Date(after);
  const state = await ChatAPI.getChatUserState(userId, chatId);

  const filter: FilterQuery<IMessage> = {
    chat: chatId,
    createdAt: {
      $gt: state?.clearedAt
        ? new Date(Math.max(afterDate.getTime(), state.clearedAt.getTime()))
        : afterDate,
    },
  };

  const messages = await Message.find(filter)
    .sort({ createdAt: 1 })
    .limit(limit + 1)
    .populate("sender", "displayName username profilePicture")
    .populate({
      path: "replyTo",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "username displayName profilePicture",
      },
    })
    .populate("reactions.user", "username displayName profilePicture");

  const hasMore = messages.length > limit;

  if (hasMore) {
    messages.pop();
  }

  return { messages, hasMore };
};

/** Searches messages across all chats the user can still access. */
export const globalSearchMessagesFunction = async (
  userId: string,
  query: string,
  limit: number = 20,
) => {
  if (!userId) throw Unauthorized();
  if (!query?.trim()) throw BadRequest("Query is required");

  // Build per-chat visibility rules so cleared history stays excluded.
  const userChats = await ChatAPI.findUserChatIds(userId);
  const chatIds = userChats.map((chat) => chat._id.toString());

  const states = await ChatAPI.getChatStatesForUser(userId, chatIds);

  const stateMap = new Map(
    states.map((state) => [state.chatId.toString(), state]),
  );

  const chatConditions = chatIds.map((chatId) => {
    const state = stateMap.get(chatId.toString());
    const condition: FilterQuery<IMessage> = { chat: chatId };

    if (state?.clearedAt) {
      condition.createdAt = { $gt: state.clearedAt };
    }

    return condition;
  });

  if (chatConditions.length === 0) return { messages: [] };

  const messages = await Message.find(
    {
      $and: [
        { $or: chatConditions },
        { $text: { $search: query } },
        { deleted: false },
      ],
    },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit)
    .populate({
      path: "chat",
      select: "_id chatName isGroup members",
      populate: {
        path: "members",
        select: "_id username displayName",
      },
    })
    .populate("sender", "displayName username profilePicture");

  return { messages };
};
