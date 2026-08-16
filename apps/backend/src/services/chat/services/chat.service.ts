import {
  BadRequest,
  Forbidden,
  NotFound,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import * as SocialAPI from "../../social/api/social.api.js";
import * as MessagesAPI from "../../messages/api/messages.api.js";
import * as UserAPI from "../../user/api/user.api.js";
import { IChatRepository } from "../repositories/chat.repository.js";
import { IChatUserStateRepository } from "../repositories/chatUserState.repository.js";

/** Chat service helpers for chat access, user state, and mute/archive actions. */

// Represents an indefinite mute without special-case null handling.
const MUTED_FOREVER_SENTINEL = new Date("9999-12-31T23:59:59.999Z");

export type MuteDuration = "1h" | "8h" | "24h" | "1w" | "forever";

const MUTE_DURATIONS_MS: Record<Exclude<MuteDuration, "forever">, number> = {
  "1h": 1 * 60 * 60 * 1000,
  "8h": 8 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

export class ChatService {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatUserStateRepository: IChatUserStateRepository,
  ) {}

  /** Returns chats for a user with their per-chat UI state merged in. */
  async fetchChatsFunction(userId: string) {
    if (!userId) {
      throw BadRequest("User ID is required");
    }

    // TODO - Use API to populate
    const chats = await this.chatRepository.findChatsForUser(userId);
    // .populate("members", "-password")
    // .populate("admin", "-password")
    // .populate("createdBy", "-password")
    // .populate("lastMessage");

    const states = await this.chatUserStateRepository.findByUser(userId);

    const stateMap = new Map(states.map((s) => [s.chatId.toString(), s]));

    const enriched = chats.map((chat) => {
      const state = stateMap.get(chat._id.toString());

      return {
        ...chat,
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
  }
  /** Returns an existing direct chat or creates a new direct or pending chat. */
  async accessChatFunction(userId: string, currentUserId: string) {
    if (!userId || !currentUserId) {
      throw BadRequest("Both user IDs are required");
    }

    if (userId === currentUserId) {
      throw BadRequest("Cannot create chat with yourself");
    }

    const blockExists = await SocialAPI.blockExists(userId, currentUserId);

    if (blockExists) {
      throw Forbidden("Cannot access chat with this user");
    }

    // Reuse the existing direct chat, including pending request chats.
    const existingChat = await this.chatRepository.findDirectChat(
      userId,
      currentUserId,
    );
    // TODO populate data with API.

    // .populate("members", "-password")
    // .populate({
    //   path: "lastMessage",
    //   populate: { path: "sender", select: "username profilePicture email" },
    // });

    if (existingChat) {
      return {
        type: existingChat.requestPending ? "pending_chat" : "chat",
        data: existingChat,
      };
    }

    const friends = await SocialAPI.areFriends(currentUserId, userId);

    if (!friends) {
      const chat = await this.chatRepository.createPendingDirectChat(
        userId,
        currentUserId,
      );

      const members = await UserAPI.fetchUsers(chat.members.map(String));

      return {
        type: "pending_chat",
        data: {
          ...chat,
          members,
        },
      };
    }

    const newChat = await this.chatRepository.createDirectChat(
      userId,
      currentUserId,
    );

    const members = await UserAPI.fetchUsers(newChat.members.map(String));

    return {
      type: "chat",
      data: {
        ...newChat,
        members,
      },
    };
  }

  /** Toggles the pinned state for a user's chat. */
  async togglePinChatFunction(userId: string, chatId: string) {
    if (!userId) throw Unauthorized();

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const state = await this.chatUserStateRepository.findByUserAndChat(
      userId,
      chatId,
    );

    const newValue = !state?.isPinned;

    await this.chatUserStateRepository.updatePinChat(userId, chatId, newValue);

    return { isPinned: newValue };
  }
  /** Toggles the archived state for a user's chat. */
  async toggleArchiveChatFunction(userId: string, chatId: string) {
    if (!userId) throw Unauthorized();

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const state = await this.chatUserStateRepository.findByUserAndChat(
      userId,
      chatId,
    );

    const newValue = !state?.isArchived;

    await this.chatUserStateRepository.toggleArchiveChat(
      userId,
      chatId,
      newValue,
    );

    return { isArchived: newValue };
  }

  /** Moves the read boundary back to preserve a single unread message. */
  async markChatAsUnreadFunction(userId: string, chatId: string) {
    if (!userId) throw Unauthorized();

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const latestIncomingMessage =
      await MessagesAPI.latestIncomingMessageOfOtherUSer(chatId, userId);

    if (!latestIncomingMessage) {
      return { chatId, count: 0 };
    }

    // Move lastReadAt just before the latest incoming message to keep one unread.
    const newLastReadAt = new Date(
      latestIncomingMessage.createdAt.getTime() - 1,
    );

    await this.chatUserStateRepository.updateLastReadAt(
      userId,
      chatId,
      newLastReadAt,
    );

    return { chatId, count: 1 };
  }
  /** Marks a chat as read for a user by advancing their read boundary. */
  async markChatAsReadFunction(userId: string, chatId: string) {
    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("ChatId is required");

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const latestMessage = await MessagesAPI.latestMessage(chatId);

    if (!latestMessage) {
      return { unreadCount: 0 };
    }

    await this.chatUserStateRepository.updateLastReadAt(
      userId,
      chatId,
      latestMessage.createdAt,
    );

    await MessagesAPI.resetUnreadCount(userId, chatId);

    return { unreadCount: 0 };
  }
  /** Clears chat history for a user without deleting the shared chat itself. */
  async clearChatForUser(userId: string, chatId: string) {
    const chat = await this.chatRepository.findByIdForUser(chatId, userId);
    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const now = new Date();

    await this.chatUserStateRepository.clearChat(userId, chatId, now);

    return true;
  }
  /** Removes a chat from one user's membership and resets their local chat state. */
  async deleteChatForUser(userId: string, chatId: string) {
    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const now = new Date();

    await this.chatUserStateRepository.clearChat(userId, chatId, now);

    await this.chatRepository.removeMemberFromChat(chatId, userId);

    return { chatId };
  }

  async muteChatFunction(
    userId: string,
    chatId: string,
    duration: MuteDuration,
  ) {
    if (!userId) {
      throw Unauthorized();
    }

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    const mutedUntil =
      duration === "forever"
        ? MUTED_FOREVER_SENTINEL
        : new Date(Date.now() + MUTE_DURATIONS_MS[duration]);

    await this.chatUserStateRepository.setMutedUntil(
      userId,
      chatId,
      mutedUntil,
    );

    return {
      chatId,
      mutedUntil,
    };
  }

  /** Removes any active mute for a user's chat. */
  async unmuteChatFunction(userId: string, chatId: string) {
    if (!userId) {
      throw Unauthorized();
    }

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);

    if (!chat) {
      throw Forbidden("Not allowed");
    }

    await this.chatUserStateRepository.unmuteChat(userId, chatId);

    return {
      chatId,
      mutedUntil: null,
    };
  }
}
