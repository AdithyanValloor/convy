import { describe, it, expect, beforeEach, vi } from "vitest";

import * as MessagesAPI from "../../../src/modules/messages/api/messages.api.js";
import * as UserGrpc from "../../../src/grpc/user/user.grpc.client.js";
import * as SocialGrpc from "../../../src/grpc/social/social.grpc.client.js";

import { IChatRepository } from "../../../src/modules/chat/repositories/chat.repository.js";
import { IChatUserStateRepository } from "../../../src/modules/chat/repositories/chatUserState.repository.js";
import { ChatService } from "../../../src/modules/chat/services/chat.service.js";


vi.mock("../../../src/modules/messages/api/messages.api.js", () => ({
  latestIncomingMessageOfOtherUSer: vi.fn(),
  latestMessage: vi.fn(),
}));

vi.mock("../../../src/grpc/user/user.grpc.client.js", () => ({
  fetchUsers: vi.fn(),
}));

vi.mock("../../../src/grpc/social/social.grpc.client.js", () => ({
  areFriends: vi.fn(),
  blockExists: vi.fn(),
}));


// ==================================================
// Repository mocks
// ==================================================

const chatRepository = {
  findChatsForUser: vi.fn(),
  findDirectChat: vi.fn(),
  createPendingDirectChat: vi.fn(),
  createDirectChat: vi.fn(),
  findByIdForUser: vi.fn(),
  removeMemberFromChat: vi.fn(),
} as unknown as IChatRepository;

const chatUserStateRepository = {
  findByUser: vi.fn(),
  findByUserAndChat: vi.fn(),
  updatePinChat: vi.fn(),
  toggleArchiveChat: vi.fn(),
  updateLastReadAt: vi.fn(),
  resetUnreadCount: vi.fn(),
  clearChat: vi.fn(),
  setMutedUntil: vi.fn(),
  unmuteChat: vi.fn(),
  incrementUnreadCount: vi.fn(),
  findUnreadCountsByUser: vi.fn(),
};


// ==================================================
// Service
// ==================================================

const service = new ChatService(
  chatRepository as any,
  chatUserStateRepository as any,
);


// ==================================================
// Fixtures
// ==================================================

const userId = "user-1";
const otherUserId = "user-2";
const chatId = "chat-1";


// Mongoose-like ObjectId mock.
// Important: _id points to itself because the service accesses
// both member._id and member.toString() depending on the path.
const makeObjectId = (id: string) => {
  const oid: any = {
    toString: () => id,
  };

  oid._id = oid;

  return oid;
};


const user1 = {
  id: userId,
  username: "user1",
  displayName: "User One",
};

const user2 = {
  id: otherUserId,
  username: "user2",
  displayName: "User Two",
};


const baseChat = {
  _id: makeObjectId(chatId),

  members: [
    makeObjectId(userId),
    makeObjectId(otherUserId),
  ],

  admin: [],

  isGroup: false,

  requestPending: false,

  updatedAt: new Date("2026-01-02"),
};


const groupChat = {
  ...baseChat,

  isGroup: true,

  admin: [
    makeObjectId(userId),
  ],
};


const profileUsers = [
  user1,
  user2,
];

const block = {
  blocker: "blocker",
  blocked: "blocked",
} as unknown as SocialGrpc.Block;


// ==================================================
// Setup
// ==================================================

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(chatRepository.findChatsForUser)
    .mockResolvedValue([]);

  vi.mocked(chatUserStateRepository.findByUser)
    .mockResolvedValue([]);

  vi.mocked(UserGrpc.fetchUsers)
    .mockResolvedValue(profileUsers as any);

  vi.mocked(SocialGrpc.blockExists)
    .mockResolvedValue(null);

  vi.mocked(SocialGrpc.areFriends)
    .mockResolvedValue({
      areFriends: true,
    });
});


// ==================================================
// fetchChatsFunction()
// ==================================================

