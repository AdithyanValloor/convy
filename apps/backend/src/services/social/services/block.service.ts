import { BlockModel } from "../models/block.model.js";

import {
  BadRequest,
  NotFound,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import { FriendRequestModel } from "../models/request.model.js";
import { FriendshipModel } from "../models/friends.model.js";
import { normalizeFriendship } from "../utils/social.utils.js";
import mongoose from "mongoose";
import * as UserAPI from "../../user/api/user.api.js";

/** Block service helpers for managing user block relationships. */

/** Returns the users blocked by the current user. */
export const getBlockedUsers = async (userId: string) => {
  if (!userId) throw Unauthorized();

  const blocks = await BlockModel.find({ blocker: userId })
    .populate("blocked", "_id username displayName profilePicture")
    .lean();

  return blocks.map((b) => b.blocked);
};

/** Returns the user IDs of people who have blocked the current user. */
export const getBlockedByUsers = async (userId: string) => {
  if (!userId) throw Unauthorized();

  const blocks = await BlockModel.find({ blocked: userId }).lean();

  return blocks.map((b) => b.blocker.toString());
};

/** Blocks a target user and removes any friendship or pending requests. */
export const blockUser = async (userId: string, targetUserId: string) => {
  if (!userId) throw Unauthorized();

  if (userId === targetUserId) {
    throw BadRequest("Cannot block yourself");
  }

  const targetUser = await UserAPI.findUserById(targetUserId);

  const existingBlock = await BlockModel.findOne({
    blocker: userId,
    blocked: targetUserId,
  });

  if (existingBlock) {
    return { alreadyBlocked: true };
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await BlockModel.create(
        [
          {
            blocker: userId,
            blocked: targetUserId,
          },
        ],
        { session },
      );

      const [user1, user2] = normalizeFriendship(userId, targetUserId);
      await FriendshipModel.findOneAndDelete(
        {
          user1,
          user2,
        },
        { session },
      );
      // Cancel friend requests
      await FriendRequestModel.deleteMany(
        {
          $or: [
            { from: userId, to: targetUserId, status: "pending" },
            { from: targetUserId, to: userId, status: "pending" },
          ],
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  return { success: true, blockedUser: targetUser };
};

/** Removes an existing block created by the current user. */
export const unblockUser = async (userId: string, targetUserId: string) => {
  if (!userId) throw Unauthorized();

  const deleted = await BlockModel.findOneAndDelete({
    blocker: userId,
    blocked: targetUserId,
  });

  if (!deleted) {
    return { notBlocked: true };
  }

  return { success: true };
};

/** Checks whether either user has blocked the other. */
export const isBlockedEitherWay = async (userA: string, userB: string) => {
  return BlockModel.exists({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
};
