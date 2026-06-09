import { BlockModel } from "../../social/models/block.model.js";

export const canInteract = async (userA: string, userB: string) => {
  const blocked = await BlockModel.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });

  return !blocked;
};
