import { NextFunction, Response } from "express";
import {
  addMembersFunction,
  createGroupChatFunction,
  deleteGroupFunction,
  editGroupNameService,
  getGroupAvatarUrlService,
  getGroupByIdFunction,
  leaveGroupFunction,
  removeMembersFunction,
  toggleAdminFunction,
  transferOwnershipFunction,
  updateGroupAvatarById,
} from "../services/group.service.js";
import { BadRequest, Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  emitAdminToggled,
  emitGroupCreated,
  emitGroupDeleted,
  emitGroupUpdated,
  emitMemberLeft,
  emitMemberRemoved,
  emitMembersAdded,
  emitOwnershipTransferred,
} from "../../../socket/emitters/group.emitter.js";
import { GROUP_KEY_REGEX } from "../../user/constants/regex.js";
import { AuthRequest } from "../../auth/types/authRequest.js";

/** Group chat controller handlers for authenticated group actions. */

/** Creates a new group chat and emits it to all initial members. */
export const createGroupChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, userIds }: { name?: string; userIds?: string[] } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) throw Unauthorized();

    if (!name || !Array.isArray(userIds) || userIds.length === 0) {
      throw BadRequest("Group name and member list are required");
    }

    const { group, memberIds } = await createGroupChatFunction(
      name,
      userIds,
      currentUserId,
    );

    emitGroupCreated(group, memberIds);

    res.status(201).json({
      message: "Group chat created",
      groupChat: group,
    });
  } catch (error) {
    next(error);
  }
};

/** Returns a single group chat visible to the current user. */
export const getGroupById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!id) throw BadRequest("Group ID is required");

    const group = await getGroupByIdFunction(userId, id);

    res.status(200).json({ group });
  } catch (error) {
    next(error);
  }
};

/** Adds new members to a group chat and emits membership updates. */
export const addMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { chatId, members }: { chatId?: string; members?: string[] } =
      req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    if (!chatId || !Array.isArray(members) || members.length === 0) {
      throw BadRequest("Chat ID and members array are required");
    }

    const { group, newMemberIds } = await addMembersFunction(
      chatId,
      members,
      userId,
    );

    emitMembersAdded(chatId, group, newMemberIds);

    res.status(200).json({
      message: "Members added successfully",
      chat: group,
    });
  } catch (error) {
    next(error);
  }
};

/** Removes a member from a group chat and broadcasts the updated group state. */
export const removeMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { chatId, member }: { chatId?: string; member?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    if (!chatId || !member) {
      throw BadRequest("Chat ID and member ID are required");
    }

    const { group, removedMemberId } = await removeMembersFunction(
      userId,
      chatId,
      member,
    );

    emitMemberRemoved(chatId, removedMemberId);

    // Remaining members still need the updated group payload.
    emitGroupUpdated(chatId, group);

    res.status(200).json({
      message: "Member removed successfully",
      chat: group,
    });
  } catch (error) {
    next(error);
  }
};

/** Promotes or demotes a group member's admin role. */
export const toggleAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      chatId,
      member,
      makeAdmin,
    }: { chatId?: string; member?: string; makeAdmin?: boolean } = req.body;

    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    if (!chatId || !member || typeof makeAdmin !== "boolean") {
      throw BadRequest("Invalid admin toggle payload");
    }

    const { group, memberId, isAdmin } = await toggleAdminFunction(
      userId,
      chatId,
      member,
      makeAdmin,
    );

    emitAdminToggled(chatId, memberId, isAdmin);

    res.status(200).json({
      message: makeAdmin ? "User promoted to admin" : "User demoted",
      chat: group,
    });
  } catch (error) {
    next(error);
  }
};

/** Removes the current user from a group or deletes it if they are the last owner. */
export const leaveGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { chatId }: { chatId?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("Chat ID is required");

    const result = await leaveGroupFunction(userId, chatId);

    if (result.deleted) {
      emitGroupDeleted(result.chatId, result.memberIds!);
    } else {
      emitMemberLeft(result.chatId, userId);
    }

    res.status(200).json({
      message: result.message,
      deleted: result.deleted,
    });
  } catch (error) {
    next(error);
  }
};

/** Deletes a group chat and emits removal to all affected members. */
export const deleteGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { chatId }: { chatId?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("Chat ID is required");

    const { chatId: deletedChatId, memberIds } = await deleteGroupFunction(
      userId,
      chatId,
    );

    emitGroupDeleted(deletedChatId, memberIds);

    res.status(200).json({
      message: "Group deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/** Transfers group ownership to another eligible member. */
export const transferOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { chatId, newOwnerId }: { chatId?: string; newOwnerId?: string } =
      req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    if (!chatId || !newOwnerId) {
      throw BadRequest("Chat ID and new owner ID are required");
    }

    const { group, newOwnerId: resolvedNewOwnerId } =
      await transferOwnershipFunction(userId, chatId, newOwnerId);

    emitOwnershipTransferred(chatId, resolvedNewOwnerId);

    res.status(200).json({
      message: "Ownership transferred successfully",
      chat: group,
    });
  } catch (error) {
    next(error);
  }
};

/** Updates a group's avatar after validating the uploaded storage key. */
export const updateGroupAvatar = async (
  req: AuthRequest<{}, {}, { chatId: string; key: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { chatId, key } = req.body;

    if (!chatId || !key) {
      throw BadRequest("chatId and key required");
    }

    // Enforce the expected group avatar key pattern before touching storage.
    if (!GROUP_KEY_REGEX.test(key) || !key.startsWith(`group/${chatId}/`)) {
      throw Unauthorized();
    }

    const result = await updateGroupAvatarById(userId, chatId, key);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Returns a temporary download URL for the current group's avatar. */
export const getAvatarDownloadUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("Chat ID is required");

    const url = await getGroupAvatarUrlService(chatId, userId);

    res.json({ url });
  } catch (error) {
    next(error);
  }
};

/** Renames a group chat for members who can manage it. */
export const editName = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { chatId, newName } = req.body;

    const updatedChat = await editGroupNameService(userId, chatId, newName);

    res.status(200).json({
      success: true,
      chat: updatedChat,
    });
  } catch (error) {
    next(error);
  }
};