describe("fetchChatsFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.fetchChatsFunction(""),
    ).rejects.toThrow("User ID is required");

    expect(
      chatRepository.findChatsForUser,
    ).not.toHaveBeenCalled();
  });


  it("should return enriched chats with user state", async () => {
    vi.mocked(chatRepository.findChatsForUser)
      .mockResolvedValue([
        baseChat as any,
      ]);

    vi.mocked(chatUserStateRepository.findByUser)
      .mockResolvedValue([
        {
          chatId: makeObjectId(chatId),
          isPinned: true,
          isArchived: false,
          clearedAt: null,
          lastReadAt: null,
          mutedUntil: null,
        },
      ] as any);

    const result =
      await service.fetchChatsFunction(userId);

    expect(
      chatRepository.findChatsForUser,
    ).toHaveBeenCalledWith(userId);

    expect(
      chatUserStateRepository.findByUser,
    ).toHaveBeenCalledWith(userId);

    expect(
      UserGrpc.fetchUsers,
    ).toHaveBeenCalledWith([
      userId,
      otherUserId,
    ]);

    expect(result[0]).toEqual(
      expect.objectContaining({
        members: profileUsers,
        isPinned: true,
        isArchived: false,
      }),
    );
  });


  it("should populate admins for group chats", async () => {
    vi.mocked(chatRepository.findChatsForUser)
      .mockResolvedValue([
        groupChat as any,
      ]);

    const result =
      await service.fetchChatsFunction(userId);

    expect(result[0].admin).toEqual([
      user1,
    ]);
  });


  it("should use default state values when state does not exist", async () => {
    vi.mocked(chatRepository.findChatsForUser)
      .mockResolvedValue([
        baseChat as any,
      ]);

    vi.mocked(chatUserStateRepository.findByUser)
      .mockResolvedValue([]);

    const result =
      await service.fetchChatsFunction(userId);

    expect(result[0]).toEqual(
      expect.objectContaining({
        isPinned: false,
        isArchived: false,
        clearedAt: null,
        lastReadAt: null,
        mutedUntil: null,
      }),
    );
  });
});


// ==================================================
// accessChatFunction()
// ==================================================

describe("accessChatFunction()", () => {
  it("should reject when IDs are missing", async () => {
    await expect(
      service.accessChatFunction("", otherUserId),
    ).rejects.toThrow("Both user IDs are required");

    expect(
      SocialGrpc.blockExists,
    ).not.toHaveBeenCalled();
  });


  it("should reject when user tries to chat with themselves", async () => {
    await expect(
      service.accessChatFunction(userId, userId),
    ).rejects.toThrow("Cannot create chat with yourself");

    expect(
      SocialGrpc.blockExists,
    ).not.toHaveBeenCalled();
  });


  it("should reject when users are blocked", async () => {
    vi.mocked(SocialGrpc.blockExists)
      .mockResolvedValue(block);

    await expect(
      service.accessChatFunction(
        otherUserId,
        userId,
      ),
    ).rejects.toThrow(
      "Cannot access chat with this user",
    );

    expect(
      chatRepository.findDirectChat,
    ).not.toHaveBeenCalled();
  });


  it("should return existing chat", async () => {
    vi.mocked(chatRepository.findDirectChat)
      .mockResolvedValue(
        baseChat as any,
      );

    vi.mocked(UserGrpc.fetchUsers)
      .mockResolvedValue(profileUsers as any);

    const result =
      await service.accessChatFunction(
        otherUserId,
        userId,
      );

    expect(
      chatRepository.findDirectChat,
    ).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );

    expect(
      UserGrpc.fetchUsers,
    ).toHaveBeenCalledWith([
      userId,
      otherUserId,
    ]);

    expect(result.type).toBe("chat");

    expect(result.data).toEqual(
      expect.objectContaining({
        members: profileUsers,
      }),
    );

    expect(
      SocialGrpc.areFriends,
    ).not.toHaveBeenCalled();

    expect(
      chatRepository.createDirectChat,
    ).not.toHaveBeenCalled();
  });


  it("should return pending_chat for an existing pending chat", async () => {
    vi.mocked(chatRepository.findDirectChat)
      .mockResolvedValue({
        ...baseChat,
        requestPending: true,
      } as any);

    const result =
      await service.accessChatFunction(
        otherUserId,
        userId,
      );

    expect(result.type).toBe(
      "pending_chat",
    );
  });


  it("should create a pending chat when users are not friends", async () => {
    vi.mocked(chatRepository.findDirectChat)
      .mockResolvedValue(null);

    vi.mocked(SocialGrpc.areFriends)
      .mockResolvedValue({
        areFriends: false,
      });

    vi.mocked(
      chatRepository.createPendingDirectChat,
    ).mockResolvedValue(
      baseChat as any,
    );

    const result =
      await service.accessChatFunction(
        otherUserId,
        userId,
      );

    expect(
      SocialGrpc.areFriends,
    ).toHaveBeenCalledWith(
      userId,
      otherUserId,
    );

    expect(
      chatRepository.createPendingDirectChat,
    ).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );

    expect(result.type).toBe(
      "pending_chat",
    );

    expect(
      chatRepository.createDirectChat,
    ).not.toHaveBeenCalled();
  });


  it("should create a normal chat when users are friends", async () => {
    vi.mocked(chatRepository.findDirectChat)
      .mockResolvedValue(null);

    vi.mocked(SocialGrpc.areFriends)
      .mockResolvedValue({
        areFriends: true,
      });

    vi.mocked(
      chatRepository.createDirectChat,
    ).mockResolvedValue(
      baseChat as any,
    );

    const result =
      await service.accessChatFunction(
        otherUserId,
        userId,
      );

    expect(
      chatRepository.createDirectChat,
    ).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );

    expect(result.type).toBe(
      "chat",
    );

    expect(
      chatRepository.createPendingDirectChat,
    ).not.toHaveBeenCalled();
  });
});


