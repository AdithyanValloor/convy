import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getAllMessages,
  sendMessage,
  forwardMessage,
  toggleReaction,
  markMessagesAsSeen,
  editMessage,
  deleteMessage,
  searchMessages,
  getMessageContext,
  getNewerMessages,
  globalSearchMessages,
} from "../../../src/modules/messages/controllers/message.controller.js";

import { messageService } from "../../../src/modules/messages/composition/container.js";
import * as ChatAPI from "../../../src/modules/chat/api/chat.api.js";
import { fetchLinkPreview } from "../../../src/modules/messages/utils/linkPreview.js";
import { toMessageSocketPayload } from "../../../src/modules/messages/utils/normalizeMessage.js";
import { createEvent } from "../../../src/rabbitmq/helpers/event.helper.js";

import {
  publishMessageCreated,
  publishMessageDelete,
  publishMessageEdited,
  publishMessageMentioned,
  publishMessageReaction,
  publishMessagesSeen,
  publishUnreadUpdate,
} from "../../../src/rabbitmq/publisher/message.publisher.js";

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock("../../../src/modules/messages/composition/container.js", () => ({
  messageService: {
    getAllMessagesFunction: vi.fn(),
    sendMessageFunction: vi.fn(),
    forwardMessageFunction: vi.fn(),
    toggleReactionFunction: vi.fn(),
    markMessagesAsSeenFunction: vi.fn(),
    editMessageFunction: vi.fn(),
    deleteMessageFunction: vi.fn(),
    searchMessagesFunction: vi.fn(),
    getMessageContextFunction: vi.fn(),
    getNewerMessagesFunction: vi.fn(),
    globalSearchMessagesFunction: vi.fn(),
  },
}));

vi.mock("../../../src/modules/chat/api/chat.api.js", () => ({
  findChatById: vi.fn(),
}));

vi.mock("../../../src/modules/messages/models/message.model.js", () => ({
  Message: {
    findById: vi.fn(),
  },
}));

vi.mock("../../../src/modules/messages/utils/linkPreview.js", () => ({
  fetchLinkPreview: vi.fn(),
}));

vi.mock("../../../src/grpc/user/user.grpc.client.js", () => ({
  findUserById: vi.fn(),
}));

vi.mock("../../../src/modules/messages/utils/normalizeMessage.js", () => ({
  toMessageSocketPayload: vi.fn((message) => message),
}));

vi.mock("../../../src/rabbitmq/helpers/event.helper.js", () => ({
  createEvent: vi.fn((type, payload) => ({ type, payload })),
}));

vi.mock("../../../src/rabbitmq/publisher/message.publisher.js", () => ({
  publishMessageCreated: vi.fn(),
  publishMessageDelete: vi.fn(),
  publishMessageEdited: vi.fn(),
  publishMessageMentioned: vi.fn(),
  publishMessageReaction: vi.fn(),
  publishMessagesSeen: vi.fn(),
  publishUnreadUpdate: vi.fn(),
}));

// ============================================================================
// Test Data
// ============================================================================

const userId = "user-1";
const otherUserId = "user-2";
const thirdUserId = "user-3";
const chatId = "chat-1";
const messageId = "message-1";

const makeObjectId = (id: string) => {
  const oid: any = {
    toString: () => id,
  };

  oid._id = oid;

  return oid;
};

const populatedMessage = {
  _id: makeObjectId(messageId),
  sender: userId,
  chat: chatId,
  content: "hello",
};

const validFile = {
  key: "chat/chat-1/a0b1c2d3-e4f5-6789-a0b1-c2d3e4f56789.png",
  mimeType: "image/png",
  size: 1024,
  originalName: "image.png",
};

const createRequest = (
  options: {
    body?: any;
    params?: any;
    query?: any;
    user?: any;
  } = {},
) =>
  ({
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {},
    user: Object.prototype.hasOwnProperty.call(options, "user")
      ? options.user
      : { id: userId },
  }) as any;

const createMockResponse = () => {
  const res: any = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);

  return res;
};

const createMockNext = () => vi.fn();

const expectNextCalled = (next: ReturnType<typeof vi.fn>) => {
  expect(next).toHaveBeenCalled();
};

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(toMessageSocketPayload).mockImplementation(
    (message) => message as any,
  );

  vi.mocked(createEvent).mockImplementation(
    (type, payload) =>
      ({
        type,
        payload,
      }) as any,
  );

  vi.mocked(fetchLinkPreview).mockResolvedValue(null);
});

// ============================================================================
// getAllMessages()
// ============================================================================

