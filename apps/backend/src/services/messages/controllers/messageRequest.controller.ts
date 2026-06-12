import { Request, Response, NextFunction } from "express";
import * as service from "../services/messageRequest.service.js";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  emitMessageRequestAccepted,
  emitMessageRequestRejected,
} from "../../../socket/emitters/messageRequest.emitters.js";
import { MessageReqParams } from "../types/message.types.js";

/** Message request controller handlers for authenticated request actions. */

export const getMessageRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const requests = await service.getMessageRequests(userId);

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
    if(!requestId) throw Unauthorized();

    const result = await service.acceptMessageRequest(requestId, userId);
    
    const [userA, userB] = result.chat?.members as any[];

    emitMessageRequestAccepted(userA._id.toString(), userB._id.toString(), {
      requestId,
      chat: result.chat as any,
    });

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
    if(!requestId) throw Unauthorized();

    const result = await service.rejectMessageRequest(requestId, userId);

    emitMessageRequestRejected(
      result.request.from.toString(),
      requestId,
      result.chatId,
    );

    res.status(200).json({
      success: true,
      request: result,
    });
  } catch (err) {
    next(err);
  }
};
