import { Chat, IChat } from "../models/chat.model.js";
import { IChatRepository } from "./chat.repository.js";

export class ChatRepository implements IChatRepository {
  async ensureChatExists(user1: string, user2: string): Promise<IChat> {
    const existing = await Chat.findOne({
      isGroup: false,
      members: { $all: [user1, user2], $size: 2 },
    }).lean();

    if (existing) {
      return existing;
    }

    const chat = await Chat.create({
      isGroup: false,
      members: [user1, user2],
    });

    return chat.toObject();
  }

  async findById(id: string): Promise<IChat | null> {
    return Chat.findById(id).lean();
  }

  async findByIdForUser(chatId: string, userId: string): Promise<IChat | null> {
    return Chat.findOne({
      _id: chatId,
      members: userId,
    }).lean();
  }

  async findByIdsForUser(chatIds: string[], userId: string): Promise<IChat[]> {
    return Chat.find({
      _id: { $in: chatIds },
      members: userId,
    }).lean();
  }

  async canJoinChat(chatId: string, userId: string): Promise<IChat | null> {
    return Chat.findOne({
      _id: chatId,
      members: userId,
      isDeleted: false,
    })
      .select("_id")
      .lean();
  }

  async findUserChatIds(userId: string): Promise<IChat[]> {
    return Chat.find({
      members: userId,
    })
      .select("_id")
      .lean();
  }

  async updateLastMessage(
    chatId: string,
    messageId: string,
  ): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: messageId,
      },
      {
        new: true,
      },
    ).lean();
  }

  async findPendingDirectChat(
    user1: string,
    user2: string,
  ): Promise<IChat | null> {
    return Chat.findOne({
      isGroup: false,
      members: { $all: [user1, user2], $size: 2 },
      requestPending: true,
    }).lean();
  }

  async acceptPendingDirectChat(
    user1: string,
    user2: string,
  ): Promise<IChat | null> {
    const chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [user1, user2], $size: 2 },
      requestPending: true,
    });

    if (!chat) {
      return null;
    }

    chat.requestPending = false;

    await chat.save();

    return chat.toObject();
  }

  async deletePendingDirectChat(
    user1: string,
    user2: string,
    initiator: string,
  ): Promise<IChat | null> {
    return Chat.findOneAndDelete({
      isGroup: false,
      members: { $all: [user1, user2], $size: 2 },
      requestPending: true,
      requestInitiator: initiator,
    }).lean();
  }

  async findChatsForUser(userId: string): Promise<IChat[]> {
    return Chat.find({
      members: userId,
      isDeleted: { $ne: true },
    }).lean();
  }

  async findDirectChat(user1: string, user2: string): Promise<IChat | null> {
    return Chat.findOne({
      isGroup: false,
      members: { $all: [user1, user2], $size: 2 },
    }).lean();
  }

  async createPendingDirectChat(
    userId: string,
    currentUserId: string,
  ): Promise<IChat> {
    const chat = await Chat.create({
      isGroup: false,
      members: [userId, currentUserId],
      requestPending: true,
      requestInitiator: currentUserId,
    });

    return chat.toObject();
  }

  async createDirectChat(
    userId: string,
    currentUserId: string,
  ): Promise<IChat> {
    const chat = await Chat.create({
      chatName: "sender",
      isGroup: false,
      members: [userId, currentUserId],
    });

    return chat.toObject();
  }

  async removeMemberFromChat(chatId: string, userId: string): Promise<void> {
    await Chat.findByIdAndUpdate(chatId, {
      $pull: {
        members: userId,
      },
    });
  }

  //---- GROUP

  async findGroupById(chatId: string): Promise<IChat | null> {
    return Chat.findOne({
      _id: chatId,
      isGroup: true,
    }).lean();
  }

  async findGroupByIdForUser(
    chatId: string,
    userId: string,
  ): Promise<IChat | null> {
    return Chat.findOne({
      _id: chatId,
      isGroup: true,
      members: userId,
    }).lean();
  }

  async createGroup(data: {
    name: string;
    members: string[];
    creatorId: string;
  }): Promise<IChat> {
    const chat = await Chat.create({
      chatName: data.name,
      members: data.members,
      isGroup: true,
      admin: [data.creatorId],
      createdBy: data.creatorId,
    });

    return chat.toObject();
  }

  async addMembers(chatId: string, memberIds: string[]): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        $addToSet: {
          members: {
            $each: memberIds,
          },
        },
      },
      {
        new: true,
      },
    ).lean();
  }

  async removeMember(chatId: string, memberId: string): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: {
          members: memberId,
          admin: memberId,
        },
      },
      {
        new: true,
      },
    ).lean();
  }

  async toggleAdmin(
    chatId: string,
    memberId: string,
    makeAdmin: boolean,
  ): Promise<IChat | null> {
    const update = makeAdmin
      ? {
          $addToSet: {
            admin: memberId,
          },
        }
      : {
          $pull: {
            admin: memberId,
          },
        };

    return Chat.findByIdAndUpdate(chatId, update, {
      new: true,
    }).lean();
  }

  async leaveGroup(chatId: string, userId: string): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: {
          members: userId,
          admin: userId,
        },
      },
      {
        new: true,
      },
    ).lean();
  }

  async softDeleteGroup(chatId: string, userId: string): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
      {
        new: true,
      },
    ).lean();
  }

  async transferOwnership(
    chatId: string,
    newOwnerId: string,
  ): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        createdBy: newOwnerId,
        $addToSet: {
          admin: newOwnerId,
        },
      },
      {
        new: true,
      },
    ).lean();
  }

  async updateGroupAvatar(chatId: string, key: string): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        "avatar.key": key,
      },
      {
        new: true,
      },
    ).lean();
  }

  async deleteGroupAvatar(chatId: string): Promise<void> {
    await Chat.findByIdAndUpdate(
      chatId,
      {
        "avatar.key": null,
      },
      {
        new: true,
      },
    );
  }

  async updateGroupName(chatId: string, name: string): Promise<IChat | null> {
    return Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: name,
      },
      {
        new: true,
      },
    ).lean();
  }
}
