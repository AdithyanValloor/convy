import { describe, it, expect, beforeEach, vi } from "vitest";

import { IMessageRepository } from "../../../src/modules/messages/repositories/message.repository.js";
import { IMessageRequestRepository } from "../../../src/modules/messages/repositories/messageRequest.repository.js";
import { MessageService } from "../../../src/modules/messages/services/message.service.js";
import { IMessage } from "../../../src/modules/messages/models/message.model.js";
import { extractFirstUrl } from "../../../src/modules/messages/utils/linkPreview.js";
import * as ChatAPI from "../../../src/modules/chat/api/chat.api.js";
import { incrementUnreadCount } from "../../../src/modules/messages/cache/messages.cache.js";
import {
  fetchUsers,
  findUserById,
  getUserPrivacy,
} from "../../../src/grpc/user/user.grpc.client.js";
import { blockExists } from "../../../src/grpc/social/social.grpc.client.js";
import { publishMediaDeleteFile } from "../../../src/rabbitmq/publisher/media.publisher.js";
import { publishMessagerequestCreated } from "../../../src/rabbitmq/publisher/message.publisher.js";
import { createEvent } from "../../../src/rabbitmq/helpers/event.helper.js";
import {
  publishNotificationNotifyMention,
  publishNotificationNotifyReply,
} from "../../../src/rabbitmq/publisher/notification.publisher.js";

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock("../../../src/modules/messages/utils/linkPreview.js", () => ({
  extractFirstUrl: vi.fn(),
}));

vi.mock("../../../src/modules/chat/api/chat.api.js", () => ({
  findChat: vi.fn(),
  getChatUserState: vi.fn(),
  updateLastMessage: vi.fn(),
  findChats: vi.fn(),
  findChatById: vi.fn(),
  updateChatState: vi.fn(),
  findUserChatIds: vi.fn(),
  getChatStatesForUser: vi.fn(),
  incrementUnreadCount: vi.fn(),
}));

vi.mock("../../../src/modules/messages/cache/messages.cache.js", () => ({
  incrementUnreadCount: vi.fn(),
}));

vi.mock("../../../src/grpc/user/user.grpc.client.js", () => ({
  fetchUsers: vi.fn(),
  findUserById: vi.fn(),
  getUserPrivacy: vi.fn(),
}));

vi.mock("../../../src/grpc/social/social.grpc.client.js", () => ({
  blockExists: vi.fn(),
}));

vi.mock("../../../src/rabbitmq/publisher/media.publisher.js", () => ({
  publishMediaDeleteFile: vi.fn(),
}));

vi.mock("../../../src/rabbitmq/publisher/message.publisher.js", () => ({
  publishMessagerequestCreated: vi.fn(),
}));

vi.mock("../../../src/rabbitmq/helpers/event.helper.js", () => ({
  createEvent: vi.fn(),
}));

vi.mock("../../../src/rabbitmq/publisher/notification.publisher.js", () => ({
  publishNotificationNotifyMention: vi.fn(),
  publishNotificationNotifyReply: vi.fn(),
}));

// ============================================================================
// Repository Mocks
// ============================================================================

const messageRepository = {
  findByIds: vi.fn(),
  findMessages: vi.fn(),
  countMessages: vi.fn(),
  createMessage: vi.fn(),
  findById: vi.fn(),
  createForwardedMessage: vi.fn(),
  toggleReaction: vi.fn(),
  findLatestIncomingMessage: vi.fn(),
  markMessagesAsSeen: vi.fn(),
  countUnseenMessages: vi.fn(),
  editMessage: vi.fn(),
  deleteMessage: vi.fn(),
  searchMessages: vi.fn(),
} as unknown as IMessageRepository;

const messageRequestRepository = {
  findPendingRequest: vi.fn(),
  createRequest: vi.fn(),
} as unknown as IMessageRequestRepository;

// ============================================================================
// Service Setup
// ============================================================================

const service = new MessageService(
  messageRepository as any,
  messageRequestRepository as any,
);

// ============================================================================
// Test Data
// ============================================================================

const userId = "user-1";
const otherUserId = "user-2";
const thirdUserId = "user-3";
const chatId = "chat-1";
const targetChatId = "chat-2";
const messageId = "message-1";
const replyMessageId = "message-2";