// ==================================================
// togglePinChatFunction()
// ==================================================

describe("togglePinChatFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.togglePinChatFunction(
        "",
        chatId,
      ),
    ).rejects.toThrow();

    expect(
      chatRepository.findByIdForUser,
    ).not.toHaveBeenCalled();
  });


  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.togglePinChatFunction(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      chatUserStateRepository.findByUserAndChat,
    ).not.toHaveBeenCalled();
  });


  it("should toggle pin from false to true", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      chatUserStateRepository.findByUserAndChat,
    ).mockResolvedValue({
      isPinned: false,
    } as any);

    const result =
      await service.togglePinChatFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.updatePinChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      true,
    );

    expect(result).toEqual({
      isPinned: true,
    });
  });


  it("should toggle pin from true to false", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      chatUserStateRepository.findByUserAndChat,
    ).mockResolvedValue({
      isPinned: true,
    } as any);

    const result =
      await service.togglePinChatFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.updatePinChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      false,
    );

    expect(result).toEqual({
      isPinned: false,
    });
  });
});


// ==================================================
// toggleArchiveChatFunction()
// ==================================================

describe("toggleArchiveChatFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.toggleArchiveChatFunction(
        "",
        chatId,
      ),
    ).rejects.toThrow();
  });


  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.toggleArchiveChatFunction(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      chatUserStateRepository.findByUserAndChat,
    ).not.toHaveBeenCalled();
  });


  it("should toggle archive from false to true", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      chatUserStateRepository.findByUserAndChat,
    ).mockResolvedValue({
      isArchived: false,
    } as any);

    const result =
      await service.toggleArchiveChatFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.toggleArchiveChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      true,
    );

    expect(result).toEqual({
      isArchived: true,
    });
  });


  it("should toggle archive from true to false", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      chatUserStateRepository.findByUserAndChat,
    ).mockResolvedValue({
      isArchived: true,
    } as any);

    const result =
      await service.toggleArchiveChatFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.toggleArchiveChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      false,
    );

    expect(result).toEqual({
      isArchived: false,
    });
  });
});


