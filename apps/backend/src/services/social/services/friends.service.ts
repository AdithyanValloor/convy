import {
  BadRequest,
  Unauthorized,
  NotFound,
  Forbidden,
} from "../../../utils/errors/httpErrors.js";

import {
  emitNotificationRemoved,
  emitUnreadNotificationCount,
} from "../../../socket/emitters/notification.emitters.js";

import { IFriendRequest } from "../models/request.model.js";
import { areFriendsCheck, normalizeFriendship } from "../utils/social.utils.js";
import mongoose, { Types } from "mongoose";
import {
  PopulatedFriendRequest,
  toFriendRequestSocketPayload,
} from "../utils/normalizeFriendRequest.js";
import * as ChatAPI from "../../chat/api/chat.api.js";
import * as UserAPI from "../../user/api/user.api.js";
import * as NotificationAPI from "../../notifications/api/notifications.api.js";
import { IFriendsRepository } from "../repositories/friends.repository.js";
import { IRequestRepository } from "../repositories/request.repository.js";
import { IBlockRepository } from "../repositories/block.repository.js";

/** Friend service helpers for friendship and request workflows. */

/** Returns the authenticated user's populated friend list. */

//TODO pagination!!!!!

export class FriendsService {
  constructor(
    private readonly friendsRepository: IFriendsRepository,
    private readonly requestRepository: IRequestRepository,
    private readonly blockRepository: IBlockRepository,
  ) {}

  private async populateUsersInRequest(
    request: IFriendRequest,
  ): Promise<PopulatedFriendRequest> {
    const fromId = request.from._id.toString();
    const toId = request.to._id.toString();

    const users = await UserAPI.fetchUsers([fromId, toId]);

    const userMap = new Map(users.map((user) => [user.id.toString(), user]));

    const fromUser = userMap.get(fromId);
    const toUser = userMap.get(toId);

    if (!fromUser || !toUser) {
      throw new Error(
        `Could not populate friend request users: from=${fromId}, to=${toId}`,
      );
    }

    return {
      _id: request._id,
      status: request.status,
      createdAt: request.createdAt,

      from: {
        _id: new Types.ObjectId(fromUser.id),
        username: fromUser.username,
        displayName: fromUser.displayName,
        profilePicture: fromUser.profilePicture,
      },

      to: {
        _id: new Types.ObjectId(toUser.id),
        username: toUser.username,
        displayName: toUser.displayName,
        profilePicture: toUser.profilePicture,
      },
    };
  }

  async getFriendList(userId: string) {
    if (!userId) throw Unauthorized();
    const friendIds = await this.friendsRepository.getFriendIds(userId);
    const friends = await UserAPI.fetchUsers(friendIds);
    return friends;
  }

  /** Returns the current user's incoming and outgoing pending requests. */
  async fetchRequests(userId: string) {
    if (!userId) throw Unauthorized();

    const incomingRequests =
      await this.requestRepository.findIncomingFriendRequests(userId);
    const outgoingRequests =
      await this.requestRepository.findOutGoingFriendRequests(userId);

    const userIds = new Set<string>();

    for (let incoming of incomingRequests) {
      userIds.add(incoming.from._id.toString());
    }

    for (let outgoing of outgoingRequests) {
      userIds.add(outgoing.to._id.toString());
    }

    const users = await UserAPI.fetchUsers([...userIds]);

    const userMap = new Map(users.map((user) => [user.id, user]));

    const incoming = incomingRequests.map((req) => {
      return {
        ...req,
        from: userMap.get(req.from._id.toString()),
      };
    });

    const outgoing = outgoingRequests.map((req) => {
      return {
        ...req,
        to: userMap.get(req.to._id.toString()),
      };
    });

    return { incoming, outgoing };
  }