const makeObjectId = (id: string) => {
  const oid: any = { toString: () => id };
  oid._id = oid;
  return oid;
};

const makeMessage = (overrides: Record<string, any> = {}) =>
  ({
    _id: makeObjectId(messageId),
    sender: makeObjectId(userId),
    chat: makeObjectId(chatId),
    content: "hello",
    file: null,
    deliveredTo: [makeObjectId(otherUserId)],
    replyTo: null,
    linkPreview: null,
    mentions: [],
    reactions: [],
    deleted: false,
    createdAt: new Date("2026-01-10T10:00:00.000Z"),
    ...overrides,
  }) as unknown as IMessage;

const replyMessage = makeMessage({
  _id: makeObjectId(replyMessageId),
  sender: makeObjectId(otherUserId),
  content: "original message",
});

const baseDirectChat = {
  _id: makeObjectId(chatId),
  members: [makeObjectId(userId), makeObjectId(otherUserId)],
  isGroup: false,
  requestPending: false,
  requestInitiator: null,
};

const baseGroupChat = {
  ...baseDirectChat,
  isGroup: true,
  members: [
    makeObjectId(userId),
    makeObjectId(otherUserId),
    makeObjectId(thirdUserId),
  ],
  admin: [makeObjectId(userId)],
};

const profileUsers = [
  { id: userId, username: "user1", displayName: "User One" },
  { id: otherUserId, username: "user2", displayName: "User Two" },
  { id: thirdUserId, username: "user3", displayName: "User Three" },
];

const file = {
  key: "chat/chat-1/image.webp",
  mimeType: "image/webp",
  size: 1234,
};

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(messageRepository.findByIds).mockResolvedValue([]);
  vi.mocked(messageRepository.findMessages).mockResolvedValue([]);
  vi.mocked(messageRepository.countMessages).mockResolvedValue(0);
  vi.mocked(messageRepository.findById).mockResolvedValue(null);
  vi.mocked(messageRepository.createMessage).mockResolvedValue(
    makeMessage() as any,
  );
  vi.mocked(messageRepository.createForwardedMessage).mockResolvedValue(
    makeMessage({
      _id: makeObjectId("forwarded-1"),
      content: "hello",
    }) as any,
  );
  vi.mocked(messageRepository.toggleReaction).mockResolvedValue(
    makeMessage({
      reactions: [{ emoji: "❤️", user: makeObjectId(userId) }],
    }) as any,
  );
  vi.mocked(messageRepository.findLatestIncomingMessage).mockResolvedValue(
    null,
  );
  vi.mocked(messageRepository.countUnseenMessages).mockResolvedValue(0);
  vi.mocked(messageRepository.editMessage).mockResolvedValue(
    makeMessage({ content: "updated" }) as any,
  );
  vi.mocked(messageRepository.deleteMessage).mockResolvedValue(
    makeMessage() as any,
  );
  vi.mocked(messageRepository.searchMessages).mockResolvedValue([]);

  vi.mocked(messageRequestRepository.findPendingRequest).mockResolvedValue(
    null,
  );
  vi.mocked(messageRequestRepository.createRequest).mockResolvedValue({
    id: "request-1",
    from: userId,
    to: otherUserId,
    firstMessage: "hello",
  } as any);

  vi.mocked(ChatAPI.findChat).mockResolvedValue(baseDirectChat as any);
  vi.mocked(ChatAPI.getChatUserState).mockResolvedValue(null);
  vi.mocked(ChatAPI.updateLastMessage).mockResolvedValue(null);
  vi.mocked(ChatAPI.findChats).mockResolvedValue([]);
  vi.mocked(ChatAPI.findChatById).mockResolvedValue(baseDirectChat as any);
  vi.mocked(ChatAPI.updateChatState).mockResolvedValue(null);
  vi.mocked(ChatAPI.findUserChatIds).mockResolvedValue([]);
  vi.mocked(ChatAPI.getChatStatesForUser).mockResolvedValue([]);

  vi.mocked(extractFirstUrl).mockReturnValue(null);
  vi.mocked(incrementUnreadCount).mockResolvedValue(1);
  vi.mocked(fetchUsers).mockResolvedValue(profileUsers as any);
  vi.mocked(findUserById).mockResolvedValue(profileUsers[0] as any);
  vi.mocked(getUserPrivacy).mockResolvedValue({ readReceipts: true } as any);
  vi.mocked(blockExists).mockResolvedValue(null as any);

  vi.mocked(publishMediaDeleteFile).mockResolvedValue(undefined);
  vi.mocked(publishMessagerequestCreated).mockResolvedValue(undefined);
  vi.mocked(publishNotificationNotifyMention).mockResolvedValue(undefined);
  vi.mocked(publishNotificationNotifyReply).mockResolvedValue(undefined);
  vi.mocked(createEvent).mockImplementation(
    (type, payload) =>
      ({
        type,
        payload,
      }) as any,
  );
});

