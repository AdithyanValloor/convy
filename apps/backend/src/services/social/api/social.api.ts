import { blockRepository } from "../composition/container.js";
import { areFriendsCheck } from "../utils/social.utils.js";

export const areFriends = async (
  userA: string,
  userB: string,
) => {
  return areFriendsCheck(userA, userB);
};

export const blockExists = async (
  userA: string,
  userB: string,
) => {
  return blockRepository.findBlockRelationship(userA, userB);
};

export const getBlockedRelationshipUserIds = async (
  currentUserId: string,
  userIds: string[],
) => {
  const blockedRelations =
    await blockRepository.findBlockedRelationships(
      currentUserId,
      userIds,
    );

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