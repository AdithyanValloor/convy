import mongoose from "mongoose";
import { Chat } from "../models/chat.model.js";
import {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
} from "../../../utils/errors/httpErrors.js";

import { createInboxNotification } from "../../notifications/services/inboxNotification.service.js";
import { deleteFile, generateDownloadUrl } from "../../media/s3.service.js";
import * as SocialAPI from "../../social/api/social.api.js"

/** Group chat service helpers for membership, ownership, and avatar management. */

/** Populates the standard group chat relations used across controller responses. */
const populateGroup = (chatId: string) => {
  return Chat.findById(chatId)
    .populate("members", "-password")
    .populate("admin", "-password")
    .populate("createdBy", "-password")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "username profilePicture email",
      },
    });
};

/** Soft-deletes a group while preserving the record for downstream handling. */
const softDeleteGroup = async (
  chat: any,
  userId: string,
  message = "Group deleted successfully",
) => {
  if (chat.isDeleted) {
    return { message: "Group already deleted", deleted: true };
  }

  chat.isDeleted = true;
  chat.deletedAt = new Date();
  chat.deletedBy = new mongoose.Types.ObjectId(userId);

  await chat.save();

  return { message, deleted: true };
};

/** Creates a group chat after filtering blocked users from the initial member list. */
export const createGroupChatFunction = async (
  name: string,
  userIds: string[],
  currentUserId: string,
) => {
  if (!name || !Array.isArray(userIds) || userIds.length < 1) {
    throw BadRequest("Group name and at least one member are required");
  }

  const blockedUsers = await SocialAPI.getBlockedRelationshipUserIds(currentUserId, userIds);

  const allowedUserIds = userIds.filter((id) => !blockedUsers.has(id));

  const members = Array.from(new Set([...allowedUserIds, currentUserId]));

  const groupChat = await Chat.create({
    chatName: name,
    members,
    isGroup: true,
    admin: [currentUserId],
    createdBy: currentUserId,
  });

  await Promise.all(
    members
      .filter((userId) => userId !== currentUserId)
      .map((userId) =>
        createInboxNotification({
          userId,
          actorId: currentUserId,
          type: "group_added",
          groupId: groupChat._id.toString(),
        }),
      ),
  );

  const group = await populateGroup(groupChat._id.toString());

  return {
    group,
    memberIds: members,
  };
};

/** Returns a populated group chat the current user belongs to. */
export const getGroupByIdFunction = async (userId: string, chatId: string) => {
  if (!userId) throw Unauthorized();
  if (!chatId) throw BadRequest("Group ID is required");

  const group = await Chat.findOne({
    _id: chatId,
    isGroup: true,
    members: userId,
  });

  if (!group) throw NotFound("Group not found");

  return populateGroup(group._id.toString());
};

/** Adds eligible members to a group chat and returns the updated group. */
export const addMembersFunction = async (
  chatId: string,
  members: string[],
  userId: string,
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw NotFound("Chat not found");

  const isAdmin =
    chat.admin.some((id) => id.toString() === userId) ||
    chat.createdBy?.toString() === userId;

  if (!isAdmin) throw Forbidden("Only admins can add new members");

  const blockedUsers = await SocialAPI.getBlockedRelationshipUserIds(userId, members);

  const allowedUserIds = members.filter((id) => !blockedUsers.has(id));

  const existingMembers = new Set(chat.members.map((id) => id.toString()));

  const newMemberIds = allowedUserIds.filter((id) => !existingMembers.has(id));

  chat.members.push(
    ...newMemberIds.map((id) => new mongoose.Types.ObjectId(id)),
  );

  await chat.save();

  await Promise.all(
    newMemberIds.map((memberId) =>
      createInboxNotification({
        userId: memberId,
        actorId: userId,
        type: "group_added",
        groupId: chat._id.toString(),
      }),
    ),
  );

  const group = await populateGroup(chat._id.toString());

  return {
    group,
    newMemberIds,
  };
};

/** Removes a member from a group chat when the acting user has admin rights. */
export const removeMembersFunction = async (
  userId: string,
  chatId: string,
  memberId: string,
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw NotFound("Chat not found");

  const isAdmin =
    chat.admin.some((id) => id.toString() === userId) ||
    chat.createdBy?.toString() === userId;

  if (!isAdmin) throw Forbidden("Only admins can remove members");

  if (chat.createdBy?.toString() === memberId) {
    throw BadRequest("Creator can't be removed");
  }

  chat.members = chat.members.filter((id) => id.toString() !== memberId);
  chat.admin = chat.admin.filter((id) => id.toString() !== memberId);

  await chat.save();

  const group = await populateGroup(chat._id.toString());

  return {
    group,
    removedMemberId: memberId,
  };
};

/** Grants or revokes admin status for a group member. */
export const toggleAdminFunction = async (
  userId: string,
  chatId: string,
  memberId: string,
  makeAdmin: boolean,
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw NotFound("Chat not found");

  if (chat.createdBy?.toString() !== userId) {
    throw Forbidden("Only creator can manage admins");
  }

  if (makeAdmin) {
    if (!chat.admin.some((id) => id.toString() === memberId)) {
      chat.admin.push(new mongoose.Types.ObjectId(memberId));
    }
  } else {
    chat.admin = chat.admin.filter((id) => id.toString() !== memberId);
  }

  await chat.save();

  const group = await populateGroup(chat._id.toString());

  return {
    group,
    memberId,
    isAdmin: makeAdmin,
  };
};