// ==================================================
// markChatAsUnreadFunction()
// ==================================================

describe("markChatAsUnreadFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.markChatAsUnreadFunction(
        "",
        chatId,
      ),
    ).rejects.toThrow();
  });


  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.markChatAsUnreadFunction(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      MessagesAPI.latestIncomingMessageOfOtherUSer,
    ).not.toHaveBeenCalled();
  });


  it("should return zero when there is no incoming message", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      MessagesAPI.latestIncomingMessageOfOtherUSer,
    ).mockResolvedValue(null);

    const result =
      await service.markChatAsUnreadFunction(
        userId,
        chatId,
      );

    expect(result).toEqual({
      chatId,
      count: 0,
    });

    expect(
      chatUserStateRepository.updateLastReadAt,
    ).not.toHaveBeenCalled();
  });


  it("should mark chat as unread when an incoming message exists", async () => {
    const createdAt =
      new Date("2026-01-01T10:00:00.000Z");

    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      MessagesAPI.latestIncomingMessageOfOtherUSer,
    ).mockResolvedValue({
      createdAt,
    } as any);

    const result =
      await service.markChatAsUnreadFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.updateLastReadAt,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      new Date(createdAt.getTime() - 1),
    );

    expect(result).toEqual({
      chatId,
      count: 1,
    });
  });
});


// ==================================================
// markChatAsReadFunction()
// ==================================================

describe("markChatAsReadFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.markChatAsReadFunction(
        "",
        chatId,
      ),
    ).rejects.toThrow();
  });


  it("should reject when chatId is missing", async () => {
    await expect(
      service.markChatAsReadFunction(
        userId,
        "",
      ),
    ).rejects.toThrow(
      "ChatId is required",
    );
  });


  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.markChatAsReadFunction(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      MessagesAPI.latestMessage,
    ).not.toHaveBeenCalled();
  });


  it("should return zero when there is no latest message", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      MessagesAPI.latestMessage,
    ).mockResolvedValue(null);

    const result =
      await service.markChatAsReadFunction(
        userId,
        chatId,
      );

    expect(result).toEqual({
      unreadCount: 0,
    });

    expect(
      chatUserStateRepository.resetUnreadCount,
    ).not.toHaveBeenCalled();
  });


  it("should mark chat as read successfully", async () => {
    const createdAt =
      new Date("2026-01-01T10:00:00.000Z");

    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    vi.mocked(
      MessagesAPI.latestMessage,
    ).mockResolvedValue({
      createdAt,
    } as any);

    const result =
      await service.markChatAsReadFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.updateLastReadAt,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      createdAt,
    );

    expect(
      chatUserStateRepository.resetUnreadCount,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(result).toEqual({
      unreadCount: 0,
    });
  });
});


// ==================================================
// clearChatForUser()
// ==================================================

describe("clearChatForUser()", () => {
  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.clearChatForUser(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      chatUserStateRepository.clearChat,
    ).not.toHaveBeenCalled();
  });


  it("should clear chat successfully", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    const result =
      await service.clearChatForUser(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.clearChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      expect.any(Date),
    );

    expect(result).toBe(true);
  });
});


// ==================================================
// deleteChatForUser()
// ==================================================

describe("deleteChatForUser()", () => {
  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.deleteChatForUser(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      chatUserStateRepository.clearChat,
    ).not.toHaveBeenCalled();

    expect(
      chatRepository.removeMemberFromChat,
    ).not.toHaveBeenCalled();
  });


  it("should clear state and remove member successfully", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    const result =
      await service.deleteChatForUser(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.clearChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      expect.any(Date),
    );

    expect(
      chatRepository.removeMemberFromChat,
    ).toHaveBeenCalledWith(
      chatId,
      userId,
    );

    expect(result).toEqual({
      chatId,
    });
  });
});


// ==================================================
// muteChatFunction()
// ==================================================

