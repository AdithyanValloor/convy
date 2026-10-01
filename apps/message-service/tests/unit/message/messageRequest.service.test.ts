import { describe, it, expect, beforeEach, vi } from "vitest";

import { IMessageRepository } from "../../../src/modules/messages/repositories/message.repository.js";
import { IMessageRequestRepository } from "../../../src/modules/messages/repositories/messageRequest.repository.js";
import { MessageRequestService } from "../../../src/modules/messages/services/messageRequest.service.js";
import * as ChatAPI from "../../../src/modules/chat/api/chat.api.js";
import {
  fetchUsers,
  findUserById,
} from "../../../src/grpc/user/user.grpc.client.js";
import {
  areFriends,
  blockExists,
} from "../../../src/grpc/social/social.grpc.client.js";
import { latestMessage } from "../../../src/modules/messages/api/messages.api.js";

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock("../../../src/modules/chat/api/chat.api.js", () => ({
  findPendingDirectChat: vi.fn(),
  acceptPendingDirectChat: vi.fn(),
  deletePendingDirectChat: vi.fn(),
}));

vi.mock("../../../src/grpc/user/user.grpc.client.js", () => ({
  fetchUsers: vi.fn(),
  findUserById: vi.fn(),
}));

vi.mock("../../../src/grpc/social/social.grpc.client.js", () => ({
  areFriends: vi.fn(),
  blockExists: vi.fn(),
}));

vi.mock("../../../src/modules/messages/api/messages.api.js", () => ({
  latestMessage: vi.fn(),
}));

// ============================================================================
// Repository Mocks
// ============================================================================

const messageRequestRepository = {
  findPendingRequestsForUser: vi.fn(),
  dailyCount: vi.fn(),
  findPendingRequest: vi.fn(),
  createRequest: vi.fn(),
  findById: vi.fn(),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
} as unknown as IMessageRequestRepository;

const messageRepository = {
  deleteMessageByChatId: vi.fn(),
} as unknown as IMessageRepository;

// ============================================================================
// Service Setup
// ============================================================================

const service = new MessageRequestService(
  messageRequestRepository as any,
  messageRepository as any,
);

// ============================================================================
// Test Data
// ============================================================================

const userId = "user-1";
const otherUserId = "user-2";
const thirdUserId = "user-3";
const requestId = "request-1";
const chatId = "chat-1";

const makeObjectId = (id: string) => {
  const oid: any = { toString: () => id };
  oid._id = oid;
  return oid;
};

const profileUsers = [
  { id: userId, username: "user1", displayName: "User One" },
  { id: otherUserId, username: "user2", displayName: "User Two" },
  { id: thirdUserId, username: "user3", displayName: "User Three" },
];

const makeRequest = (overrides: Record<string, any> = {}) =>
  ({
    _id: makeObjectId(requestId),
    from: makeObjectId(otherUserId),
    to: makeObjectId(userId),
    firstMessage: "hello",
    status: "pending",
    createdAt: new Date("2026-01-10T10:00:00.000Z"),
    ...overrides,
  }) as any;

const makeChat = (overrides: Record<string, any> = {}) =>
  ({
    _id: makeObjectId(chatId),
    members: [makeObjectId(otherUserId), makeObjectId(userId)],
    isGroup: false,
    requestPending: true,
    requestInitiator: makeObjectId(otherUserId),
    ...overrides,
  }) as any;

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(
    messageRequestRepository.findPendingRequestsForUser,
  ).mockResolvedValue([]);
  vi.mocked(messageRequestRepository.dailyCount).mockResolvedValue(0);
  vi.mocked(messageRequestRepository.findPendingRequest).mockResolvedValue(
    null,
  );
  vi.mocked(messageRequestRepository.createRequest).mockResolvedValue(
    makeRequest(),
  );
  vi.mocked(messageRequestRepository.findById).mockResolvedValue(null);
  vi.mocked(messageRequestRepository.acceptRequest).mockResolvedValue(
    undefined,
  );
  vi.mocked(messageRequestRepository.rejectRequest).mockResolvedValue(
    undefined,
  );

  vi.mocked(messageRepository.deleteMessageByChatId).mockResolvedValue(
    undefined,
  );

  vi.mocked(fetchUsers).mockResolvedValue(profileUsers as any);

  vi.mocked(findUserById).mockResolvedValue({
    id: otherUserId,
    username: "user2",
    displayName: "User Two",
  } as any);

  vi.mocked(blockExists).mockResolvedValue(false as any);
  vi.mocked(areFriends).mockResolvedValue({ areFriends: false } as any);

  vi.mocked(ChatAPI.findPendingDirectChat).mockResolvedValue(makeChat());
  vi.mocked(ChatAPI.acceptPendingDirectChat).mockResolvedValue(
    makeChat({ requestPending: false }),
  );
  vi.mocked(ChatAPI.deletePendingDirectChat).mockResolvedValue(makeChat());

  vi.mocked(latestMessage).mockResolvedValue(null as any);
});

