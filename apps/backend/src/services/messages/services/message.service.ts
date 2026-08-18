import { FilterQuery, ProjectionType, SortOrder, Types } from "mongoose";
import { IMessage } from "../models/message.model.js";
import {
  BadRequest,
  Unauthorized,
  NotFound,
  Forbidden,
} from "../../../utils/errors/httpErrors.js";

import { extractFirstUrl } from "../utils/linkPreview.js";
import { emitMessageRequestSent } from "../../../socket/emitters/messageRequest.emitters.js";
import { MessageFile, MessageRequestDTO } from "../types/message.types.js";
import { deleteFile } from "../../media/s3.service.js";

import * as UserAPI from "../../user/api/user.api.js";
import * as SocialAPI from "../../social/api/social.api.js";
import * as NotificationAPI from "../../notifications/api/notifications.api.js";
import * as ChatAPI from "../../chat/api/chat.api.js";
import { incrementUnreadCount } from "../cache/messages.cache.js";
import { IMessageRepository } from "../repositories/message.repository.js";
import { IMessageRequestRepository } from "../repositories/messageRequest.repository.js";

/** Message service helpers for message delivery, search, reactions, and read state. */

export class MessageService {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly messageRequestRepository: IMessageRequestRepository,
  ) {}

  /** Resolves valid group mention IDs and rejects mentions in direct chats. */
  private resolveMentions(
    rawMentionIds: string[] | undefined,
    chat: { isGroup: boolean; members: Types.ObjectId[] },
  ): string[] {
    if (!rawMentionIds || rawMentionIds.length === 0) return [];

    if (!chat.isGroup) {
      throw BadRequest("Mentions are only allowed in group chats");
    }

    const memberIdSet = new Set(
      chat.members.map((member) => member.toString()),
    );

    return rawMentionIds.filter((id) => memberIdSet.has(id));
  }

  private async buildMessageResponses(messages: IMessage[]) {
    if (messages.length === 0) {
      return [];
    }

    const userIds = new Set<string>();
    const replyMessageIds = new Set<string>();

    // Collect users and reply message IDs.
    for (const message of messages) {
      userIds.add(message.sender.toString());

      if (message.replyTo) {
        replyMessageIds.add(message.replyTo.toString());
      }

      for (const reaction of message.reactions) {
        userIds.add(reaction.user.toString());
      }
    }

    // Fetch all replied messages in ONE DB query.
    const replyMessages = await this.messageRepository.findByIds([
      ...replyMessageIds,
    ]);

    const replyMap = new Map(
      replyMessages.map((message) => [message._id.toString(), message]),
    );

    // Collect reply senders too.
    for (const reply of replyMessages) {
      userIds.add(reply.sender.toString());
    }

    // Fetch ALL users in ONE User API call.
    const users = await UserAPI.fetchUsers([...userIds]);

    const userMap = new Map(users.map((user) => [user.id, user]));

    return messages.map((message) => {
      const reply = message.replyTo
        ? replyMap.get(message.replyTo.toString())
        : null;

      return {
        ...message,

        sender: userMap.get(message.sender.toString()) ?? null,

        replyTo: reply
          ? {
              ...reply,
              sender: userMap.get(reply.sender.toString()) ?? null,
            }
          : null,

        reactions: message.reactions.map((reaction) => ({
          emoji: reaction.emoji,
          user: userMap.get(reaction.user.toString()) ?? null,
        })),
      };
    });
  }

  /** Returns paginated messages for a chat, respecting per-user clear history. */
  async getAllMessagesFunction(
    chatId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    if (!chatId) throw BadRequest("ChatId is required");

    const chat = await ChatAPI.findChat(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed to access this chat");
    }

    const state = await ChatAPI.getChatUserState(userId, chatId);

    const skip = (page - 1) * limit;

    const filter: FilterQuery<IMessage> = {
      chat: chatId,
    };

    if (state?.clearedAt) {
      filter.createdAt = {
        $gt: state.clearedAt,
      };
    }

    const messages = await this.messageRepository.findMessages(
      filter,
      { createdAt: -1 },
      skip,
      limit,
    );

    const populatedMessages = await this.buildMessageResponses(messages);

    const total = await this.messageRepository.countMessages(filter);

    return {
      messages: populatedMessages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  // Helper to build message response.
  private async buildMessageResponse(message: IMessage) {
    const [result] = await this.buildMessageResponses([message]);

    return result;
  }

  async sendMessageFunction(
    chatId: string,
    content: string,
    senderId: string,
    replyTo?: string | null,
    mentionIds?: string[],
    file?: MessageFile,
  ) {
    if (!senderId) throw Unauthorized();

    if (!chatId) {
      throw BadRequest("ChatId is required");
    }

    if (!content && !file) {
      throw BadRequest("Message must contain content or file");
    }

    const chat = await ChatAPI.findChat(chatId, senderId);

    if (!chat) {
      throw Forbidden("Not allowed to send message in this chat");
    }

    if (!chat.isGroup) {
      const otherMember = chat.members
        .map((member) => member.toString())
        .find((id) => id !== senderId);

      if (otherMember) {
        const blockExists = await SocialAPI.blockExists(senderId, otherMember);

        if (blockExists) {
          throw Forbidden("Cannot send message to this user");
        }
      }
    }

    const deliveredTo = chat.members
      .filter((id) => id.toString() !== senderId)
      .map((id) => id.toString());

    const resolvedMentions = this.resolveMentions(mentionIds, chat);

    const firstUrl = content ? extractFirstUrl(content) : null;

    // Create message

    const message = await this.messageRepository.createMessage({
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

    // Reply notification

    if (replyTo) {
      const repliedMessage = await this.messageRepository.findById(replyTo);

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

    // Populate response
    const populated = await this.buildMessageResponse(message);

    // Update latest message
    await ChatAPI.updateLastMessage(chatId, message._id.toString());

    // Message request
    if (
      !chat.isGroup &&
      chat.requestPending &&
      chat.requestInitiator?.toString() === senderId
    ) {
      const toUserId = chat.members
        .map((member) => member.toString())
        .find((id) => id !== senderId);

      if (toUserId) {
        // MessageRequest repository should eventually own these DB calls.
        const existing = await this.messageRequestRepository.findPendingRequest(
          senderId,
          toUserId,
        );

        if (!existing) {
          const request = await this.messageRequestRepository.createRequest({
            from: senderId,
            to: toUserId,
            firstMessage: content,
          });

          const users = await UserAPI.fetchUsers([senderId, toUserId]);

          const userMap = new Map(users.map((user) => [user.id, user]));

          const fromUser = userMap.get(senderId);
          const toUser = userMap.get(toUserId);

          if (!fromUser || !toUser) {
            throw NotFound("Message request users not found");
          }

          const populatedRequest: MessageRequestDTO = {
            ...request,
            from: fromUser,
            to: toUser,
          };

          emitMessageRequestSent(senderId, toUserId, populatedRequest);
        }
      }
    }

    // Mention notifications
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

    // Unread counts
    const unreadCounts: Record<string, number> = {};

    const updates = memberIds
      .filter((member) => member !== senderId)
      .map(async (member) => {
        const count = await ChatAPI.incrementUnreadCount(member, chatId);

        unreadCounts[member] = count;
      });

    await Promise.all(updates);

    return {
      populated,
      messageId: message._id.toString(),
      firstUrl,
      chatMembers: memberIds,
      unreadCounts,
      mentionedUserIds: resolvedMentions.map((id) => id.toString()),
    };
  }

  /** Forwards a message into target chats the sender can still access. */
  async forwardMessageFunction(
    messageId: string,
    targetChatIds: string[],
    senderId: string,
  ) {
    if (!senderId) throw Unauthorized();

    if (!messageId) {
      throw BadRequest("MessageId is required");
    }

    if (!targetChatIds || targetChatIds.length === 0) {
      throw BadRequest("At least one target chat is required");
    }

    if (targetChatIds.length > 10) {
      throw BadRequest(
        "You can forward messages to a maximum of 10 chats at once",
      );
    }

    const original = await this.messageRepository.findById(messageId);

    if (!original) {
      throw NotFound("Original message not found");
    }

    const originChat = await ChatAPI.findChat(
      original.chat.toString(),
      senderId,
    );

    if (!originChat) {
      throw Forbidden("Not allowed to forward this message");
    }

    const chats = await ChatAPI.findChats(targetChatIds, senderId);

    const results = (
      await Promise.all(
        chats.map(async (chat) => {
          // Check block for direct chats.
          if (!chat.isGroup) {
            const otherMember = chat.members
              .map((member) => member.toString())
              .find((id) => id !== senderId);

            if (otherMember) {
              const blockExists = await SocialAPI.blockExists(
                senderId,
                otherMember,
              );

              if (blockExists) {
                return null;
              }
            }
          }

          const deliveredTo = chat.members
            .filter((member) => member.toString() !== senderId)
            .map((member) => member.toString());

          // Message DB operation goes through repository.
          const forwardedMessage =
            await this.messageRepository.createForwardedMessage({
              chat: chat._id.toString(),
              sender: senderId,
              content: original.content,
              deliveredTo,
              forwardedFrom: original._id.toString(),
              linkPreview: original.linkPreview || null,
            });

          // Chat DB operation stays behind ChatAPI.
          await ChatAPI.updateLastMessage(
            chat._id.toString(),
            forwardedMessage._id.toString(),
          );

          const memberIds = chat.members.map((member) => member.toString());

          // Redis unread count.
          const unreadCounts: Record<string, number> = {};

          const updates = memberIds
            .filter((member) => member !== senderId)
            .map(async (member) => {
              const count = await incrementUnreadCount(
                member,
                chat._id.toString(),
              );

              unreadCounts[member] = count;
            });

          await Promise.all(updates);

          return {
            chatId: chat._id,
            message: forwardedMessage,
            chatMembers: memberIds,
            unreadCounts,
          };
        }),
      )
    ).filter((result) => result !== null);

    return results;
  }

  private async buildReactionMessageResponse(message: IMessage) {
    const userIds = new Set<string>();

    // Sender
    userIds.add(message.sender.toString());

    // Reaction users
    for (const reaction of message.reactions) {
      userIds.add(reaction.user.toString());
    }

    const users = await UserAPI.fetchUsers([...userIds]);

    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      ...message,
      sender: userMap.get(message.sender.toString()) ?? null,
      reactions: message.reactions.map((reaction) => ({
        emoji: reaction.emoji,
        user: userMap.get(reaction.user.toString()) ?? null,
      })),
    };
  }

  /** Toggles a user's reaction on a message and returns the updated payload. */

  async toggleReactionFunction(
    messageId: string,
    userId: string,
    emoji: string,
  ) {
    if (!userId) throw Unauthorized();

    if (!emoji) {
      throw BadRequest("Emoji is required");
    }

    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw NotFound("Message not found");
    }

    const chat = await ChatAPI.findChatById(message.chat.toString());

    if (!chat) {
      throw Forbidden("Chat does not exist");
    }

    if (!chat.isGroup) {
      const otherMember = chat.members
        .map((member) => member.toString())
        .find((id) => id !== userId);

      if (otherMember) {
        const blockExists = await SocialAPI.blockExists(userId, otherMember);

        if (blockExists) {
          throw Forbidden("Cannot interact in this chat");
        }
      }
    }

    const updatedMessage = await this.messageRepository.toggleReaction(
      messageId,
      userId,
      emoji,
    );

    if (!updatedMessage) {
      throw NotFound("Message not found");
    }

    const populated = await this.buildReactionMessageResponse(updatedMessage);

    return {
      populated,
      chatId: updatedMessage.chat.toString(),
    };
  }

  /** Marks incoming messages as seen, honoring the user's read receipt preference. */
  async markMessagesAsSeenFunction(userId: string, chatId: string) {
    if (!userId) throw Unauthorized();

    if (!chatId) {
      throw BadRequest("ChatId is required");
    }

    const chat = await ChatAPI.findChat(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    // Read receipt privacy affects outward seen status,
    // but not unread tracking.
    const privacy = await UserAPI.getUserPrivacy(userId);

    const latestIncomingMessage =
      await this.messageRepository.findLatestIncomingMessage(chatId, userId);

    // Always advance lastReadAt so unread counts clear consistently.
    if (latestIncomingMessage) {
      await ChatAPI.updateChatState(
        userId,
        chatId,
        latestIncomingMessage.createdAt,
      );
    }

    // Only modify seenBy/deliveredTo when read receipts are enabled.
    if (privacy.readReceipts) {
      await this.messageRepository.markMessagesAsSeen(chatId, userId);
    }

    const updated = await this.messageRepository.countUnseenMessages(
      chatId,
      userId,
    );

    return {
      success: true,
      modifiedCount: updated,
      emitSeen: privacy.readReceipts,
    };
  }

  /** Updates a message in place and marks it as edited. */
  async editMessageFunction(
    messageId: string,
    newContent: string,
    userId: string,
  ) {
    if (!userId) {
      throw Unauthorized();
    }

    if (!newContent) {
      throw BadRequest("Content is required");
    }

    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw NotFound("Message not found");
    }

    if (message.sender.toString() !== userId) {
      throw Forbidden("Not authorized to edit this message");
    }

    const updatedMessage = await this.messageRepository.editMessage(
      messageId,
      newContent,
    );

    if (!updatedMessage) {
      throw NotFound("Message not found");
    }

    const populated = await this.buildMessageResponse(updatedMessage);

    return {
      populated,
      chatId: updatedMessage.chat.toString(),
    };
  }
  /** Soft-deletes a message while keeping the document for history and audit needs. */
  async deleteMessageFunction(messageId: string, userId: string) {
    if (!userId) {
      throw Unauthorized();
    }

    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw NotFound("Message not found");
    }

    if (message.sender.toString() !== userId) {
      throw Forbidden("Not authorized to delete this message");
    }

    // Delete associated file before removing its reference from the message.
    if (message.file?.key) {
      await deleteFile(message.file.key);
    }

    const deletedMessage =
      await this.messageRepository.deleteMessage(messageId);

    if (!deletedMessage) {
      throw NotFound("Message not found");
    }

    const populated = await this.buildMessageResponse(deletedMessage);

    return {
      populated,
      chatId: deletedMessage.chat.toString(),
    };
  }

  /** Searches messages within a chat using text and optional day-based filtering. */
  async searchMessagesFunction(
    chatId: string,
    userId: string,
    query?: string,
    date?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    if (!chatId) {
      throw BadRequest("ChatId is required");
    }

    if (!userId) {
      throw Unauthorized();
    }

    const chat = await ChatAPI.findChat(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed to search this chat");
    }

    const state = await ChatAPI.getChatUserState(userId, chatId);

    const skip = (page - 1) * limit;

    const filter: FilterQuery<IMessage> = {
      chat: chatId,
      deleted: false,
    };

    // Respect the user's cleared chat history.
    if (state?.clearedAt) {
      filter.createdAt = {
        $gt: state.clearedAt,
      };
    }

    // Text search.
    if (query?.trim()) {
      filter.$text = {
        $search: query,
      };
    }

    // Day-based filtering.
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

    const projection: ProjectionType<IMessage> = query
      ? {
          score: {
            $meta: "textScore",
          },
        }
      : {};

    const sort: Record<string, SortOrder | { $meta: "textScore" }> = query
      ? {
          score: {
            $meta: "textScore",
          },
          createdAt: -1,
        }
      : {
          createdAt: -1,
        };

    const [messages, total] = await Promise.all([
      this.messageRepository.searchMessages(
        filter,
        projection,
        sort,
        skip,
        limit,
      ),
      this.messageRepository.countMessages(filter),
    ]);

    // Build User information through UserAPI rather than Mongoose populate.
    const populatedMessages = await Promise.all(
      messages.map((message) => this.buildMessageResponse(message)),
    );

    return {
      messages: populatedMessages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: skip + messages.length < total,
    };
  }

  /** Returns a target message with surrounding context for jumps and deep links. */
  async getMessageContextFunction(
    messageId: string,
    userId: string,
    limit: number = 20,
  ) {
    const target = await this.messageRepository.findById(messageId);

    if (!target) {
      throw NotFound("Message not found");
    }

    const chat = await ChatAPI.findChat(target.chat.toString(), userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const state = await ChatAPI.getChatUserState(
      userId,
      target.chat.toString(),
    );

    if (state?.clearedAt && target.createdAt <= state.clearedAt) {
      throw Forbidden("Message no longer accessible");
    }

    const beforeFilter: FilterQuery<IMessage> = {
      chat: target.chat.toString(),
      createdAt: {
        $lt: target.createdAt,
        ...(state?.clearedAt && {
          $gt: state.clearedAt,
        }),
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
      this.messageRepository.findMessages(
        beforeFilter,
        { createdAt: -1 },
        0,
        limit,
      ),

      this.messageRepository.findMessages(
        afterFilter,
        { createdAt: 1 },
        0,
        limit,
      ),
    ]);

    const populatedTarget = await this.buildMessageResponse(target);

    const populatedBefore = await Promise.all(
      before.reverse().map((message) => this.buildMessageResponse(message)),
    );

    const populatedAfter = await Promise.all(
      after.map((message) => this.buildMessageResponse(message)),
    );

    return {
      target: populatedTarget,
      before: populatedBefore,
      after: populatedAfter,
    };
  }

  /** Returns messages newer than a given timestamp for incremental chat loading. */
  async getNewerMessagesFunction(
    chatId: string,
    after: string,
    userId: string,
    limit: number = 20,
  ) {
    const chat = await ChatAPI.findChat(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

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

    const messages = await this.messageRepository.findMessages(
      filter,
      { createdAt: 1 },
      0,
      limit + 1,
    );

    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    const populatedMessages = await Promise.all(
      messages.map((message) => this.buildMessageResponse(message)),
    );

    return {
      messages: populatedMessages,
      hasMore,
    };
  }

  /** Searches messages across all chats the user can still access. */
  async globalSearchMessagesFunction(
    userId: string,
    query: string,
    limit: number = 20,
  ) {
    if (!userId) throw Unauthorized();
    if (!query?.trim()) throw BadRequest("Query is required");

    const userChats = await ChatAPI.findUserChatIds(userId);

    const chatIds = userChats.map((chat) => chat._id.toString());

    if (chatIds.length === 0) {
      return { messages: [] };
    }

    const states = await ChatAPI.getChatStatesForUser(userId, chatIds);

    const stateMap = new Map(
      states.map((state) => [state.chatId.toString(), state]),
    );

    const chatConditions: FilterQuery<IMessage>[] = chatIds.map((chatId) => {
      const state = stateMap.get(chatId);

      const condition: FilterQuery<IMessage> = {
        chat: chatId,
      };

      if (state?.clearedAt) {
        condition.createdAt = {
          $gt: state.clearedAt,
        };
      }

      return condition;
    });

    const filter: FilterQuery<IMessage> = {
      $and: [
        {
          $or: chatConditions,
        },
        {
          $text: {
            $search: query,
          },
        },
        {
          deleted: false,
        },
      ],
    };

    const messages = await this.messageRepository.searchMessages(
      filter,
      {
        score: {
          $meta: "textScore",
        },
      },
      {
        score: {
          $meta: "textScore",
        },
        createdAt: -1,
      },
      0,
      limit,
    );

    // Build response separately because Message no longer populates User.
    const populatedMessages = await Promise.all(
      messages.map((message) => this.buildMessageResponse(message)),
    );

    return {
      messages: populatedMessages,
    };
  }
}