// ============================================================================
// getAllMessagesFunction()
// ============================================================================

describe("getAllMessagesFunction()", () => {
  it("should reject when chatId is missing", async () => {
    await expect(
      service.getAllMessagesFunction("", userId, 1, 20),
    ).rejects.toThrow("ChatId is required");

    expect(ChatAPI.findChat).not.toHaveBeenCalled();
  });

  it("should reject when the user cannot access the chat", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.getAllMessagesFunction(chatId, userId, 1, 20),
    ).rejects.toThrow("Not allowed to access this chat");

    expect(messageRepository.findMessages).not.toHaveBeenCalled();
  });

  it("should return paginated messages", async () => {
    const first = makeMessage();
    const second = makeMessage({ _id: makeObjectId("message-3") });

    vi.mocked(messageRepository.findMessages).mockResolvedValue([
      first,
      second,
    ]);
    vi.mocked(messageRepository.countMessages).mockResolvedValue(5);
    vi.mocked(fetchUsers).mockResolvedValue(profileUsers as any);

    const result = await service.getAllMessagesFunction(chatId, userId, 2, 2);

    expect(messageRepository.findMessages).toHaveBeenCalledWith(
      { chat: chatId },
      { createdAt: -1 },
      2,
      2,
    );
    expect(messageRepository.countMessages).toHaveBeenCalledWith({
      chat: chatId,
    });
    expect(result).toEqual(
      expect.objectContaining({
        totalPages: 3,
        currentPage: 2,
      }),
    );
    expect(result.messages).toHaveLength(2);
  });

  it("should respect the user's clearedAt timestamp", async () => {
    const clearedAt = new Date("2026-01-15T00:00:00.000Z");
    vi.mocked(ChatAPI.getChatUserState).mockResolvedValue({
      clearedAt,
    } as any);

    await service.getAllMessagesFunction(chatId, userId, 1, 20);

    expect(messageRepository.findMessages).toHaveBeenCalledWith(
      {
        chat: chatId,
        createdAt: { $gt: clearedAt },
      },
      { createdAt: -1 },
      0,
      20,
    );
  });
});

// ============================================================================
// sendMessageFunction()
// ============================================================================