// ============================================================================
// getMessageRequests()
// ============================================================================

describe("getMessageRequests()", () => {
  it("should return an empty incoming list when there are no pending requests", async () => {
    const result = await service.getMessageRequests(userId);

    expect(
      messageRequestRepository.findPendingRequestsForUser,
    ).toHaveBeenCalledWith(userId);
    expect(result).toEqual({ incoming: [] });
    expect(fetchUsers).toHaveBeenCalledWith([]);
  });

  it("should populate request users and return incoming requests", async () => {
    const request = makeRequest();

    vi.mocked(
      messageRequestRepository.findPendingRequestsForUser,
    ).mockResolvedValue([request]);

    const result = await service.getMessageRequests(userId);

    expect(fetchUsers).toHaveBeenCalledWith(
      expect.arrayContaining([otherUserId, userId]),
    );

    expect(result.incoming).toHaveLength(1);
    expect(result.incoming[0]).toEqual(
      expect.objectContaining({
        _id: request._id,
        firstMessage: "hello",
        from: profileUsers[1],
        to: profileUsers[0],
      }),
    );
  });
});

// ============================================================================
// sendMessageRequest()
// ============================================================================

describe("sendMessageRequest()", () => {
  it("should reject when the first message is missing", async () => {
    await expect(
      service.sendMessageRequest(userId, otherUserId, ""),
    ).rejects.toThrow("Message required");

    expect(findUserById).not.toHaveBeenCalled();
  });

  it("should reject when messaging yourself", async () => {
    vi.mocked(findUserById).mockResolvedValue({
      id: userId,
    } as any);

    await expect(
      service.sendMessageRequest(userId, userId, "hello"),
    ).rejects.toThrow("Cannot message yourself");

    expect(blockExists).not.toHaveBeenCalled();
  });

  it("should reject when the target user has blocked the sender", async () => {
    vi.mocked(blockExists).mockResolvedValue(true as any);

    await expect(
      service.sendMessageRequest(userId, otherUserId, "hello"),
    ).rejects.toThrow("Cannot message this user");

    expect(blockExists).toHaveBeenCalledWith(otherUserId, userId);
    expect(areFriends).not.toHaveBeenCalled();
  });

  it("should reject when the users are already friends", async () => {
    vi.mocked(areFriends).mockResolvedValue({ areFriends: true } as any);

    await expect(
      service.sendMessageRequest(userId, otherUserId, "hello"),
    ).rejects.toThrow("Users are already friends");

    expect(areFriends).toHaveBeenCalledWith(userId, otherUserId);
    expect(messageRequestRepository.dailyCount).not.toHaveBeenCalled();
  });

  it("should reject when the sender has reached the daily request limit", async () => {
    vi.mocked(messageRequestRepository.dailyCount).mockResolvedValue(20);

    await expect(
      service.sendMessageRequest(userId, otherUserId, "hello"),
    ).rejects.toThrow("Too many message requests today");

    expect(messageRequestRepository.dailyCount).toHaveBeenCalledWith(userId);
    expect(messageRequestRepository.findPendingRequest).not.toHaveBeenCalled();
  });

  it("should reject when a pending request already exists", async () => {
    vi.mocked(messageRequestRepository.findPendingRequest).mockResolvedValue(
      makeRequest(),
    );

    await expect(
      service.sendMessageRequest(userId, otherUserId, "hello"),
    ).rejects.toThrow("Message request already pending");

    expect(messageRequestRepository.findPendingRequest).toHaveBeenCalledWith(
      userId,
      otherUserId,
    );
    expect(messageRequestRepository.createRequest).not.toHaveBeenCalled();
  });

  it("should create and return a populated message request successfully", async () => {
    const request = makeRequest();

    vi.mocked(messageRequestRepository.createRequest).mockResolvedValue(
      request,
    );

    const result = await service.sendMessageRequest(
      userId,
      otherUserId,
      "hello",
    );

    expect(messageRequestRepository.createRequest).toHaveBeenCalledWith({
      from: userId,
      to: otherUserId,
      firstMessage: "hello",
    });

    expect(fetchUsers).toHaveBeenCalledWith(
      expect.arrayContaining([userId, otherUserId]),
    );

    expect(result).toEqual(
      expect.objectContaining({
        from: profileUsers[1],
        to: profileUsers[0],
        firstMessage: "hello",
      }),
    );
  });
});

// ============================================================================
// acceptMessageRequest()
// ============================================================================

