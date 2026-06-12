import { BlockModel } from "../models/block.model.js";
import { areFriendsCheck } from "../utils/social.utils.js";

export const areFriends = async (
  userA: string,
  userB: string,
) => {
  return areFriendsCheck(userA, userB);
};

export const blockExists = async (userA: string, userB: string) => {
  const blocked = await BlockModel.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });

  return !blocked;
};

export const getBlockedRelationshipUserIds = async (
  currentUserId: string,
  userIds: string[],
) => {
  const blockedRelations = await BlockModel.find({
    $or: [
      {
        blocker: currentUserId,
        blocked: { $in: userIds },
      },
      {
        blocked: currentUserId,
        blocker: { $in: userIds },
      },
    ],
  }).select("blocker blocked");

  const blockedUsers = new Set<string>();

  for (const relation of blockedRelations) {
    if (relation.blocker.toString() === currentUserId) {
      blockedUsers.add(relation.blocked.toString());
    } else {
      blockedUsers.add(relation.blocker.toString());
    }
  }

  return blockedUsers;
};