describe("sendMessageFunction()", () => {
  it("should reject when senderId is missing", async () => {
    await expect(
      service.sendMessageFunction(chatId, "hello", ""),
    ).rejects.toThrow();
  });

  it("should reject when chatId is missing", async () => {
    await expect(
      service.sendMessageFunction("", "hello", userId),
    ).rejects.toThrow("ChatId is required");
  });

  it("should reject when both content and file are missing", async () => {
    await expect(
      service.sendMessageFunction(chatId, "", userId),
    ).rejects.toThrow("Message must contain content or file");
  });

  it("should reject when the chat is not accessible", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.sendMessageFunction(chatId, "hello", userId),
    ).rejects.toThrow("Not allowed to send message in this chat");

    expect(messageRepository.createMessage).not.toHaveBeenCalled();
  });

  it("should reject a direct message when users are blocked", async () => {
    vi.mocked(blockExists).mockResolvedValue({
      blocker: userId,
      blocked: otherUserId,
    } as any);

    await expect(
      service.sendMessageFunction(chatId, "hello", userId),
    ).rejects.toThrow("Cannot send message to this user");

    expect(messageRepository.createMessage).not.toHaveBeenCalled();
  });

  it("should create and return a message successfully", async () => {
    const created = makeMessage();
    vi.mocked(messageRepository.createMessage).mockResolvedValue(created);
    vi.mocked(extractFirstUrl).mockReturnValue("https://example.com");

    const result = await service.sendMessageFunction(
      chatId,
      "check https://example.com",
      userId,
    );

    expect(messageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: userId,
        content: "check https://example.com",
        chat: chatId,
        deliveredTo: [otherUserId],
        replyTo: null,
        linkPreview: null,
        mentions: [],
      }),
    );

    expect(ChatAPI.updateLastMessage).toHaveBeenCalledWith(chatId, messageId);
    expect(result).toEqual(
      expect.objectContaining({
        messageId,
        firstUrl: "https://example.com",
        chatMembers: [userId, otherUserId],
        mentionedUserIds: [],
      }),
    );
    expect(ChatAPI.incrementUnreadCount).toHaveBeenCalledWith(otherUserId, chatId);
  });

  it("should allow a file-only message", async () => {
    await service.sendMessageFunction(
      chatId,
      "",
      userId,
      null,
      undefined,
      file,
    );

    expect(messageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "",
        file,
      }),
    );
  });

  it("should reject mentions in direct chats", async () => {
    await expect(
      service.sendMessageFunction(chatId, "hello", userId, null, [otherUserId]),
    ).rejects.toThrow("Mentions are only allowed in group chats");

    expect(messageRepository.createMessage).not.toHaveBeenCalled();
  });

  it("should filter mentions to valid group members and notify mentioned users", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue(baseGroupChat as any);
    vi.mocked(messageRepository.createMessage).mockResolvedValue(
      makeMessage({ chat: makeObjectId(chatId) }),
    );

    const result = await service.sendMessageFunction(
      chatId,
      "hello",
      userId,
      null,
      [otherUserId, "not-a-member", thirdUserId],
    );

    expect(messageRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        mentions: [otherUserId, thirdUserId],
      }),
    );
    expect(publishNotificationNotifyMention).toHaveBeenCalledTimes(2);
    expect(result.mentionedUserIds).toEqual([otherUserId, thirdUserId]);
  });

  it("should notify the original sender when replying to their message", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(replyMessage);

    await service.sendMessageFunction(chatId, "reply", userId, replyMessageId);

    expect(publishNotificationNotifyReply).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledWith(
      "notification.notify-reply",
      expect.objectContaining({
        replyUserId: otherUserId,
        senderId: userId,
        chatId,
        messageId,
      }),
    );
  });

  it("should create a message request for a pending direct chat", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue({
      ...baseDirectChat,
      requestPending: true,
      requestInitiator: makeObjectId(userId),
    } as any);
    vi.mocked(messageRepository.findById).mockResolvedValue(null);
    vi.mocked(fetchUsers).mockResolvedValue([
      { id: userId, username: "user1" },
      { id: otherUserId, username: "user2" },
    ] as any);

    await service.sendMessageFunction(chatId, "hello", userId);

    expect(messageRequestRepository.findPendingRequest).toHaveBeenCalledWith(
      userId,
      otherUserId,
    );
    expect(messageRequestRepository.createRequest).toHaveBeenCalledWith({
      from: userId,
      to: otherUserId,
      firstMessage: "hello",
    });
    expect(publishMessagerequestCreated).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// forwardMessageFunction()
// ============================================================================

describe("forwardMessageFunction()", () => {
  it("should reject when senderId is missing", async () => {
    await expect(
      service.forwardMessageFunction(messageId, [targetChatId], ""),
    ).rejects.toThrow();
  });

  it("should reject when messageId is missing", async () => {
    await expect(
      service.forwardMessageFunction("", [targetChatId], userId),
    ).rejects.toThrow("MessageId is required");
  });

  it("should reject when no target chats are supplied", async () => {
    await expect(
      service.forwardMessageFunction(messageId, [], userId),
    ).rejects.toThrow("At least one target chat is required");
  });

  it("should reject when more than 10 target chats are supplied", async () => {
    const targets = Array.from({ length: 11 }, (_, index) => `chat-${index}`);

    await expect(
      service.forwardMessageFunction(messageId, targets, userId),
    ).rejects.toThrow("maximum of 10 chats");
  });

  it("should reject when the original message does not exist", async () => {
    await expect(
      service.forwardMessageFunction(messageId, [targetChatId], userId),
    ).rejects.toThrow("Original message not found");
  });

  it("should reject when the origin chat is inaccessible", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(makeMessage());
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.forwardMessageFunction(messageId, [targetChatId], userId),
    ).rejects.toThrow("Not allowed to forward this message");
  });

  it("should skip blocked direct target chats and forward to allowed chats", async () => {
    const original = makeMessage();
    const blockedChat = {
      ...baseDirectChat,
      _id: makeObjectId("blocked-chat"),
    };
    const allowedChat = {
      ...baseGroupChat,
      _id: makeObjectId(targetChatId),
    };

    vi.mocked(messageRepository.findById).mockResolvedValue(original);
    vi.mocked(ChatAPI.findChat).mockResolvedValue(baseDirectChat as any);
    vi.mocked(ChatAPI.findChats).mockResolvedValue([
      blockedChat as any,
      allowedChat as any,
    ]);
    vi.mocked(blockExists)
      .mockResolvedValueOnce({ blocker: userId, blocked: otherUserId } as any)
      .mockResolvedValueOnce(null as any);

    const forwarded = makeMessage({
      _id: makeObjectId("forwarded-1"),
      chat: makeObjectId(targetChatId),
    });
    vi.mocked(messageRepository.createForwardedMessage).mockResolvedValue(
      forwarded,
    );

    const result = await service.forwardMessageFunction(
      messageId,
      ["blocked-chat", targetChatId],
      userId,
    );

    expect(messageRepository.createForwardedMessage).toHaveBeenCalledTimes(1);
    expect(ChatAPI.updateLastMessage).toHaveBeenCalledWith(
      targetChatId,
      "forwarded-1",
    );
    expect(result).toHaveLength(1);
    expect(result[0].chatId.toString()).toBe(targetChatId);
    expect(result[0].chatMembers).toEqual(
      expect.arrayContaining([userId, otherUserId, thirdUserId]),
    );
  });
});

