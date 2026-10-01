import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCachedUnreadCountOfUser,
  setCachedUnreadCountOfUser,
  incrementUnreadCount,
  markRead,
  getUnreadCountOfChat,
} from "../../src/modules/messages/cache/messages.cache.js";

import { redis } from "../../src/config/redis.js";

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock("../../src/config/redis.js", () => ({
  redis: {
    hGetAll: vi.fn(),
    hSet: vi.fn(),
    hIncrBy: vi.fn(),
    hDel: vi.fn(),
    hGet: vi.fn(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const userId = "user-1";
const chatId = "chat-1";

const unreadData = {
  "chat-1": 3,
  "chat-2": 7,
};

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================================
// getCachedUnreadCountOfUser()
// ============================================================================

describe("getCachedUnreadCountOfUser()", () => {
  it("should return null when the unread hash is empty", async () => {
    vi.mocked(redis.hGetAll).mockResolvedValue({});

    const result = await getCachedUnreadCountOfUser(userId);

    expect(redis.hGetAll).toHaveBeenCalledWith(`unread:${userId}`);
    expect(result).toBeNull();
  });

  it("should return unread counts as numbers", async () => {
    vi.mocked(redis.hGetAll).mockResolvedValue({
      "chat-1": "3",
      "chat-2": "7",
    });

    const result = await getCachedUnreadCountOfUser(userId);

    expect(redis.hGetAll).toHaveBeenCalledWith(`unread:${userId}`);

    expect(result).toEqual({
      "chat-1": 3,
      "chat-2": 7,
    });
  });
});

// ============================================================================
// setCachedUnreadCountOfUser()
// ============================================================================

describe("setCachedUnreadCountOfUser()", () => {
  it("should store unread counts in the user's Redis hash", async () => {
    vi.mocked(redis.hSet).mockResolvedValue(2);

    const result = await setCachedUnreadCountOfUser(
      userId,
      unreadData,
    );

    expect(redis.hSet).toHaveBeenCalledWith(
      `unread:${userId}`,
      unreadData,
    );

    expect(result).toBe(2);
  });
});

// ============================================================================
// incrementUnreadCount()
// ============================================================================

describe("incrementUnreadCount()", () => {
  it("should increment the unread count for a chat", async () => {
    vi.mocked(redis.hIncrBy).mockResolvedValue(4);

    const result = await incrementUnreadCount(userId, chatId);

    expect(redis.hIncrBy).toHaveBeenCalledWith(
      `unread:${userId}`,
      chatId,
      1,
    );

    expect(result).toBe(4);
  });
});

// ============================================================================
// markRead()
// ============================================================================

describe("markRead()", () => {
  it("should delete the unread count for the chat", async () => {
    vi.mocked(redis.hDel).mockResolvedValue(1);

    const result = await markRead(userId, chatId);

    expect(redis.hDel).toHaveBeenCalledWith(
      `unread:${userId}`,
      chatId,
    );

    expect(result).toBe(1);
  });
});

// ============================================================================
// getUnreadCountOfChat()
// ============================================================================

describe("getUnreadCountOfChat()", () => {
  it("should return the stored unread count as a number", async () => {
    vi.mocked(redis.hGet).mockResolvedValue("5");

    const result = await getUnreadCountOfChat(
      userId,
      chatId,
    );

    expect(redis.hGet).toHaveBeenCalledWith(
      `unread:${userId}`,
      chatId,
    );

    expect(result).toBe(5);
  });

  it("should return zero when no unread count exists", async () => {
    vi.mocked(redis.hGet).mockResolvedValue(null);

    const result = await getUnreadCountOfChat(
      userId,
      chatId,
    );

    expect(redis.hGet).toHaveBeenCalledWith(
      `unread:${userId}`,
      chatId,
    );

    expect(result).toBe(0);
  });
});
