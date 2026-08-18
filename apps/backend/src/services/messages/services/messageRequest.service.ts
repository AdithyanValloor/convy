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
import { IMessageRequestRepository } from "../repositories/messageRequest.repository.js";
import { IMessageRepository } from "../repositories/message.repository.js";

/** Message request helpers for inbox retrieval and request review actions. */

export class MessageRequestService {
  constructor(
    private readonly messageRequestRepository: IMessageRequestRepository,
    private readonly messageRepository: IMessageRepository,
  ) {}

  /** Returns pending incoming message requests for the recipient. */
  async getMessageRequests(userId: string) {
    const requests =
      await this.messageRequestRepository.findPendingRequestsForUser(userId);

    const userIds = new Set<string>();

    for (const request of requests) {
      userIds.add(request.from.toString());
      userIds.add(request.to.toString());
    }

    const users = await UserAPI.fetchUsers([...userIds]);

    const userMap = new Map(users.map((user) => [user.id, user]));

    const incoming = requests.map((request) => ({
      ...request,
      from: userMap.get(request.from.toString()),
      to: userMap.get(request.to.toString()),
    }));

    return { incoming };
  }
  /** Creates a new message request for a non-friend when messaging is allowed. */
  async sendMessageRequest(
    fromUserId: string,
    toUserId: string,
    firstMessage: string,
  ) {
    if (!firstMessage) throw BadRequest("Message required");

    const toUser = await UserAPI.findUserById(toUserId);

    if (toUser.id.toString() === fromUserId)
      throw BadRequest("Cannot message yourself");

    const blockExists = await SocialAPI.blockExists(toUserId, fromUserId);

    if (blockExists) throw Forbidden("Cannot message this user");

    const friends = await SocialAPI.areFriends(
      fromUserId,
      toUser.id.toString(),
    );

    if (friends) throw BadRequest("Users are already friends");

    // Rate-limit new requests per sender on a calendar-day basis.
    const dailyCount =
      await this.messageRequestRepository.dailyCount(fromUserId);

    if (dailyCount >= 20) {
      throw Forbidden("Too many message requests today");
    }

    const existing = await this.messageRequestRepository.findPendingRequest(
      fromUserId,
      toUser.id,
    );

    if (existing) throw BadRequest("Message request already pending");

    const request = await this.messageRequestRepository.createRequest({
      from: fromUserId,
      to: toUser.id,
      firstMessage,
    });

    const userIds = new Set([request.to.toString(), request.from.toString()]);

    const users = await UserAPI.fetchUsers([...userIds]);

    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      ...request,
      from: userMap.get(request.from.toString()),
      to: userMap.get(request.to.toString()),
    };
  }

  /** Accepts a pending request and converts its placeholder chat into a normal direct chat. */
  async acceptMessageRequest(requestId: string, userId: string) {
    const request = await this.messageRequestRepository.findById(requestId);
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

    await this.messageRequestRepository.acceptRequest(requestId);

    return { chat: newChat };
  }

  /** Rejects a pending request and removes its temporary chat history. */
  async rejectMessageRequest(requestId: string, userId: string) {
    const request = await this.messageRequestRepository.findById(requestId);

    if (!request) throw NotFound("Request not found");

    if (request.to.toString() !== userId) throw Forbidden("Not authorized");

    const chat = await ChatAPI.deletePendingDirectChat(
      request.from.toString(),
      request.to.toString(),
      request.from.toString(),
    );

    if (!chat) throw NotFound("Chat not found");

    await this.messageRepository.deleteMessageByChatId(chat._id.toString());

    await this.messageRequestRepository.rejectRequest(requestId);

    return { request, chatId: chat._id.toString() };
  }
}