type LeaveGroupResult =
  | { message: string; deleted: true; chatId: string; memberIds: string[] }
  | { message: string; deleted: false; chatId: string };

/** Removes a user from a group or deletes the group when the last owner leaves. */
export const leaveGroupFunction = async (
  userId: string,
  chatId: string,
): Promise<LeaveGroupResult> => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw NotFound("Chat not found");

  if (!chat.isGroup) throw BadRequest("This is not a group chat");

  const isOwner = chat.createdBy?.toString() === userId;
  const memberCount = chat.members.length;

  // A sole remaining owner leaving converts the group into a soft-deleted chat.
  if (isOwner && memberCount === 1) {
    const memberIds = chat.members.map((m) => m.toString());
    const result = await softDeleteGroup(
      chat,
      userId,
      "Group deleted (last member left)",
    );

    return { ...result, chatId, memberIds };
  }

  // Owners must hand the group off before leaving when other members remain.
  if (isOwner && memberCount > 1) {
    throw Forbidden("Transfer ownership before leaving the group");
  }

  chat.members = chat.members.filter((id) => id.toString() !== userId);
  chat.admin = chat.admin.filter((id) => id.toString() !== userId);

  await chat.save();

  return {
    message: "You left the group",
    deleted: false,
    chatId,
  };
};

/** Soft-deletes a group chat owned by the requesting user. */
export const deleteGroupFunction = async (userId: string, chatId: string) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw NotFound("Chat not found");

  if (!chat.isGroup) throw BadRequest("This is not a group chat");

  if (chat.createdBy?.toString() !== userId) {
    throw Forbidden("Only creator can delete this group");
  }

  // Capture the current members before deletion for follow-up notifications.
  const memberIds = chat.members.map((m) => m.toString());

  const result = await softDeleteGroup(chat, userId);

  return {
    ...result,
    chatId,
    memberIds,
  };
};

/** Transfers group ownership to another current member. */
export const transferOwnershipFunction = async (
  userId: string,
  chatId: string,
  newOwnerId: string,
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw NotFound("Chat not found");

  if (!chat.isGroup) throw BadRequest("This is not a group chat");

  if (chat.createdBy?.toString() !== userId) {
    throw Forbidden("Only group owner can transfer ownership");
  }

  if (userId === newOwnerId) throw BadRequest("You are already the owner");

  const isMember = chat.members.some((m) => m.toString() === newOwnerId);
  if (!isMember) throw BadRequest("New owner must be a group member");

  chat.createdBy = new mongoose.Types.ObjectId(newOwnerId);

  if (!chat.admin.some((a) => a.toString() === newOwnerId)) {
    chat.admin.push(new mongoose.Types.ObjectId(newOwnerId));
  }

  await chat.save();

  const group = await populateGroup(chat._id.toString());

  return {
    group,
    newOwnerId,
  };
};

/** Replaces the stored avatar key for a group after permission checks. */
export const updateGroupAvatarById = async (
  userId: string,
  chatId: string,
  key: string,
) => {
  const group = await Chat.findById(chatId);
  if (!group) throw NotFound("Group not found");
  if (!group.isGroup) throw BadRequest("Not a group chat");

  const isAdmin =
    group.admin.some((id) => id.toString() === userId) ||
    group.createdBy?.toString() === userId;

  if (!isAdmin) throw Unauthorized();

  if (group.avatar?.key) {
    await deleteFile(group.avatar.key);
  }

  await generateDownloadUrl(key);

  group.avatar = {
    key,
  };

  await group.save();

  return {
    avatar: group.avatar,
  };
};

/** Returns a download URL for a group's stored avatar. */
export const getGroupAvatarUrlService = async (
  chatId: string,
  userId: string,
) => {
  const group = await Chat.findById(chatId);

  if (!group) throw NotFound("Group not found");
  if (!group.isGroup) throw BadRequest("Not a group chat");

  const avatarKey = group.avatar?.key;

  if (!avatarKey) throw NotFound("Avatar not found");

  const url = await generateDownloadUrl(avatarKey);

  return url;
};

/** Updates the group name when the requesting user can manage the group. */
export const editGroupNameService = async (
  userId: string,
  chatId: string,
  newName: string,
) => {
  if (!chatId || !newName) {
    throw BadRequest("Chat ID and new name are required");
  }

  if (newName.trim().length < 2) {
    throw BadRequest("Group name too short");
  }

  const group = await Chat.findById(chatId);

  if (!group) throw NotFound("Group not found");
  if (!group.isGroup) throw BadRequest("Not a group chat");

  const isAdmin =
    group.admin.some((id) => id.toString() === userId) ||
    group.createdBy?.toString() === userId;

  if (!isAdmin) throw Unauthorized();

  group.chatName = newName;
  await group.save();

  return group;
};
