import { Request, Response, NextFunction } from "express";
import { Unauthorized } from "../../../errors/httpErrors.js";

import { MessageReqParams } from "../types/message.types.js";
import { messageRequestService } from "../composition/container.js";
import {
  publishMessagerequestAccepted,
  publishMessagerequestRejected,
} from "../../../rabbitmq/publisher/message.publisher.js";
import { createEvent } from "../../../rabbitmq/helpers/event.helper.js";

/** Message request controller handlers for authenticated request actions. */

export const getMessageRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const requests = await messageRequestService.getMessageRequests(userId);

    res.status(200).json({
      success: true,
      ...requests,
    });
  } catch (err) {
    next(err);
  }
};

/** Accepts a pending message request and emits the resulting chat to both users. */
export const acceptMessageRequestController = async (
  req: Request<MessageReqParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { requestId } = req.params;
    if (!requestId) throw Unauthorized();

    const result = await messageRequestService.acceptMessageRequest(
      requestId,
      userId,
    );

    const [userA, userB] = result.chat?.members as any[];

    await publishMessagerequestAccepted(
      createEvent("message-request.accepted", {
        userA: userA._id.toString(),
        userB: userB._id.toString(),
        requestPayload: {
          requestId,
          chat: result.chat as any,
        },
      }),
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/** Rejects a pending message request and notifies the original sender. */
export const rejectMessageRequestController = async (
  req: Request<MessageReqParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { requestId } = req.params;
    if (!requestId) throw Unauthorized();

    const result = await messageRequestService.rejectMessageRequest(
      requestId,
      userId,
    );

    await publishMessagerequestRejected(
      createEvent("message-request.rejected", {
        fromUserId: result.request.from.toString(),
        chatId: result.chatId,
        requestId,
      }),
    );

    res.status(200).json({
      success: true,
      request: result,
    });
  } catch (err) {
    next(err);
  }
};