// ============================================================================
// toggleReactionFunction()
// ============================================================================

describe("toggleReactionFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.toggleReactionFunction(messageId, "", "❤️"),
    ).rejects.toThrow();
  });

  it("should reject when emoji is missing", async () => {
    await expect(
      service.toggleReactionFunction(messageId, userId, ""),
    ).rejects.toThrow("Emoji is required");
  });

  it("should reject when the message does not exist", async () => {
    await expect(
      service.toggleReactionFunction(messageId, userId, "❤️"),
    ).rejects.toThrow("Message not found");
  });

  it("should reject a blocked direct-chat reaction", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(makeMessage());

    vi.mocked(ChatAPI.findChatById).mockResolvedValue({
      ...baseDirectChat,
      isGroup: false,
      members: [makeObjectId(userId), makeObjectId(otherUserId)],
    } as any);

    vi.mocked(blockExists).mockReset();
    vi.mocked(blockExists).mockResolvedValue(true as any);

    const blockResult = await blockExists(userId, otherUserId);

    console.log("ACTUAL blockExists RESULT:", blockResult);

    expect(blockResult).toBeTruthy();

    await expect(
      service.toggleReactionFunction(messageId, userId, "❤️"),
    ).rejects.toThrow("Cannot interact in this chat");
  });

  it("should toggle a reaction and return the populated response", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(makeMessage());
    vi.mocked(messageRepository.toggleReaction).mockResolvedValue(
      makeMessage({
        reactions: [{ emoji: "❤️", user: makeObjectId(userId) }],
      }),
    );

    const result = await service.toggleReactionFunction(
      messageId,
      userId,
      "❤️",
    );

    expect(messageRepository.toggleReaction).toHaveBeenCalledWith(
      messageId,
      userId,
      "❤️",
    );
    expect(result.chatId).toBe(chatId);
    expect(result.populated.reactions[0]).toEqual(
      expect.objectContaining({ emoji: "❤️" }),
    );
  });
});

// ============================================================================
// markMessagesAsSeenFunction()
// ============================================================================

