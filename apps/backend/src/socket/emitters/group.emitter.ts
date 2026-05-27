/**
 * Group-related socket emitters.
 * Uses both group rooms and user rooms depending on the event.
 */

import { getIO } from "../io.js";

export const emitGroupCreated = (
  group: any,
  memberIds: string[]
) => {
  const io = getIO();

  // Notify members directly so the new group appears in their chat list.
  memberIds.forEach((userId) => {
    io.to(userId).emit("group_created", group);
  });
};

export const emitGroupUpdated = (
  chatId: string,
  group: any
) => {
  getIO().to(chatId).emit("group_updated", group);
};

export const emitMembersAdded = (
  chatId: string,
  group: any,
  newMemberIds: string[]
) => {
  const io = getIO();

  // Update the existing group room first.
  io.to(chatId).emit("members_added", group);

  // Notify newly added members directly so the group appears immediately.
  newMemberIds.forEach((userId) => {
    io.to(userId).emit("added_to_group", group);
  });
};

export const emitMemberRemoved = (
  chatId: string,
  removedUserId: string
) => {
  const io = getIO();

  io.to(chatId).emit("member_removed", {
    chatId,
    removedUserId,
  });

  // Notify the removed user separately after they stop receiving room events.
  io.to(removedUserId).emit("removed_from_group", {
    chatId,
  });
};

export const emitAdminToggled = (
  chatId: string,
  memberId: string,
  isAdmin: boolean
) => {
  getIO().to(chatId).emit("admin_toggled", {
    chatId,
    memberId,
    isAdmin,
  });
};

export const emitOwnershipTransferred = (
  chatId: string,
  newOwnerId: string
) => {
  getIO().to(chatId).emit("ownership_transferred", {
    chatId,
    newOwnerId,
  });
};

export const emitMemberLeft = (
  chatId: string,
  userId: string
) => {
  const io = getIO();

  io.to(chatId).emit("member_left", {
    chatId,
    userId,
  });

  // Notify the leaving user separately so their chat list can update.
  io.to(userId).emit("left_group", {
    chatId,
  });
};

export const emitGroupDeleted = (
  chatId: string,
  memberIds: string[]
) => {
  const io = getIO();

  // Deleted groups are pushed directly because members may no longer share a room.
  memberIds.forEach((userId) => {
    io.to(userId).emit("group_deleted", { chatId });
  });
};