describe("muteChatFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.muteChatFunction(
        "",
        chatId,
        "1h",
      ),
    ).rejects.toThrow();
  });


  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.muteChatFunction(
        userId,
        chatId,
        "1h",
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      chatUserStateRepository.setMutedUntil,
    ).not.toHaveBeenCalled();
  });


  it("should mute chat for a specified duration", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    const before = Date.now();

    const result =
      await service.muteChatFunction(
        userId,
        chatId,
        "1h",
      );

    const after = Date.now();

    expect(
      chatUserStateRepository.setMutedUntil,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      expect.any(Date),
    );

    const mutedUntil =
      vi.mocked(
        chatUserStateRepository.setMutedUntil,
      ).mock.calls[0][2] as Date;

    expect(
      mutedUntil.getTime(),
    ).toBeGreaterThanOrEqual(
      before + 60 * 60 * 1000,
    );

    expect(
      mutedUntil.getTime(),
    ).toBeLessThanOrEqual(
      after + 60 * 60 * 1000,
    );

    expect(result.chatId).toBe(chatId);

    expect(result.mutedUntil).toEqual(
      mutedUntil,
    );
  });


  it("should mute chat forever", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    const result =
      await service.muteChatFunction(
        userId,
        chatId,
        "forever",
      );

    const expectedDate =
      new Date(
        "9999-12-31T23:59:59.999Z",
      );

    expect(
      chatUserStateRepository.setMutedUntil,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
      expectedDate,
    );

    expect(result.chatId).toBe(chatId);

    expect(result.mutedUntil).toEqual(
      expectedDate,
    );
  });
});


// ==================================================
// unmuteChatFunction()
// ==================================================

describe("unmuteChatFunction()", () => {
  it("should reject when userId is missing", async () => {
    await expect(
      service.unmuteChatFunction(
        "",
        chatId,
      ),
    ).rejects.toThrow();
  });


  it("should reject when chat is not accessible", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(null);

    await expect(
      service.unmuteChatFunction(
        userId,
        chatId,
      ),
    ).rejects.toThrow("Not allowed");

    expect(
      chatUserStateRepository.unmuteChat,
    ).not.toHaveBeenCalled();
  });


  it("should unmute chat successfully", async () => {
    vi.mocked(
      chatRepository.findByIdForUser,
    ).mockResolvedValue(
      baseChat as any,
    );

    const result =
      await service.unmuteChatFunction(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.unmuteChat,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(result).toEqual({
      chatId,
      mutedUntil: null,
    });
  });
});


// ==================================================
// incrementUnreadCount()
// ==================================================

describe("incrementUnreadCount()", () => {
  it("should delegate to repository and return result", async () => {
    vi.mocked(
      chatUserStateRepository.incrementUnreadCount,
    ).mockResolvedValue(5);

    const result =
      await service.incrementUnreadCount(
        userId,
        chatId,
      );

    expect(
      chatUserStateRepository.incrementUnreadCount,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(result).toBe(5);
  });
});


// ==================================================
// resetUnreadCount()
// ==================================================

describe("resetUnreadCount()", () => {
  it("should delegate to repository", async () => {
    await service.resetUnreadCount(
      userId,
      chatId,
    );

    expect(
      chatUserStateRepository.resetUnreadCount,
    ).toHaveBeenCalledWith(
      userId,
      chatId,
    );
  });
});


// ==================================================
// getUnreadCounts()
// ==================================================

describe("getUnreadCounts()", () => {
  it("should transform repository states into a record", async () => {
    vi.mocked(
      chatUserStateRepository.findUnreadCountsByUser,
    ).mockResolvedValue([
      {
        chatId: makeObjectId("chat-1"),
        unreadCount: 4,
      },
      {
        chatId: makeObjectId("chat-2"),
        unreadCount: 7,
      },
    ] as any);

    const result =
      await service.getUnreadCounts(
        userId,
      );

    expect(
      chatUserStateRepository.findUnreadCountsByUser,
    ).toHaveBeenCalledWith(userId);

    expect(result).toEqual({
      "chat-1": 4,
      "chat-2": 7,
    });
  });
});