describe("markMessagesAsSeenFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.markMessagesAsSeenFunction("", chatId),
    ).rejects.toThrow();
  });

  it("should reject when chatId is missing", async () => {
    await expect(
      service.markMessagesAsSeenFunction(userId, ""),
    ).rejects.toThrow("ChatId is required");
  });

  it("should reject when the user cannot access the chat", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.markMessagesAsSeenFunction(userId, chatId),
    ).rejects.toThrow("Not allowed");
  });

  it("should update read state and seen messages when read receipts are enabled", async () => {
    const latest = makeMessage({
      createdAt: new Date("2026-02-01T12:00:00.000Z"),
    });
    vi.mocked(messageRepository.findLatestIncomingMessage).mockResolvedValue(
      latest,
    );
    vi.mocked(messageRepository.countUnseenMessages).mockResolvedValue(3);
    vi.mocked(getUserPrivacy).mockResolvedValue({ readReceipts: true } as any);

    const result = await service.markMessagesAsSeenFunction(userId, chatId);

    expect(ChatAPI.updateChatState).toHaveBeenCalledWith(
      userId,
      chatId,
      latest.createdAt,
    );
    expect(messageRepository.markMessagesAsSeen).toHaveBeenCalledWith(
      chatId,
      userId,
    );
    expect(result).toEqual({
      success: true,
      modifiedCount: 3,
      emitSeen: true,
    });
  });

  it("should still clear unread state without marking messages seen when read receipts are disabled", async () => {
    vi.mocked(getUserPrivacy).mockResolvedValue({ readReceipts: false } as any);
    vi.mocked(messageRepository.countUnseenMessages).mockResolvedValue(2);

    const result = await service.markMessagesAsSeenFunction(userId, chatId);

    expect(ChatAPI.updateChatState).not.toHaveBeenCalled();
    expect(messageRepository.markMessagesAsSeen).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      modifiedCount: 2,
      emitSeen: false,
    });
  });
});

// ============================================================================
// editMessageFunction()
// ============================================================================

describe("editMessageFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.editMessageFunction(messageId, "updated", ""),
    ).rejects.toThrow();
  });

  it("should reject when content is missing", async () => {
    await expect(
      service.editMessageFunction(messageId, "", userId),
    ).rejects.toThrow("Content is required");
  });

  it("should reject when the message does not exist", async () => {
    await expect(
      service.editMessageFunction(messageId, "updated", userId),
    ).rejects.toThrow("Message not found");
  });

  it("should reject when another user owns the message", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(
      makeMessage({ sender: makeObjectId(otherUserId) }),
    );

    await expect(
      service.editMessageFunction(messageId, "updated", userId),
    ).rejects.toThrow("Not authorized to edit this message");

    expect(messageRepository.editMessage).not.toHaveBeenCalled();
  });

  it("should edit the message successfully", async () => {
    const updated = makeMessage({ content: "updated" });
    vi.mocked(messageRepository.findById).mockResolvedValue(makeMessage());
    vi.mocked(messageRepository.editMessage).mockResolvedValue(updated);

    const result = await service.editMessageFunction(
      messageId,
      "updated",
      userId,
    );

    expect(messageRepository.editMessage).toHaveBeenCalledWith(
      messageId,
      "updated",
    );
    expect(result).toEqual(
      expect.objectContaining({
        chatId,
      }),
    );
  });
});

// ============================================================================
// deleteMessageFunction()
// ============================================================================

describe("deleteMessageFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.deleteMessageFunction(messageId, ""),
    ).rejects.toThrow();
  });

  it("should reject when the message does not exist", async () => {
    await expect(
      service.deleteMessageFunction(messageId, userId),
    ).rejects.toThrow("Message not found");
  });

  it("should reject when another user owns the message", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(
      makeMessage({ sender: makeObjectId(otherUserId) }),
    );

    await expect(
      service.deleteMessageFunction(messageId, userId),
    ).rejects.toThrow("Not authorized to delete this message");
  });

  it("should publish media deletion before deleting a message file", async () => {
    const message = makeMessage({ file });
    vi.mocked(messageRepository.findById).mockResolvedValue(message);

    await service.deleteMessageFunction(messageId, userId);

    expect(publishMediaDeleteFile).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledWith("media.delete-file", {
      key: file.key,
    });
    expect(messageRepository.deleteMessage).toHaveBeenCalledWith(messageId);
  });

  it("should delete a message without a file successfully", async () => {
    const message = makeMessage({ file: null });
    vi.mocked(messageRepository.findById).mockResolvedValue(message);
    vi.mocked(messageRepository.deleteMessage).mockResolvedValue(message);

    const result = await service.deleteMessageFunction(messageId, userId);

    expect(publishMediaDeleteFile).not.toHaveBeenCalled();
    expect(result.chatId).toBe(chatId);
  });
});

