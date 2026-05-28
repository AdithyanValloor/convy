/**
 * Message request socket emitters.
 * Notifies the sender and receiver based on request lifecycle events.
 */

import { IChat } from "../../services/chat/models/chat.model.js";
import { IMessageRequest } from "../../services/messages/models/messageRequest.model.js";
import { getIO } from "../io.js";

export const emitMessageRequestSent = (
  fromUserId: string,
  toUserId: string,
  request: IMessageRequest
) => {
  const io = getIO();

  // Receiver gets the incoming request.
  io.to(toUserId).emit("message_request_received", request);

  // Sender gets the outgoing request state.
  io.to(fromUserId).emit("message_request_sent", request);
};

export const emitMessageRequestAccepted = (
  fromUserId: string,
  toUserId: string,
  payload: {
    requestId: string
    chat: IChat
  }
) => {
  const io = getIO();

  // Both sides clear the request and open the created chat.
  io.to(fromUserId).emit("message_request_accepted", payload);
  io.to(toUserId).emit("message_request_accepted", payload);
};

export const emitMessageRequestRejected = (
  fromUserId: string,
  requestId: string,
  chatId: string
) => {
  const io = getIO();

  // Only the sender needs to remove the rejected outgoing request.
  io.to(fromUserId).emit("message_request_rejected", {
    requestId,
    chatId
  });
};
