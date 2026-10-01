import { beforeEach, describe, expect, it, vi } from "vitest";

import { messageRateLimiter } from "../../src/modules/messages/middleware/rateLimiter.js";
import { redis } from "../../src/config/redis.js";

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock("../../src/config/redis.js", () => ({
  redis: {
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const userId = "user-1";
const chatId = "chat-1";

const createRequest = (
  options: {
    body?: any;
    user?: any;
  } = {},
) =>
  ({
    body: options.body ?? {},
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

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(redis.incr).mockResolvedValue(1);
  vi.mocked(redis.expire).mockResolvedValue(1);
});

// ============================================================================
// messageRateLimiter()
// ============================================================================

describe("messageRateLimiter()", () => {
  it("should reject when userId is missing", async () => {
    const req = createRequest({
      user: undefined,
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await messageRateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid request",
    });

    expect(redis.incr).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await messageRateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid request",
    });

    expect(redis.incr).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should increment the user-chat key, set expiry on the first hit, and continue", async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await messageRateLimiter(req, res, next);

    expect(redis.incr).toHaveBeenCalledWith(
      `rate:${userId}:${chatId}`,
    );

    expect(redis.expire).toHaveBeenCalledWith(
      `rate:${userId}:${chatId}`,
      10,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should continue without resetting expiry when the count is greater than 1 but within the limit", async () => {
    vi.mocked(redis.incr).mockResolvedValue(10);

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await messageRateLimiter(req, res, next);

    expect(redis.incr).toHaveBeenCalledWith(
      `rate:${userId}:${chatId}`,
    );

    expect(redis.expire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject when the message count exceeds 20", async () => {
    vi.mocked(redis.incr).mockResolvedValue(21);

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await messageRateLimiter(req, res, next);

    expect(redis.incr).toHaveBeenCalledWith(
      `rate:${userId}:${chatId}`,
    );

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: "Too many messages. Please slow down.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should allow exactly 20 messages", async () => {
    vi.mocked(redis.incr).mockResolvedValue(20);

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await messageRateLimiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