// ============================================================================
// searchMessagesFunction()
// ============================================================================

describe("searchMessagesFunction()", () => {
  it("should reject when chatId is missing", async () => {
    await expect(service.searchMessagesFunction("", userId)).rejects.toThrow(
      "ChatId is required",
    );
  });

  it("should reject when userId is missing", async () => {
    await expect(service.searchMessagesFunction(chatId, "")).rejects.toThrow();
  });

  it("should reject when the chat is inaccessible", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.searchMessagesFunction(chatId, userId),
    ).rejects.toThrow("Not allowed to search this chat");
  });

  it("should build a text-search filter and return pagination metadata", async () => {
    const message = makeMessage();
    vi.mocked(messageRepository.searchMessages).mockResolvedValue([message]);
    vi.mocked(messageRepository.countMessages).mockResolvedValue(3);

    const result = await service.searchMessagesFunction(
      chatId,
      userId,
      "hello",
      undefined,
      2,
      1,
    );

    expect(messageRepository.searchMessages).toHaveBeenCalledWith(
      {
        chat: chatId,
        deleted: false,
        $text: { $search: "hello" },
      },
      {
        score: { $meta: "textScore" },
      },
      {
        score: { $meta: "textScore" },
        createdAt: -1,
      },
      1,
      1,
    );
    expect(result).toEqual(
      expect.objectContaining({
        totalPages: 3,
        currentPage: 2,
        hasMore: true,
      }),
    );
  });

  it("should apply the user's clearedAt boundary to date filtering", async () => {
    const clearedAt = new Date("2026-05-10T12:00:00.000Z");
    vi.mocked(ChatAPI.getChatUserState).mockResolvedValue({
      clearedAt,
    } as any);

    await service.searchMessagesFunction(
      chatId,
      userId,
      undefined,
      "2026-05-10",
    );

    const [filter] = vi.mocked(messageRepository.searchMessages).mock
      .calls[0] as any;

    expect(filter).toEqual(
      expect.objectContaining({
        chat: chatId,
        deleted: false,
      }),
    );
    const expectedEnd = new Date("2026-05-10");
    expectedEnd.setHours(23, 59, 59, 999);

    expect(filter.createdAt.$gte).toEqual(clearedAt);
    expect(filter.createdAt.$lte).toEqual(expectedEnd);
  });
});

// ============================================================================
// getMessageContextFunction()
// ============================================================================

describe("getMessageContextFunction()", () => {
  it("should reject when the target message does not exist", async () => {
    await expect(
      service.getMessageContextFunction(messageId, userId),
    ).rejects.toThrow("Message not found");
  });

  it("should reject when the target chat is inaccessible", async () => {
    vi.mocked(messageRepository.findById).mockResolvedValue(makeMessage());
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.getMessageContextFunction(messageId, userId),
    ).rejects.toThrow("Not allowed");
  });

  it("should reject when the target message is before the user's clearedAt", async () => {
    const createdAt = new Date("2026-01-10T10:00:00.000Z");
    const clearedAt = new Date("2026-01-11T10:00:00.000Z");

    vi.mocked(messageRepository.findById).mockResolvedValue(
      makeMessage({ createdAt }),
    );
    vi.mocked(ChatAPI.getChatUserState).mockResolvedValue({
      clearedAt,
    } as any);

    await expect(
      service.getMessageContextFunction(messageId, userId),
    ).rejects.toThrow("Message no longer accessible");
  });

  it("should return the target with surrounding before and after messages", async () => {
    const target = makeMessage();
    const beforeMessage = makeMessage({
      _id: makeObjectId("before-1"),
      createdAt: new Date("2026-01-09T10:00:00.000Z"),
    });
    const afterMessage = makeMessage({
      _id: makeObjectId("after-1"),
      createdAt: new Date("2026-01-11T10:00:00.000Z"),
    });

    vi.mocked(messageRepository.findById).mockResolvedValue(target);
    vi.mocked(messageRepository.findMessages)
      .mockResolvedValueOnce([beforeMessage])
      .mockResolvedValueOnce([afterMessage]);

    const result = await service.getMessageContextFunction(
      messageId,
      userId,
      5,
    );

    expect(messageRepository.findMessages).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        chat: chatId,
        createdAt: expect.objectContaining({ $lt: target.createdAt }),
      }),
      { createdAt: -1 },
      0,
      5,
    );

    expect(messageRepository.findMessages).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        chat: chatId,
        createdAt: expect.objectContaining({ $gt: target.createdAt }),
      }),
      { createdAt: 1 },
      0,
      5,
    );

    expect(result.target).toBeDefined();
    expect(result.before).toHaveLength(1);
    expect(result.after).toHaveLength(1);
  });
});

