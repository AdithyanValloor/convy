import { BlockModel } from "../../social/models/block.model.js";

export const getBlockedUsers = async (
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
