import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchChats,
  getUnreadCounts,
  accessChat,
  togglePinChat,
  toggleArchiveChat,
  markChatAsUnread,
  markChatAsRead,
  clearChat,
  deleteChat,
  muteChat,
  unmuteChat,
} from "../../../src/modules/chat/controllers/chat.controller.js";

import { chatService } from "../../../src/modules/chat/composition/container.js";
import { Chat } from "../../../src/modules/chat/models/chat.model.js";
import { publishUnreadUpdate } from "../../../src/rabbitmq/publisher/message.publisher.js";
import { createEvent } from "../../../src/rabbitmq/helpers/event.helper.js";

/* -------------------------------------------------------------------------- */
/*                                  MOCKS                                     */
/* -------------------------------------------------------------------------- */

vi.mock("../../../src/modules/chat/composition/container.js", () => ({
  chatService: {
    fetchChatsFunction: vi.fn(),
    getUnreadCounts: vi.fn(),
    accessChatFunction: vi.fn(),
    togglePinChatFunction: vi.fn(),
    toggleArchiveChatFunction: vi.fn(),
    markChatAsUnreadFunction: vi.fn(),
    markChatAsReadFunction: vi.fn(),
    clearChatForUser: vi.fn(),
    deleteChatForUser: vi.fn(),
    muteChatFunction: vi.fn(),
    unmuteChatFunction: vi.fn(),
  },
}));

vi.mock("../../../src/modules/chat/models/chat.model.js", () => ({
  Chat: {
    findOne: vi.fn(),
  },
}));

vi.mock("../../../src/rabbitmq/publisher/message.publisher.js", () => ({
  publishUnreadUpdate: vi.fn(),
}));

vi.mock("../../../src/rabbitmq/helpers/event.helper.js", () => ({
  createEvent: vi.fn(),
}));

/* -------------------------------------------------------------------------- */
/*                              TEST HELPERS                                  */
/* -------------------------------------------------------------------------- */

const userId = "user-1";
const chatId = "chat-1";
const otherUserId = "user-2";

const createMockResponse = () => {
  const res: any = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
};

const createMockNext = () => vi.fn();

const createRequest = (overrides: any = {}) => {
  return {
    user: {
      id: userId,
    },
    params: {},
    body: {},
    ...overrides,
  } as any;
};

/* -------------------------------------------------------------------------- */
/*                                  SETUP                                     */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  vi.clearAllMocks();
});

/* ========================================================================== */
/*                              fetchChats()                                  */
/* ========================================================================== */