  /** Creates a new friend request and the related inbox notification. */
  async sendFriendRequest(fromUserId: string, toUsername: string) {
    if (!fromUserId || !toUsername) {
      throw BadRequest("Invalid request parameters");
    }

    const fromUser = await UserAPI.findUserById(fromUserId);
    if (!fromUser) throw Unauthorized();

    const toUser = await UserAPI.findUserByName(toUsername);
    if (!toUser) throw NotFound("User not found");

    // Self-check first, since it is the most obvious validation failure.
    if (fromUser.id === toUser.id) {
      throw BadRequest("Cannot send friend request to yourself");
    }

    if (await areFriendsCheck(fromUser.id, toUser.id))
      throw BadRequest("Already friends");

    const blockExists = await this.blockRepository.findBlockRelationship(
      fromUserId,
      toUser.id,
    );

    if (blockExists) {
      throw BadRequest("Cannot send friend request to this user");
    }

    if (toUser.privacy?.friendRequests === "nobody") {
      throw BadRequest("This user is not accepting friend requests");
    }

    if (toUser.privacy?.friendRequests === "friends") {
      const senderFriendIds = await this.friendsRepository.getFriendIds(
        fromUser.id,
      );
      const targetFriendIds = await this.friendsRepository.getFriendIds(
        toUser.id,
      );
      const senderFriendSet = new Set(senderFriendIds);
      const hasMutualFriend = targetFriendIds.some((id) =>
        senderFriendSet.has(id),
      );

      if (!hasMutualFriend) {
        throw BadRequest(
          "This user only accepts requests from friends of friends",
        );
      }
    }

    const [user1, user2] = normalizeFriendship(fromUserId, toUser.id);

    const existingRequest =
      await this.requestRepository.findFriendRequestExists(user1, user2);

    if (existingRequest) {
      throw BadRequest("Friend request already sent");
    }

    const request = await this.requestRepository.createFriendRequest(
      fromUserId,
      toUser.id,
    );

    await NotificationAPI.notifyFriendRequestReceived(
      toUser.id,
      fromUserId,
      request._id.toString(),
    );

    const populated = await this.populateUsersInRequest(request);

    return {
      request,
      payload: toFriendRequestSocketPayload(
        populated as unknown as PopulatedFriendRequest,
      ),
      toUserId: toUser.id.toString(),
    };
  }

  /** Accepts a pending friend request and creates the friendship. */
  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.requestRepository.findById(requestId);
    if (!request) throw NotFound("Request not found");

    if (request.status !== "pending") {
      throw BadRequest("Request has already been processed");
    }

    if (request.to.toString() !== userId) {
      throw Forbidden("Not authorized to accept this request");
    }

    const fromUserId = request.from.toString();
    const toUserId = request.to.toString();

    if (await areFriendsCheck(fromUserId, toUserId)) {
      throw BadRequest("Users are already friends");
    }

    const [user1, user2] = normalizeFriendship(fromUserId, toUserId);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await this.friendsRepository.createFriendShip(user1, user2, session);

        await this.requestRepository.acceptFriendRequest(requestId, session);
      });
    } finally {
      await session.endSession();
    }

    await ChatAPI.ensureChatExists(fromUserId, toUserId);

    await NotificationAPI.notifyFriendRequestAccepted(fromUserId, toUserId);
    await NotificationAPI.deleteNotificationByFriendReq(requestId)

    const populated = await this.populateUsersInRequest(request);

    return {
      request,
      payload: toFriendRequestSocketPayload(
        populated as unknown as PopulatedFriendRequest,
      ),
      fromUserId,
      toUserId,
    };
  }

  /** Rejects a pending friend request owned by the current user. */
  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.requestRepository.findById(requestId);
    if (!request) throw NotFound("Request not found");

    if (request.status !== "pending") {
      throw BadRequest("Request has already been processed");
    }

    if (request.to.toString() !== userId) {
      throw Forbidden("Not authorized to reject this request");
    }

    await this.requestRepository.rejectFriendRequest(requestId);

    return {
      request,
      fromUserId: request.from.toString(),
      requestId: request._id.toString(),
    };
  }

  /** Removes an existing friendship from both users. */
  async removeFriend(userId: string, friendId: string) {
    if (!(await areFriendsCheck(userId, friendId)))
      throw BadRequest("Users are not friends");
    const [user1, user2] = normalizeFriendship(userId, friendId);

    await this.friendsRepository.deleteFriendship(user1, user2);

    return true;
  }

  /** Cancels a pending friend request sent by the current user. */
  async cancelFriendRequest(requestId: string, userId: string) {
    const request = await this.requestRepository.findById(requestId);
    if (!request) throw NotFound("Request not found");

    if (request.from.toString() !== userId) {
      throw Forbidden("Not authorized to cancel this request");
    }

    if (request.status !== "pending") {
      throw BadRequest("Cannot cancel processed request");
    }

    const toUserId = request.to.toString();
    const reqId = request._id.toString();

    const deleted = await NotificationAPI.deleteNotificationByFriendReq(reqId);

    if (deleted) {
      emitNotificationRemoved(toUserId, reqId);

      const freshCount = await NotificationAPI.countUnread(
        deleted.user.toString(),
      );

      emitUnreadNotificationCount(deleted.user.toString(), freshCount);
    }

    await this.requestRepository.deleteRequestById(requestId);

    return { toUserId, requestId: reqId };
  }
}
