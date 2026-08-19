import {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
} from "../../../utils/errors/httpErrors.js";

import { deleteFile, generateDownloadUrl } from "../../media/s3.service.js";
import * as SocialAPI from "../../social/api/social.api.js";
import * as UserAPI from "../../user/api/user.api.js";
import * as NotificationAPI from "../../notifications/api/notifications.api.js";

import { IChatRepository } from "../repositories/chat.repository.js";

// TODO populate lastMessage with Message API...

export class GroupService {
  constructor(private readonly chatRepository: IChatRepository) {}

  /** Creates a group chat after filtering blocked users. */
  async createGroupChatFunction(
    name: string,
    userIds: string[],
    currentUserId: string,
  ) {
    if (!name || !Array.isArray(userIds) || userIds.length < 1) {
      throw BadRequest("Group name and at least one member are required");
    }

    const blockedUsers = await SocialAPI.getBlockedRelationshipUserIds(
      currentUserId,
      userIds,
    );

    const allowedUserIds = userIds.filter((id) => !blockedUsers.has(id));

    const members = Array.from(new Set([...allowedUserIds, currentUserId]));

    const group = await this.chatRepository.createGroup({
      name,
      members,
      creatorId: currentUserId,
    });

    await Promise.all(
      members
        .filter((userId) => userId !== currentUserId)
        .map(
          async (userId) =>
            await NotificationAPI.notifyGroupAdded(
              userId,
              currentUserId,
              group._id.toString(),
            ),
        ),
    );

    const memberUsers = await UserAPI.fetchUsers(members.map(String));

    return {
      group: {
        ...group,
        members: memberUsers,
      },
      memberIds: members,
    };
  }

  /** Returns a group the current user belongs to. */
  async getGroupByIdFunction(userId: string, chatId: string) {
    if (!userId) throw Unauthorized();

    if (!chatId) {
      throw BadRequest("Group ID is required");
    }

    const group = await this.chatRepository.findGroupByIdForUser(
      chatId,
      userId,
    );

    if (!group) {
      throw NotFound("Group not found");
    }

    const members = await UserAPI.fetchUsers(group.members.map(String));

    return {
      ...group,
      members,
    };
  }

  /** Adds eligible members to a group. */
  async addMembersFunction(chatId: string, members: string[], userId: string) {
    const chat = await this.chatRepository.findGroupById(chatId);

    if (!chat) {
      throw NotFound("Chat not found");
    }

    const isAdmin =
      chat.admin.some((id) => id.toString() === userId) ||
      chat.createdBy?.toString() === userId;

    if (!isAdmin) {
      throw Forbidden("Only admins can add new members");
    }

    const blockedUsers = await SocialAPI.getBlockedRelationshipUserIds(
      userId,
      members,
    );

    const allowedUserIds = members.filter((id) => !blockedUsers.has(id));

    const existingMembers = new Set(chat.members.map((id) => id.toString()));

    const newMemberIds = allowedUserIds.filter(
      (id) => !existingMembers.has(id),
    );

    if (newMemberIds.length > 0) {
      await this.chatRepository.addMembers(chatId, newMemberIds);
    }

    await Promise.all(
      newMemberIds.map(
        async (memberId) =>
          await NotificationAPI.notifyGroupAdded(memberId, userId, chatId),
      ),
    );

    const updatedGroup = await this.chatRepository.findGroupById(chatId);

    if (!updatedGroup) {
      throw NotFound("Chat not found");
    }

    const memberUsers = await UserAPI.fetchUsers(
      updatedGroup.members.map(String),
    );

    return {
      group: {
        ...updatedGroup,
        members: memberUsers,
      },
      newMemberIds,
    };
  }

  /** Removes a member from a group. */
  async removeMembersFunction(
    userId: string,
    chatId: string,
    memberId: string,
  ) {
    const chat = await this.chatRepository.findGroupById(chatId);

    if (!chat) {
      throw NotFound("Chat not found");
    }

    const isAdmin =
      chat.admin.some((id) => id.toString() === userId) ||
      chat.createdBy?.toString() === userId;

    if (!isAdmin) {
      throw Forbidden("Only admins can remove members");
    }

    if (chat.createdBy?.toString() === memberId) {
      throw BadRequest("Creator can't be removed");
    }

    const updatedGroup = await this.chatRepository.removeMember(
      chatId,
      memberId,
    );

    if (!updatedGroup) {
      throw NotFound("Chat not found");
    }

    const memberUsers = await UserAPI.fetchUsers(
      updatedGroup.members.map(String),
    );

    return {
      group: {
        ...updatedGroup,
        members: memberUsers,
      },
      removedMemberId: memberId,
    };
  }

  /** Grants or revokes admin status. */
  async toggleAdminFunction(
    userId: string,
    chatId: string,
    memberId: string,
    makeAdmin: boolean,
  ) {
    const chat = await this.chatRepository.findGroupById(chatId);

    if (!chat) {
      throw NotFound("Chat not found");
    }

    if (chat.createdBy?.toString() !== userId) {
      throw Forbidden("Only creator can manage admins");
    }

    const updatedGroup = await this.chatRepository.toggleAdmin(
      chatId,
      memberId,
      makeAdmin,
    );

    if (!updatedGroup) {
      throw NotFound("Chat not found");
    }

    const memberUsers = await UserAPI.fetchUsers(
      updatedGroup.members.map(String),
    );

    return {
      group: {
        ...updatedGroup,
        members: memberUsers,
      },
      memberId,
      isAdmin: makeAdmin,
    };
  }

