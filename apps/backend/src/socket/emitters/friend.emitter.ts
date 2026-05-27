/**
 * Friend-related socket emitters.
 * Uses userId-based rooms for targeted updates.
 */

import { getIO } from "../io.js";
import type { FriendRequestSocketPayload } from "../../services/user/types/friend.socket.js";

export const emitFriendRequestReceived = (
  userId: string,
  payload: FriendRequestSocketPayload
): void => {
  getIO().to(userId).emit("friend_request_received", payload);
};

export const emitFriendRequestSent = (
  userId: string,
  payload: FriendRequestSocketPayload
): void => {
  getIO().to(userId).emit("friend_request_sent", payload);
};

export const emitFriendRequestAccepted = (
  userId: string,
  payload: FriendRequestSocketPayload
): void => {
  const io = getIO();

  // Temporary room-level logging while verifying accepted-request delivery.
  const room = io.sockets.adapter.rooms.get(userId);
  console.log("Emitting friend_request_accepted to:", userId);
  console.log("Room members:", room ? Array.from(room) : "Room not found!");

  io.to(userId).emit("friend_request_accepted", payload);
};

export const emitFriendRequestRejected = (
  userId: string,
  requestId: string
): void => {
  // Notifies the sender to clear the rejected outgoing request.
  getIO().to(userId).emit("friend_request_rejected", requestId);
};

export const emitFriendRequestCancelled = (
  userId: string,
  requestId: string
): void => {
  // Notifies the receiver to remove the cancelled incoming request.
  getIO().to(userId).emit("friend_request_cancelled", requestId);
};

export const emitFriendRemoved = (
  userId: string,
  friendId: string
): void => {
  // Sends the removed friend id so clients can update local relationship state.
  getIO().to(userId).emit("friend_removed", { friendId });
};
