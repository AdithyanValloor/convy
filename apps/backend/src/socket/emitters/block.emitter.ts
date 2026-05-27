/**
 * Block-related socket emitters.
 * Notifies both the target user and the acting user.
 */

import { getIO } from "../io.js";

export const emitUserBlocked = (
  blockerId: string,
  targetUserId: string,
): void => {
  const io = getIO();

  // Tell the target their relationship state has changed.
  io.to(targetUserId).emit("user_blocked", {
    by: blockerId,
  });

  // Confirm the action back to the user who initiated it.
  io.to(blockerId).emit("block_success", {
    targetUserId,
  });
};

export const emitUserUnblocked = (
  targetUserId: string,
  unblockerId: string,
): void => {
  const io = getIO();

  // Tell the target the block has been lifted.
  io.to(targetUserId).emit("user_unblocked", {
    by: unblockerId,
  });

  // Confirm the action back to the user who initiated it.
  io.to(unblockerId).emit("block_success", {
    targetUserId,
  });
};