describe("acceptMessageRequest()", () => {
  it("should reject when the request does not exist", async () => {
    await expect(
      service.acceptMessageRequest(requestId, userId),
    ).rejects.toThrow("Request not found");

    expect(ChatAPI.findPendingDirectChat).not.toHaveBeenCalled();
  });

  it("should reject when the user is not the request recipient", async () => {
    vi.mocked(messageRequestRepository.findById).mockResolvedValue(
      makeRequest({ to: makeObjectId(thirdUserId) }),
    );

    await expect(
      service.acceptMessageRequest(requestId, userId),
    ).rejects.toThrow("Not authorized");

    expect(ChatAPI.findPendingDirectChat).not.toHaveBeenCalled();
  });

  it("should reject when the pending chat does not exist", async () => {
    vi.mocked(messageRequestRepository.findById).mockResolvedValue(
      makeRequest(),
    );
    vi.mocked(ChatAPI.findPendingDirectChat).mockResolvedValue(null);

    await expect(
      service.acceptMessageRequest(requestId, userId),
    ).rejects.toThrow("Chat not found");

    expect(ChatAPI.findPendingDirectChat).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );
    expect(ChatAPI.acceptPendingDirectChat).not.toHaveBeenCalled();
  });

  it("should reject when accepting the pending chat returns no new chat", async () => {
    vi.mocked(messageRequestRepository.findById).mockResolvedValue(
      makeRequest(),
    );
    vi.mocked(ChatAPI.acceptPendingDirectChat).mockResolvedValue(null);

    await expect(
      service.acceptMessageRequest(requestId, userId),
    ).rejects.toThrow("New chat not found");

    expect(ChatAPI.acceptPendingDirectChat).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );
    expect(messageRequestRepository.acceptRequest).not.toHaveBeenCalled();
  });

  it("should accept the request, populate the chat, and return its latest message", async () => {
    const request = makeRequest();

    const newChat = makeChat({
      requestPending: false,
    });

    const lastMessage = {
      _id: makeObjectId("message-1"),
      content: "hello",
    };

    vi.mocked(messageRequestRepository.findById).mockResolvedValue(request);

    vi.mocked(ChatAPI.findPendingDirectChat).mockResolvedValue(makeChat());

    vi.mocked(ChatAPI.acceptPendingDirectChat).mockResolvedValue(newChat);

    vi.mocked(fetchUsers).mockResolvedValue(
      profileUsers.filter(
        (user) => user.id === otherUserId || user.id === userId,
      ) as any,
    );

    vi.mocked(latestMessage).mockResolvedValue(lastMessage as any);

    const result = await service.acceptMessageRequest(requestId, userId);

    expect(ChatAPI.findPendingDirectChat).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );

    expect(ChatAPI.acceptPendingDirectChat).toHaveBeenCalledWith(
      otherUserId,
      userId,
    );

    expect(messageRequestRepository.acceptRequest).toHaveBeenCalledWith(
      requestId,
    );

    expect(fetchUsers).toHaveBeenCalledWith([otherUserId, userId]);

    expect(latestMessage).toHaveBeenCalledWith(chatId);

    expect(result.chat).toEqual(
      expect.objectContaining({
        _id: newChat._id,
        members: profileUsers.filter(
          (user) => user.id === otherUserId || user.id === userId,
        ),
        lastMessage,
      }),
    );
  });
});

// ============================================================================
// rejectMessageRequest()
// ============================================================================

describe("rejectMessageRequest()", () => {
  it("should reject when the request does not exist", async () => {
    await expect(
      service.rejectMessageRequest(requestId, userId),
    ).rejects.toThrow("Request not found");

    expect(ChatAPI.deletePendingDirectChat).not.toHaveBeenCalled();
  });

  it("should reject when the user is not the request recipient", async () => {
    vi.mocked(messageRequestRepository.findById).mockResolvedValue(
      makeRequest({ to: makeObjectId(thirdUserId) }),
    );

    await expect(
      service.rejectMessageRequest(requestId, userId),
    ).rejects.toThrow("Not authorized");

    expect(ChatAPI.deletePendingDirectChat).not.toHaveBeenCalled();
  });

  it("should reject when the pending chat does not exist", async () => {
    vi.mocked(messageRequestRepository.findById).mockResolvedValue(
      makeRequest(),
    );
    vi.mocked(ChatAPI.deletePendingDirectChat).mockResolvedValue(null);

    await expect(
      service.rejectMessageRequest(requestId, userId),
    ).rejects.toThrow("Chat not found");

    expect(messageRepository.deleteMessageByChatId).not.toHaveBeenCalled();
    expect(messageRequestRepository.rejectRequest).not.toHaveBeenCalled();
  });

  it("should delete the temporary chat history and reject the request successfully", async () => {
    const request = makeRequest();
    const chat = makeChat();

    vi.mocked(messageRequestRepository.findById).mockResolvedValue(request);
    vi.mocked(ChatAPI.deletePendingDirectChat).mockResolvedValue(chat);

    const result = await service.rejectMessageRequest(requestId, userId);

    expect(ChatAPI.deletePendingDirectChat).toHaveBeenCalledWith(
      otherUserId,
      userId,
      otherUserId,
    );

    expect(messageRepository.deleteMessageByChatId).toHaveBeenCalledWith(
      chatId,
    );

    expect(messageRequestRepository.rejectRequest).toHaveBeenCalledWith(
      requestId,
    );

    expect(result).toEqual({
      request,
      chatId,
    });
  });
});