describe("getAllMessages()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({ user: undefined });
    const res = createMockResponse();
    const next = createMockNext();

    await getAllMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.getAllMessagesFunction).not.toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getAllMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.getAllMessagesFunction).not.toHaveBeenCalled();
  });

  it("should fetch messages with pagination and return 200", async () => {
    const data = {
      messages: [populatedMessage],
      totalPages: 2,
      currentPage: 2,
    };

    vi.mocked(messageService.getAllMessagesFunction).mockResolvedValue(
      data as any,
    );

    const req = createRequest({
      params: { chatId },
      query: { page: "2", limit: "10" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getAllMessages(req, res, next);

    expect(messageService.getAllMessagesFunction).toHaveBeenCalledWith(
      chatId,
      userId,
      2,
      10,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(data);
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================================
// sendMessage()
// ============================================================================

describe("sendMessage()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      body: { chatId, content: "hello" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: { content: "hello" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject when both content and file are missing", async () => {
    const req = createRequest({
      body: { chatId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject an oversized file", async () => {
    vi.mocked(ChatAPI.findChatById).mockResolvedValue({
      members: [makeObjectId(userId)],
    } as any);

    const req = createRequest({
      body: {
        chatId,
        file: {
          ...validFile,
          size: 5 * 1024 * 1024 + 1,
        },
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject an invalid file key", async () => {
    vi.mocked(ChatAPI.findChatById).mockResolvedValue({
      members: [makeObjectId(userId)],
    } as any);

    const req = createRequest({
      body: {
        chatId,
        file: {
          ...validFile,
          key: "chat/chat-1/not-valid.png",
        },
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject a file when the sender is not a member of the chat", async () => {
    vi.mocked(ChatAPI.findChatById).mockResolvedValue({
      members: [makeObjectId(otherUserId)],
    } as any);

    const req = createRequest({
      body: {
        chatId,
        file: validFile,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject an unsupported file type", async () => {
    vi.mocked(ChatAPI.findChatById).mockResolvedValue({
      members: [makeObjectId(userId)],
    } as any);

    const req = createRequest({
      body: {
        chatId,
        file: {
          ...validFile,
          mimeType: "video/mp4",
        },
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.sendMessageFunction).not.toHaveBeenCalled();
  });

  it("should send a text message, publish updates, and return 201", async () => {
    const result = {
      populated: populatedMessage,
      messageId,
      firstUrl: null,
      chatMembers: [userId, otherUserId],
      unreadCounts: {
        [otherUserId]: 1,
      },
      mentionedUserIds: [otherUserId],
    };

    vi.mocked(messageService.sendMessageFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      body: {
        chatId,
        content: "hello",
        mentionIds: [otherUserId],
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expect(messageService.sendMessageFunction).toHaveBeenCalledWith(
      chatId,
      "hello",
      userId,
      undefined,
      [otherUserId],
      undefined,
    );

    expect(publishMessageCreated).toHaveBeenCalledTimes(1);
    expect(publishMessageMentioned).toHaveBeenCalledTimes(1);
    expect(publishUnreadUpdate).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(populatedMessage);
    expect(next).not.toHaveBeenCalled();
  });

  it("should accept a valid file and pass it to the service", async () => {
    vi.mocked(ChatAPI.findChatById).mockResolvedValue({
      members: [makeObjectId(userId)],
    } as any);

    vi.mocked(messageService.sendMessageFunction).mockResolvedValue({
      populated: populatedMessage,
      messageId,
      firstUrl: null,
      chatMembers: [userId],
      unreadCounts: {},
      mentionedUserIds: [],
    } as any);

    const req = createRequest({
      body: {
        chatId,
        file: validFile,
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expect(ChatAPI.findChatById).toHaveBeenCalledWith(chatId);

    expect(messageService.sendMessageFunction).toHaveBeenCalledWith(
      chatId,
      "",
      userId,
      undefined,
      undefined,
      validFile,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(populatedMessage);
  });

  it("should trigger asynchronous link preview enrichment when firstUrl exists", async () => {
    vi.mocked(messageService.sendMessageFunction).mockResolvedValue({
      populated: populatedMessage,
      messageId,
      firstUrl: "https://example.com",
      chatMembers: [userId],
      unreadCounts: {},
      mentionedUserIds: [],
    } as any);

    const req = createRequest({
      body: {
        chatId,
        content: "check https://example.com",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(fetchLinkPreview).toHaveBeenCalledWith("https://example.com");
  });

  it("should forward service errors to next", async () => {
    const error = new Error("service failed");

    vi.mocked(messageService.sendMessageFunction).mockRejectedValue(error);

    const req = createRequest({
      body: {
        chatId,
        content: "hello",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await sendMessage(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ============================================================================
// forwardMessage()
// ============================================================================

describe("forwardMessage()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      body: { messageId, targetChatIds: [chatId] },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await forwardMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.forwardMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject when messageId or targetChatIds are missing", async () => {
    const req = createRequest({
      body: { messageId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await forwardMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.forwardMessageFunction).not.toHaveBeenCalled();
  });

  it("should forward messages, publish events, and return 201", async () => {
    const forwarded = {
      chatId: makeObjectId(chatId),
      message: populatedMessage,
      chatMembers: [userId, otherUserId],
      unreadCounts: {
        [otherUserId]: 2,
      },
    };

    vi.mocked(messageService.forwardMessageFunction).mockResolvedValue([
      forwarded as any,
    ]);

    const req = createRequest({
      body: {
        messageId,
        targetChatIds: [chatId],
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await forwardMessage(req, res, next);

    expect(messageService.forwardMessageFunction).toHaveBeenCalledWith(
      messageId,
      [chatId],
      userId,
    );

    expect(publishMessageCreated).toHaveBeenCalledTimes(1);
    expect(publishUnreadUpdate).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith([populatedMessage]);
  });

  it("should forward service errors to next", async () => {
    const error = new Error("forward failed");

    vi.mocked(messageService.forwardMessageFunction).mockRejectedValue(error);

    const req = createRequest({
      body: {
        messageId,
        targetChatIds: [chatId],
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await forwardMessage(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ============================================================================
// toggleReaction()
// ============================================================================

describe("toggleReaction()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { messageId },
      body: { emoji: "❤️" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await toggleReaction(req, res, next);

    expectNextCalled(next);
    expect(messageService.toggleReactionFunction).not.toHaveBeenCalled();
  });

  it("should toggle a reaction and publish the updated message", async () => {
    vi.mocked(messageService.toggleReactionFunction).mockResolvedValue({
      populated: populatedMessage,
      chatId,
    } as any);

    const req = createRequest({
      params: { messageId },
      body: { emoji: "❤️" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await toggleReaction(req, res, next);

    expect(messageService.toggleReactionFunction).toHaveBeenCalledWith(
      messageId,
      userId,
      "❤️",
    );

    expect(publishMessageReaction).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(populatedMessage);
  });

  it("should forward service errors to next", async () => {
    const error = new Error("reaction failed");

    vi.mocked(messageService.toggleReactionFunction).mockRejectedValue(error);

    const req = createRequest({
      params: { messageId },
      body: { emoji: "❤️" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await toggleReaction(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ============================================================================
// markMessagesAsSeen()
// ============================================================================

describe("markMessagesAsSeen()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await markMessagesAsSeen(req, res, next);

    expectNextCalled(next);
    expect(messageService.markMessagesAsSeenFunction).not.toHaveBeenCalled();
  });

  it("should publish seen and unread updates when emitSeen is true", async () => {
    vi.mocked(messageService.markMessagesAsSeenFunction).mockResolvedValue({
      success: true,
      modifiedCount: 3,
      emitSeen: true,
    });

    const req = createRequest({
      params: { chatId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await markMessagesAsSeen(req, res, next);

    expect(messageService.markMessagesAsSeenFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(publishMessagesSeen).toHaveBeenCalledTimes(1);
    expect(publishUnreadUpdate).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("should skip seen publication when emitSeen is false", async () => {
    vi.mocked(messageService.markMessagesAsSeenFunction).mockResolvedValue({
      success: true,
      modifiedCount: 0,
      emitSeen: false,
    });

    const req = createRequest({
      params: { chatId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await markMessagesAsSeen(req, res, next);

    expect(publishMessagesSeen).not.toHaveBeenCalled();
    expect(publishUnreadUpdate).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("should forward service errors to next", async () => {
    const error = new Error("seen failed");

    vi.mocked(messageService.markMessagesAsSeenFunction).mockRejectedValue(
      error,
    );

    const req = createRequest({
      params: { chatId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await markMessagesAsSeen(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ============================================================================
// editMessage()
// ============================================================================

describe("editMessage()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { messageId },
      body: { content: "updated" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await editMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.editMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject when messageId or content is missing", async () => {
    const req = createRequest({
      params: {},
      body: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await editMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.editMessageFunction).not.toHaveBeenCalled();
  });

  it("should edit a message, publish the update, and return 200", async () => {
    vi.mocked(messageService.editMessageFunction).mockResolvedValue({
      populated: populatedMessage,
      chatId,
    } as any);

    const req = createRequest({
      params: { messageId },
      body: { content: "updated" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await editMessage(req, res, next);

    expect(messageService.editMessageFunction).toHaveBeenCalledWith(
      messageId,
      "updated",
      userId,
    );

    expect(publishMessageEdited).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(populatedMessage);
  });
});

// ============================================================================
// deleteMessage()
// ============================================================================

describe("deleteMessage()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { messageId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await deleteMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.deleteMessageFunction).not.toHaveBeenCalled();
  });

  it("should reject when messageId is missing", async () => {
    const req = createRequest({
      params: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await deleteMessage(req, res, next);

    expectNextCalled(next);
    expect(messageService.deleteMessageFunction).not.toHaveBeenCalled();
  });

  it("should delete a message, publish the update, and return 200", async () => {
    vi.mocked(messageService.deleteMessageFunction).mockResolvedValue({
      populated: populatedMessage,
      chatId,
    } as any);

    const req = createRequest({
      params: { messageId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await deleteMessage(req, res, next);

    expect(messageService.deleteMessageFunction).toHaveBeenCalledWith(
      messageId,
      userId,
    );

    expect(publishMessageDelete).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(populatedMessage);
  });
});

// ============================================================================
// searchMessages()
// ============================================================================

describe("searchMessages()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      query: { chatId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await searchMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.searchMessagesFunction).not.toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      query: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await searchMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.searchMessagesFunction).not.toHaveBeenCalled();
  });

  it("should search with query, date, and pagination", async () => {
    const result = {
      messages: [populatedMessage],
      totalPages: 1,
      currentPage: 1,
      hasMore: false,
    };

    vi.mocked(messageService.searchMessagesFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      query: {
        chatId,
        query: "hello",
        date: "2026-01-10",
        page: "1",
        limit: "10",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await searchMessages(req, res, next);

    expect(messageService.searchMessagesFunction).toHaveBeenCalledWith(
      chatId,
      userId,
      "hello",
      "2026-01-10",
      1,
      10,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });
});

// ============================================================================
// getMessageContext()
// ============================================================================

describe("getMessageContext()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { messageId },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getMessageContext(req, res, next);

    expectNextCalled(next);
    expect(messageService.getMessageContextFunction).not.toHaveBeenCalled();
  });

  it("should reject when messageId is missing", async () => {
    const req = createRequest({
      params: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getMessageContext(req, res, next);

    expectNextCalled(next);
    expect(messageService.getMessageContextFunction).not.toHaveBeenCalled();
  });

  it("should return message context with the requested limit", async () => {
    const result = {
      target: populatedMessage,
      before: [],
      after: [],
    };

    vi.mocked(messageService.getMessageContextFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { messageId },
      query: { limit: "5" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getMessageContext(req, res, next);

    expect(messageService.getMessageContextFunction).toHaveBeenCalledWith(
      messageId,
      userId,
      5,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });
});

// ============================================================================
// getNewerMessages()
// ============================================================================

describe("getNewerMessages()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
      query: { after: "2026-01-10T10:00:00.000Z" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getNewerMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.getNewerMessagesFunction).not.toHaveBeenCalled();
  });

  it("should reject when after is missing", async () => {
    const req = createRequest({
      params: { chatId },
      query: {},
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getNewerMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.getNewerMessagesFunction).not.toHaveBeenCalled();
  });

  it("should fetch newer messages with the requested limit", async () => {
    const result = {
      messages: [populatedMessage],
      hasMore: true,
    };

    vi.mocked(messageService.getNewerMessagesFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { chatId },
      query: {
        after: "2026-01-10T10:00:00.000Z",
        limit: "15",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getNewerMessages(req, res, next);

    expect(messageService.getNewerMessagesFunction).toHaveBeenCalledWith(
      chatId,
      "2026-01-10T10:00:00.000Z",
      userId,
      15,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });
});

// ============================================================================
// globalSearchMessages()
// ============================================================================

describe("globalSearchMessages()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      query: { query: "hello" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await globalSearchMessages(req, res, next);

    expectNextCalled(next);
    expect(messageService.globalSearchMessagesFunction).not.toHaveBeenCalled();
  });

  it("should use the default limit when limit is missing", async () => {
    const result = {
      messages: [populatedMessage],
    };

    vi.mocked(messageService.globalSearchMessagesFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      query: {
        query: "hello",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await globalSearchMessages(req, res, next);

    expect(messageService.globalSearchMessagesFunction).toHaveBeenCalledWith(
      userId,
      "hello",
      20,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("should pass an explicit limit to the service", async () => {
    const result = {
      messages: [populatedMessage],
    };

    vi.mocked(messageService.globalSearchMessagesFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      query: {
        query: "hello",
        limit: "7",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await globalSearchMessages(req, res, next);

    expect(messageService.globalSearchMessagesFunction).toHaveBeenCalledWith(
      userId,
      "hello",
      7,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });
});