describe("fetchChats()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await fetchChats(req, res, next);

    expect(chatService.fetchChatsFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should return the user's chats", async () => {
    const chats = [
      {
        _id: "chat-1",
        members: ["user-1", "user-2"],
      },
    ];

    vi.mocked(chatService.fetchChatsFunction).mockResolvedValue(chats as any);

    const req = createRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await fetchChats(req, res, next);

    expect(chatService.fetchChatsFunction).toHaveBeenCalledWith(userId);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(chats);

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass service errors to next", async () => {
    const error = new Error("Service failure");

    vi.mocked(chatService.fetchChatsFunction).mockRejectedValue(error);

    const req = createRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await fetchChats(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

/* ========================================================================== */
/*                           getUnreadCounts()                                */
/* ========================================================================== */

describe("getUnreadCounts()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getUnreadCounts(req, res, next);

    expect(chatService.getUnreadCounts).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should return unread counts", async () => {
    const unread = {
      "chat-1": 5,
      "chat-2": 2,
    };

    vi.mocked(chatService.getUnreadCounts).mockResolvedValue(unread);

    const req = createRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await getUnreadCounts(req, res, next);

    expect(chatService.getUnreadCounts).toHaveBeenCalledWith(userId);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      unread,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass service errors to next", async () => {
    const error = new Error("Unread count failure");

    vi.mocked(chatService.getUnreadCounts).mockRejectedValue(error);

    const req = createRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await getUnreadCounts(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

/* ========================================================================== */
/*                              accessChat()                                  */
/* ========================================================================== */

describe("accessChat()", () => {
  it("should reject when target userId is missing", async () => {
    const req = createRequest({
      body: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await accessChat(req, res, next);

    expect(chatService.accessChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when current user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      body: {
        userId: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await accessChat(req, res, next);

    expect(chatService.accessChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should access the chat successfully", async () => {
    const chat = {
      _id: chatId,
      members: [userId, otherUserId],
    };

    vi.mocked(chatService.accessChatFunction).mockResolvedValue(chat as any);

    const req = createRequest({
      body: {
        userId: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await accessChat(req, res, next);

    expect(chatService.accessChatFunction).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(chat);

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass service errors to next", async () => {
    const error = new Error("Cannot access chat");

    vi.mocked(chatService.accessChatFunction).mockRejectedValue(error);

    const req = createRequest({
      body: {
        userId: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await accessChat(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

/* ========================================================================== */
/*                           togglePinChat()                                  */
/* ========================================================================== */

describe("togglePinChat()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await togglePinChat(req, res, next);

    expect(Chat.findOne).not.toHaveBeenCalled();
    expect(chatService.togglePinChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chat is not accessible", async () => {
    vi.mocked(Chat.findOne).mockResolvedValue(null);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await togglePinChat(req, res, next);

    expect(Chat.findOne).toHaveBeenCalledWith({
      _id: chatId,
      members: userId,
    });

    expect(chatService.togglePinChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should toggle pin successfully", async () => {
    const result = {
      isPinned: true,
    };

    vi.mocked(Chat.findOne).mockResolvedValue({} as any);
    vi.mocked(chatService.togglePinChatFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await togglePinChat(req, res, next);

    expect(chatService.togglePinChatFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);

    expect(next).not.toHaveBeenCalled();
  });
});

/* ========================================================================== */
/*                         toggleArchiveChat()                                */
/* ========================================================================== */

describe("toggleArchiveChat()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleArchiveChat(req, res, next);

    expect(Chat.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chat is not accessible", async () => {
    vi.mocked(Chat.findOne).mockResolvedValue(null);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleArchiveChat(req, res, next);

    expect(Chat.findOne).toHaveBeenCalledWith({
      _id: chatId,
      members: userId,
    });

    expect(chatService.toggleArchiveChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should toggle archive successfully", async () => {
    const result = {
      isArchived: true,
    };

    vi.mocked(Chat.findOne).mockResolvedValue({} as any);
    vi.mocked(chatService.toggleArchiveChatFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleArchiveChat(req, res, next);

    expect(chatService.toggleArchiveChatFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);

    expect(next).not.toHaveBeenCalled();
  });
});

/* ========================================================================== */
/*                         markChatAsUnread()                                 */
/* ========================================================================== */

describe("markChatAsUnread()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsUnread(req, res, next);

    expect(chatService.markChatAsUnreadFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsUnread(req, res, next);

    expect(chatService.markChatAsUnreadFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should mark chat as unread successfully", async () => {
    const result = {
      unreadCount: 3,
    };

    vi.mocked(chatService.markChatAsUnreadFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsUnread(req, res, next);

    expect(chatService.markChatAsUnreadFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);

    expect(next).not.toHaveBeenCalled();
  });
});

/* ========================================================================== */
/*                           markChatAsRead()                                  */
/* ========================================================================== */

describe("markChatAsRead()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsRead(req, res, next);

    expect(chatService.markChatAsReadFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should mark chat as read and publish unread update", async () => {
    const unreadCount = 0;

    vi.mocked(chatService.markChatAsReadFunction).mockResolvedValue({
      unreadCount,
    } as any);

    const event = {
      type: "message.unread-update",
      data: {
        memberId: userId,
        chatId,
        unreadCounts: unreadCount,
      },
    };

    vi.mocked(createEvent).mockReturnValue(event as any);
    vi.mocked(publishUnreadUpdate).mockResolvedValue(undefined);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsRead(req, res, next);

    expect(chatService.markChatAsReadFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(createEvent).toHaveBeenCalledWith("message.unread-update", {
      memberId: userId,
      chatId,
      unreadCounts: unreadCount,
    });

    expect(publishUnreadUpdate).toHaveBeenCalledWith(event);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass service errors to next", async () => {
    const error = new Error("Unable to mark chat as read");

    vi.mocked(chatService.markChatAsReadFunction).mockRejectedValue(error);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsRead(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(publishUnreadUpdate).not.toHaveBeenCalled();
  });

  it("should pass publisher errors to next", async () => {
    const error = new Error("RabbitMQ failure");

    vi.mocked(chatService.markChatAsReadFunction).mockResolvedValue({
      unreadCount: 0,
    } as any);

    vi.mocked(createEvent).mockReturnValue({} as any);
    vi.mocked(publishUnreadUpdate).mockRejectedValue(error);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await markChatAsRead(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

/* ========================================================================== */
/*                              clearChat()                                   */
/* ========================================================================== */

describe("clearChat()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await clearChat(req, res, next);

    expect(chatService.clearChatForUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await clearChat(req, res, next);

    expect(chatService.clearChatForUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should clear chat successfully", async () => {
    vi.mocked(chatService.clearChatForUser).mockResolvedValue(false);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await clearChat(req, res, next);

    expect(chatService.clearChatForUser).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

/* ========================================================================== */
/*                              deleteChat()                                  */
/* ========================================================================== */

describe("deleteChat()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await deleteChat(req, res, next);

    expect(chatService.deleteChatForUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await deleteChat(req, res, next);

    expect(chatService.deleteChatForUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should delete chat successfully", async () => {
    vi.mocked(chatService.deleteChatForUser).mockResolvedValue(undefined as any);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await deleteChat(req, res, next);

    expect(chatService.deleteChatForUser).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      chatId,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

/* ========================================================================== */
/*                               muteChat()                                   */
/* ========================================================================== */

describe("muteChat()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
      body: { duration: "1h" },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await muteChat(req, res, next);

    expect(chatService.muteChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
      body: { duration: "1h" },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await muteChat(req, res, next);

    expect(chatService.muteChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when duration is missing", async () => {
    const req = createRequest({
      params: { chatId },
      body: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await muteChat(req, res, next);

    expect(chatService.muteChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject an invalid duration", async () => {
    const req = createRequest({
      params: { chatId },
      body: {
        duration: "2days",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await muteChat(req, res, next);

    expect(chatService.muteChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each(["1h", "8h", "24h", "1w", "forever"])(
    "should mute chat for %s",
    async (duration) => {
      const result = {
        chatId,
        mutedUntil:
          duration === "forever"
            ? null
            : new Date("2026-01-03"),
      };

      vi.mocked(chatService.muteChatFunction).mockResolvedValue(
        result as any,
      );

      const req = createRequest({
        params: { chatId },
        body: { duration },
      });

      const res = createMockResponse();
      const next = createMockNext();

      await muteChat(req, res, next);

      expect(chatService.muteChatFunction).toHaveBeenCalledWith(
        userId,
        chatId,
        duration,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);

      expect(next).not.toHaveBeenCalled();
    },
  );

  it("should pass service errors to next", async () => {
    const error = new Error("Mute failed");

    vi.mocked(chatService.muteChatFunction).mockRejectedValue(error);

    const req = createRequest({
      params: { chatId },
      body: {
        duration: "1h",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await muteChat(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

/* ========================================================================== */
/*                              unmuteChat()                                  */
/* ========================================================================== */

describe("unmuteChat()", () => {
  it("should reject when user is unauthenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await unmuteChat(req, res, next);

    expect(chatService.unmuteChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await unmuteChat(req, res, next);

    expect(chatService.unmuteChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should unmute chat successfully", async () => {
    const result = {
      chatId,
      mutedUntil: null,
    };

    vi.mocked(chatService.unmuteChatFunction).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await unmuteChat(req, res, next);

    expect(chatService.unmuteChatFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);

    expect(next).not.toHaveBeenCalled();
  });

  it("should pass service errors to next", async () => {
    const error = new Error("Unmute failed");

    vi.mocked(chatService.unmuteChatFunction).mockRejectedValue(error);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await unmuteChat(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