  /** Removes a user from a group or deletes it if they are the last owner. */
  async leaveGroupFunction(userId: string, chatId: string) {
    const chat = await this.chatRepository.findGroupById(chatId);

    if (!chat) {
      throw NotFound("Chat not found");
    }

    if (!chat.isGroup) {
      throw BadRequest("This is not a group chat");
    }

    const isOwner = chat.createdBy?.toString() === userId;

    const memberCount = chat.members.length;

    if (isOwner && memberCount === 1) {
      const memberIds = chat.members.map(String);

      await this.chatRepository.softDeleteGroup(chatId, userId);

      return {
        message: "Group deleted (last member left)",
        deleted: true,
        chatId,
        memberIds,
      };
    }

    if (isOwner && memberCount > 1) {
      throw Forbidden("Transfer ownership before leaving the group");
    }

    await this.chatRepository.leaveGroup(chatId, userId);

    return {
      message: "You left the group",
      deleted: false,
      chatId,
    };
  }

  /** Soft-deletes a group owned by the requesting user. */
  async deleteGroupFunction(userId: string, chatId: string) {
    const chat = await this.chatRepository.findGroupById(chatId);

    if (!chat) {
      throw NotFound("Chat not found");
    }

    if (!chat.isGroup) {
      throw BadRequest("This is not a group chat");
    }

    if (chat.createdBy?.toString() !== userId) {
      throw Forbidden("Only creator can delete this group");
    }

    const memberIds = chat.members.map(String);

    const result = await this.chatRepository.softDeleteGroup(chatId, userId);

    if (!result) {
      throw NotFound("Chat not found");
    }

    return {
      message: "Group deleted successfully",
      deleted: true,
      chatId,
      memberIds,
    };
  }

  /** Transfers group ownership. */
  async transferOwnershipFunction(
    userId: string,
    chatId: string,
    newOwnerId: string,
  ) {
    const chat = await this.chatRepository.findGroupById(chatId);

    if (!chat) {
      throw NotFound("Chat not found");
    }

    if (!chat.isGroup) {
      throw BadRequest("This is not a group chat");
    }

    if (chat.createdBy?.toString() !== userId) {
      throw Forbidden("Only group owner can transfer ownership");
    }

    if (userId === newOwnerId) {
      throw BadRequest("You are already the owner");
    }

    const isMember = chat.members.some(
      (member) => member.toString() === newOwnerId,
    );

    if (!isMember) {
      throw BadRequest("New owner must be a group member");
    }

    const updatedGroup = await this.chatRepository.transferOwnership(
      chatId,
      newOwnerId,
    );

    if (!updatedGroup) {
      throw NotFound("Chat not found");
    }

    const memberUsers = await UserAPI.fetchUsers(
      updatedGroup.members.map(String),
    );

    return {
      group: {
        ...updatedGroup,
        members: memberUsers,
      },
      newOwnerId,
    };
  }

  /** Replaces the group avatar. */
  async updateGroupAvatarById(userId: string, chatId: string, key: string) {
    const group = await this.chatRepository.findGroupById(chatId);

    if (!group) {
      throw NotFound("Group not found");
    }

    if (!group.isGroup) {
      throw BadRequest("Not a group chat");
    }

    const isAdmin =
      group.admin.some((id) => id.toString() === userId) ||
      group.createdBy?.toString() === userId;

    if (!isAdmin) {
      throw Unauthorized();
    }

    if (group.avatar?.key) {
      await deleteFile(group.avatar.key);
    }

    await generateDownloadUrl(key);

    const updatedGroup = await this.chatRepository.updateGroupAvatar(
      chatId,
      key,
    );

    if (!updatedGroup) {
      throw NotFound("Group not found");
    }

    return {
      avatar: updatedGroup.avatar,
    };
  }

  /** Returns a download URL for a group avatar. */
  async getGroupAvatarUrlService(chatId: string, userId: string) {
    const group = await this.chatRepository.findGroupByIdForUser(
      chatId,
      userId,
    );

    if (!group) {
      throw NotFound("Group not found");
    }

    if (!group.isGroup) {
      throw BadRequest("Not a group chat");
    }

    const avatarKey = group.avatar?.key;

    if (!avatarKey) {
      throw NotFound("Avatar not found");
    }

    return generateDownloadUrl(avatarKey);
  }

  /** Updates the group name. */
  async editGroupNameService(userId: string, chatId: string, newName: string) {
    if (!chatId || !newName) {
      throw BadRequest("Chat ID and new name are required");
    }

    if (newName.trim().length < 2) {
      throw BadRequest("Group name too short");
    }

    const group = await this.chatRepository.findGroupById(chatId);

    if (!group) {
      throw NotFound("Group not found");
    }

    if (!group.isGroup) {
      throw BadRequest("Not a group chat");
    }

    const isAdmin =
      group.admin.some((id) => id.toString() === userId) ||
      group.createdBy?.toString() === userId;

    if (!isAdmin) {
      throw Unauthorized();
    }

    const updatedGroup = await this.chatRepository.updateGroupName(
      chatId,
      newName,
    );

    if (!updatedGroup) {
      throw NotFound("Group not found");
    }

    return updatedGroup;
  }
}