// ============================================================================
// getNewerMessagesFunction()
// ============================================================================

describe("getNewerMessagesFunction()", () => {
  it("should reject when the chat is inaccessible", async () => {
    vi.mocked(ChatAPI.findChat).mockResolvedValue(null);

    await expect(
      service.getNewerMessagesFunction(
        chatId,
        "2026-01-10T10:00:00.000Z",
        userId,
      ),
    ).rejects.toThrow("Not allowed");
  });

  it("should return hasMore and trim the extra message", async () => {
    const messages = Array.from({ length: 3 }, (_, index) =>
      makeMessage({
        _id: makeObjectId(`message-${index}`),
      }),
    );

    vi.mocked(messageRepository.findMessages).mockResolvedValue(messages);

    const result = await service.getNewerMessagesFunction(
      chatId,
      "2026-01-10T10:00:00.000Z",
      userId,
      2,
    );

    expect(messageRepository.findMessages).toHaveBeenCalledWith(
      expect.objectContaining({ chat: chatId }),
      { createdAt: 1 },
      0,
      3,
    );
    expect(result.hasMore).toBe(true);
    expect(result.messages).toHaveLength(2);
  });

  it("should respect the user's clearedAt timestamp", async () => {
    const clearedAt = new Date("2026-02-01T00:00:00.000Z");
    vi.mocked(ChatAPI.getChatUserState).mockResolvedValue({
      clearedAt,
    } as any);

    await service.getNewerMessagesFunction(
      chatId,
      "2026-01-10T10:00:00.000Z",
      userId,
    );

    const [filter] = vi.mocked(messageRepository.findMessages).mock
      .calls[0] as any;

    expect(filter.createdAt.$gt).toEqual(clearedAt);
  });
});

// ============================================================================
// globalSearchMessagesFunction()
// ============================================================================

describe("globalSearchMessagesFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.globalSearchMessagesFunction("", "hello"),
    ).rejects.toThrow();
  });

  it("should reject when query is empty", async () => {
    await expect(
      service.globalSearchMessagesFunction(userId, "   "),
    ).rejects.toThrow("Query is required");
  });

  it("should return no messages when the user has no chats", async () => {
    vi.mocked(ChatAPI.findUserChatIds).mockResolvedValue([]);

    const result = await service.globalSearchMessagesFunction(userId, "hello");

    expect(result).toEqual({ messages: [] });
    expect(messageRepository.searchMessages).not.toHaveBeenCalled();
  });

  it("should search across accessible chats and attach chat data", async () => {
    const chat1 = {
      _id: makeObjectId(chatId),
      members: [makeObjectId(userId)],
    };
    const chat2 = {
      _id: makeObjectId(targetChatId),
      members: [makeObjectId(userId)],
    };
    const message = makeMessage({ chat: makeObjectId(chatId) });

    vi.mocked(ChatAPI.findUserChatIds).mockResolvedValue([chat1, chat2] as any);
    vi.mocked(ChatAPI.getChatStatesForUser).mockResolvedValue([
      {
        chatId: makeObjectId(chatId),
        clearedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ] as any);
    vi.mocked(messageRepository.searchMessages).mockResolvedValue([message]);

    const result = await service.globalSearchMessagesFunction(userId, "hello");

    expect(messageRepository.searchMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([
          expect.objectContaining({
            $text: { $search: "hello" },
          }),
          { deleted: false },
        ]),
      }),
      { score: { $meta: "textScore" } },
      {
        score: { $meta: "textScore" },
        createdAt: -1,
      },
      0,
      20,
    );

    expect(result.messages[0].chat).toBe(chat1);
  });
});
