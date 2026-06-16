import { Message } from "../models/message.model.js";
import {
  BadRequest,
  NotFound,
  Forbidden,
} from "../../../utils/errors/httpErrors.js";
import { MessageRequestModel } from "../models/messageRequest.model.js";

import * as UserAPI from "../../user/api/user.api.js";
import * as SocialAPI from "../../social/api/social.api.js";
import * as ChatAPI from "../../chat/api/chat.api.js";

/** Message request helpers for inbox retrieval and request review actions. */

/** Returns pending incoming message requests for the recipient. */
export const getMessageRequests = async (userId: string) => {
  const incoming = await MessageRequestModel.find({
    status: "pending",
    to: userId,
  }).populate("from to", "username displayName profilePicture");

  return { incoming };
};

/** Creates a new message request for a non-friend when messaging is allowed. */
export const sendMessageRequest = async (
  fromUserId: string,
  toUserId: string,
  firstMessage: string,
) => {
  if (!firstMessage) throw BadRequest("Message required");

  const toUser = await UserAPI.findUserById(toUserId);

  if (toUser.id.toString() === fromUserId)
    throw BadRequest("Cannot message yourself");

  const allowed = await SocialAPI.blockExists(toUserId, fromUserId);

  if (!allowed) throw Forbidden("Cannot message this user");

  const friends = await SocialAPI.areFriends(fromUserId, toUser.id.toString());

  if (friends) throw BadRequest("Users are already friends");

  // Rate-limit new requests per sender on a calendar-day basis.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyCount = await MessageRequestModel.countDocuments({
    from: fromUserId,
    createdAt: { $gte: startOfDay },
  });

  if (dailyCount >= 20) {
    throw Forbidden("Too many message requests today");
  }

  const existing = await MessageRequestModel.findOne({
    from: fromUserId,
    to: toUser.id,
    status: "pending",
  });
  if (existing) throw BadRequest("Message request already pending");

  const request = await MessageRequestModel.create({
    from: fromUserId,
    to: toUser.id,
    firstMessage,
  });

  const populated = await request.populate([
    { path: "from", select: "username displayName profilePicture" },
    { path: "to", select: "username displayName profilePicture" },
  ]);

  return populated;
};

/** Accepts a pending request and converts its placeholder chat into a normal direct chat. */
export const acceptMessageRequest = async (
  requestId: string,
  userId: string,
) => {
  const request = await MessageRequestModel.findById(requestId);

  if (!request) throw NotFound("Request not found");

  if (request.to.toString() !== userId) throw Forbidden("Not authorized");

  const chat = await ChatAPI.findPendingDirectChat(
    request.from.toString(),
    request.to.toString(),
  );

  if (!chat) throw NotFound("Chat not found");

  const newChat = await ChatAPI.acceptPendingDirectChat(
    request.from.toString(),
    request.to.toString(),
  );

  request.status = "accepted";
  await request.save();

  return { chat: newChat };
};

/** Rejects a pending request and removes its temporary chat history. */
export const rejectMessageRequest = async (
  requestId: string,
  userId: string,
) => {
  const request = await MessageRequestModel.findById(requestId);

  if (!request) throw NotFound("Request not found");

  if (request.to.toString() !== userId) throw Forbidden("Not authorized");

  const chat = await ChatAPI.deletePendingDirectChat(
    request.from.toString(),
    request.to.toString(),
    request.from.toString(),
  );

  if (!chat) throw NotFound("Chat not found");

  await Message.deleteMany({ chat: chat._id });

  request.status = "rejected";
  await request.save();

  return { request, chatId: chat._id.toString() };
};
