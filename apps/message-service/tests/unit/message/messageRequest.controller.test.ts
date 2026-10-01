import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getMessageRequestsController,
  acceptMessageRequestController,
  rejectMessageRequestController,
} from "../../../src/modules/messages/controllers/messageRequest.controller.js";

import { messageRequestService } from "../../../src/modules/messages/composition/container.js";

import {
  publishMessagerequestAccepted,
  publishMessagerequestRejected,
} from "../../../src/rabbitmq/publisher/message.publisher.js";

import { createEvent } from "../../../src/rabbitmq/helpers/event.helper.js";

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock("../../../src/modules/messages/composition/container.js", () => ({
  messageRequestService: {
    getMessageRequests: vi.fn(),
    acceptMessageRequest: vi.fn(),
    rejectMessageRequest: vi.fn(),
  },
}));

vi.mock("../../../src/rabbitmq/publisher/message.publisher.js", () => ({
  publishMessagerequestAccepted: vi.fn(),
  publishMessagerequestRejected: vi.fn(),
}));

vi.mock("../../../src/rabbitmq/helpers/event.helper.js", () => ({
  createEvent: vi.fn((type, payload) => ({
    type,
    payload,
  })),
}));

// ============================================================================
// Test Data
// ============================================================================

const userId = "user-1";
const otherUserId = "user-2";
const chatId = "chat-1";
const requestId = "request-1";

const makeObjectId = (id: string) => {
  const oid: any = {
    toString: () => id,
  };

  oid._id = oid;

  return oid;
};

const makeUser = (id: string) => ({
  _id: makeObjectId(id),
  id,
  username: id,
  displayName: id,
});

const makeChat = () => ({
  _id: makeObjectId(chatId),
  members: [makeUser(userId), makeUser(otherUserId)],
});

const makeRequest = () => ({
  _id: makeObjectId(requestId),
  from: makeObjectId(otherUserId),
  to: makeObjectId(userId),
  firstMessage: "hello",
});

const createRequest = (
  options: {
    params?: any;
    user?: any;
  } = {},
) =>
  ({
    params: options.params ?? {},
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

  vi.mocked(createEvent).mockImplementation((type, payload) => ({
    type,
    payload,
  }) as any);
});

// ============================================================================
// getMessageRequestsController()
// ============================================================================

describe("getMessageRequestsController()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getMessageRequestsController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(messageRequestService.getMessageRequests).not.toHaveBeenCalled();
  });

  it("should return message requests successfully", async () => {
    const requests = {
      incoming: [
        {
          _id: requestId,
          from: makeUser(otherUserId),
          to: makeUser(userId),
        },
      ],
    };

    vi.mocked(messageRequestService.getMessageRequests).mockResolvedValue(
      requests as any,
    );

    const req = createRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await getMessageRequestsController(req, res, next);

    expect(messageRequestService.getMessageRequests).toHaveBeenCalledWith(
      userId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...requests,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should forward service errors to next", async () => {
    const error = new Error("failed to fetch requests");

    vi.mocked(messageRequestService.getMessageRequests).mockRejectedValue(
      error,
    );

    const req = createRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await getMessageRequestsController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ============================================================================
// acceptMessageRequestController()
// ============================================================================

describe("acceptMessageRequestController()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { requestId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await acceptMessageRequestController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(messageRequestService.acceptMessageRequest).not.toHaveBeenCalled();
  });

  it("should reject when requestId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await acceptMessageRequestController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(messageRequestService.acceptMessageRequest).not.toHaveBeenCalled();
  });

  it("should accept the request, publish the event, and return the chat", async () => {
    const chat = makeChat();

    const result = {
      chat,
    };

    vi.mocked(messageRequestService.acceptMessageRequest).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { requestId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await acceptMessageRequestController(req, res, next);

    expect(messageRequestService.acceptMessageRequest).toHaveBeenCalledWith(
      requestId,
      userId,
    );

    expect(createEvent).toHaveBeenCalledWith(
      "message-request.accepted",
      expect.objectContaining({
        userA: userId,
        userB: otherUserId,
        requestPayload: {
          requestId,
          chat,
        },
      }),
    );

    expect(publishMessagerequestAccepted).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...result,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should forward service errors to next", async () => {
    const error = new Error("accept failed");

    vi.mocked(messageRequestService.acceptMessageRequest).mockRejectedValue(
      error,
    );

    const req = createRequest({
      params: { requestId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await acceptMessageRequestController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(publishMessagerequestAccepted).not.toHaveBeenCalled();
  });
});

// ============================================================================
// rejectMessageRequestController()
// ============================================================================

describe("rejectMessageRequestController()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      user: undefined,
      params: { requestId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await rejectMessageRequestController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(messageRequestService.rejectMessageRequest).not.toHaveBeenCalled();
  });

  it("should reject when requestId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await rejectMessageRequestController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(messageRequestService.rejectMessageRequest).not.toHaveBeenCalled();
  });

  it("should reject the request, publish the event, and return the result", async () => {
    const result = {
      request: makeRequest(),
      chatId,
    };

    vi.mocked(messageRequestService.rejectMessageRequest).mockResolvedValue(
      result as any,
    );

    const req = createRequest({
      params: { requestId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await rejectMessageRequestController(req, res, next);

    expect(messageRequestService.rejectMessageRequest).toHaveBeenCalledWith(
      requestId,
      userId,
    );

    expect(createEvent).toHaveBeenCalledWith(
      "message-request.rejected",
      expect.objectContaining({
        fromUserId: otherUserId,
        chatId,
        requestId,
      }),
    );

    expect(publishMessagerequestRejected).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      request: result,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should forward service errors to next", async () => {
    const error = new Error("reject failed");

    vi.mocked(messageRequestService.rejectMessageRequest).mockRejectedValue(
      error,
    );

    const req = createRequest({
      params: { requestId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await rejectMessageRequestController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(publishMessagerequestRejected).not.toHaveBeenCalled();
  });
});