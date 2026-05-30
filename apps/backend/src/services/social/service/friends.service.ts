import {
  BadRequest,
  Unauthorized,
  NotFound,
  Forbidden,
} from "../../../utils/errors/httpErrors.js";



import {
  createInboxNotification,
  deleteNotificationByFriendRequest,
} from "../../notifications/services/inboxNotification.service.js";
import {
  emitNotificationRemoved,
  emitUnreadNotificationCount,
} from "../../../socket/emitters/notification.emitters.js";
import { InboxNotificationModel } from "../../notifications/models/inboxNotification.model.js";

import { BlockModel } from "../models/block.model.js";
import { FriendshipModel } from "../models/friends.model.js";
import { UserModel } from "../../user/models/user.model.js";
import { FriendRequestModel } from "../models/request.model.js";
import {
  areFriends,
  getFriendIds,
  normalizeFriendship,
} from "../utils/social.utils.js";
import mongoose from "mongoose";
import { PopulatedFriendRequest, toFriendRequestSocketPayload } from "../../user/utils/normalizeFriendRequest.js";

/** Friend service helpers for friendship and request workflows. */

/** Returns the authenticated user's populated friend list. */

//TODO pagination!!!!!
export const getFriendList = async (userId: string) => {
  if (!userId) throw Unauthorized();

  const friendIds = await getFriendIds(userId);
  const friends = await UserModel.find(
    {
      _id: { $in: friendIds },
    },
    "displayName username profilePicture",
  ).lean();

  return friends;
};

/** Returns the current user's incoming and outgoing pending requests. */
export const fetchRequests = async (userId: string) => {
  if (!userId) throw Unauthorized();

  const incoming = await FriendRequestModel.find({
    to: userId,
    status: "pending",
  }).populate("from", "displayName username email profilePicture");

  const outgoing = await FriendRequestModel.find({
    from: userId,
    status: "pending",
  }).populate("to", "displayName username email profilePicture");

  return { incoming, outgoing };
};

/** Creates a new friend request and the related inbox notification. */
export const sendFriendRequest = async (
  fromUserId: string,
  toUsername: string,
) => {
  if (!fromUserId || !toUsername) {
    throw BadRequest("Invalid request parameters");
  }

  const fromUser = await UserModel.findById(fromUserId);
  if (!fromUser) throw Unauthorized();

  const toUser = await UserModel.findOne({ username: toUsername });
  if (!toUser) throw NotFound("User not found");

  // Self-check first, since it is the most obvious validation failure.
  if (fromUser.id === toUser.id) {
    throw BadRequest("Cannot send friend request to yourself");
  }

  if (await areFriends(fromUser.id, toUser.id))
    throw BadRequest("Already friends");

  const blockExists = await BlockModel.exists({
    $or: [
      { blocker: fromUserId, blocked: toUser.id },
      { blocker: toUser.id, blocked: fromUserId },
    ],
  });

  if (blockExists) {
    throw BadRequest("Cannot send friend request to this user");
  }

  if (toUser.privacy?.friendRequests === "nobody") {
    throw BadRequest("This user is not accepting friend requests");
  }

  if (toUser.privacy?.friendRequests === "friends") {
    const senderFriendIds = await getFriendIds(fromUser.id);
    const targetFriendIds = await getFriendIds(toUser.id);
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

  const existingRequest = await FriendRequestModel.findOne({
    $or: [
      {
        from: fromUserId,
        to: toUser.id,
      },
      {
        from: toUser.id,
        to: fromUserId,
      },
    ],
    status: "pending",
  });

  if (existingRequest) {
    throw BadRequest("Friend request already sent");
  }

  const request = await FriendRequestModel.create({
    from: fromUserId,
    to: toUser.id,
    status: "pending",
  });

  await createInboxNotification({
    userId: toUser.id,
    actorId: fromUserId,
    type: "friend_request_received",
    friendRequestId: request.id,
  });

  const populated = await request.populate([
    { path: "from", select: "username displayName profilePicture" },
    { path: "to", select: "username displayName profilePicture" },
  ]);

  return {
    request,
    payload: toFriendRequestSocketPayload(
      populated as unknown as PopulatedFriendRequest,
    ),
    toUserId: toUser.id.toString(),
  };
};

/** Accepts a pending friend request and creates the friendship. */
export const acceptFriendRequest = async (
  requestId: string,
  userId: string,
) => {
  const request = await FriendRequestModel.findById(requestId);
  if (!request) throw NotFound("Request not found");

  if (request.status !== "pending") {
    throw BadRequest("Request has already been processed");
  }

  if (request.to.toString() !== userId) {
    throw Forbidden("Not authorized to accept this request");
  }

  const fromUserId = request.from.toString();
  const toUserId = request.to.toString();

  if (await areFriends(fromUserId, toUserId)) {
    throw BadRequest("Users are already friends");
  }

  const [user1, user2] = normalizeFriendship(fromUserId, toUserId);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await FriendshipModel.create(
        [
          {
            user1,
            user2,
          },
        ],
        { session },
      );

      request.status = "accepted";
      await request.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await createInboxNotification({
    userId: fromUserId,
    actorId: toUserId,
    type: "friend_request_accepted",
  });

  const populated = await request.populate([
    { path: "from", select: "username displayName profilePicture" },
    { path: "to", select: "username displayName profilePicture" },
  ]);

  return {
    request,
    payload: toFriendRequestSocketPayload(
      populated as unknown as PopulatedFriendRequest,
    ),
    fromUserId,
    toUserId,
  };
};

/** Rejects a pending friend request owned by the current user. */
export const rejectFriendRequest = async (
  requestId: string,
  userId: string,
) => {
  const request = await FriendRequestModel.findById(requestId);
  if (!request) throw NotFound("Request not found");

  if (request.status !== "pending") {
    throw BadRequest("Request has already been processed");
  }

  if (request.to.toString() !== userId) {
    throw Forbidden("Not authorized to reject this request");
  }

  request.status = "rejected";
  await request.save();

  return {
    request,
    fromUserId: request.from.toString(),
    requestId: request._id.toString(),
  };
};

/** Removes an existing friendship from both users. */
export const removeFriend = async (userId: string, friendId: string) => {
  if (!(await areFriends(userId, friendId)))
    throw BadRequest("Users are not friends");
  const [user1, user2] = normalizeFriendship(userId, friendId);

  await FriendshipModel.findOneAndDelete({
    user1,
    user2,
  });

  return true;
};

/** Cancels a pending friend request sent by the current user. */
export const cancelFriendRequest = async (
  requestId: string,
  userId: string,
) => {
  const request = await FriendRequestModel.findById(requestId);
  if (!request) throw NotFound("Request not found");

  if (request.from.toString() !== userId) {
    throw Forbidden("Not authorized to cancel this request");
  }

  if (request.status !== "pending") {
    throw BadRequest("Cannot cancel processed request");
  }

  const toUserId = request.to.toString();
  const reqId = request._id.toString();

  const deleted = await deleteNotificationByFriendRequest(reqId);

  if (deleted) {
    emitNotificationRemoved(toUserId, reqId);

    const freshCount = await InboxNotificationModel.countDocuments({
      user: deleted.userId,
      read: false,
    });
    emitUnreadNotificationCount(deleted.userId, freshCount);
  }

  await request.deleteOne();

  return { toUserId, requestId: reqId };
};
