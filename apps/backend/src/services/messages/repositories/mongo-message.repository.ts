import mongoose, {
  FilterQuery,
  FlattenMaps,
  ProjectionType,
  SortOrder,
} from "mongoose";
import { Message, IMessage } from "../models/message.model.js";
import { IMessageRepository } from "./message.repository.js";
import { MessageFile } from "../types/message.types.js";

export class MessageRepository implements IMessageRepository {
  async findLatestIncomingMessage(
    chatId: string,
    userId: string,
  ): Promise<IMessage | null> {
    return Message.findOne({
      chat: chatId,
      deleted: false,
      sender: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();
  }

  async findLatestMessage(chatId: string): Promise<IMessage | null> {
    return Message.findOne({
      chat: chatId,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();
  }

  async findMessages(
    filter: FilterQuery<IMessage>,
    sort: { createdAt: 1 | -1 },
    skip: number,
    limit: number,
  ): Promise<IMessage[]> {
    return Message.find(filter).sort(sort).skip(skip).limit(limit);
  }

  async countMessages(filter: FilterQuery<IMessage>): Promise<number> {
    return Message.countDocuments(filter);
  }

  async createMessage(data: {
    sender: string;
    content: string;
    file?: MessageFile;
    chat: string;
    deliveredTo: string[];
    replyTo?: string | null;
    linkPreview?: null;
    mentions: string[];
  }): Promise<IMessage> {
    const message = await Message.create(data);
    return message.toObject();
  }

  async findById(messageId: string): Promise<IMessage | null> {
    return Message.findById(messageId).lean();
  }

  async findByIds(messageIds: string[]): Promise<IMessage[]> {
    return Message.find({
      _id: { $in: messageIds },
    }).lean<IMessage[]>();
  }

  async createForwardedMessage(data: {
    chat: string;
    sender: string;
    content?: string;
    deliveredTo: string[];
    forwardedFrom: string;
    linkPreview: unknown;
  }): Promise<IMessage> {
    return Message.create({
      ...data,
      forwarded: true,
    });
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<IMessage | null> {
    const message = await Message.findById(messageId);

    if (!message) {
      return null;
    }

    const existingReactionIndex = message.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId,
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = message.reactions[existingReactionIndex];

      if (existingReaction.emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        existingReaction.emoji = emoji;
      }
    } else {
      message.reactions.push({
        emoji,
        user: new mongoose.Types.ObjectId(userId),
      });
    }

    await message.save();

    return message.toObject() as IMessage;
  }

  async markMessagesAsSeen(chatId: string, userId: string): Promise<void> {
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        seenBy: { $ne: userId },
      },
      {
        $addToSet: {
          seenBy: userId,
        },
      },
    );

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        deliveredTo: userId,
      },
      {
        $pull: {
          deliveredTo: userId,
        },
      },
    );
  }

  async countUnseenMessages(chatId: string, userId: string): Promise<number> {
    return Message.countDocuments({
      chat: chatId,
      sender: { $ne: userId },
      seenBy: { $ne: userId },
    });
  }

  async editMessage(
    messageId: string,
    content: string,
  ): Promise<IMessage | null> {
    return Message.findByIdAndUpdate(
      messageId,
      {
        content,
        edited: true,
      },
      {
        new: true,
      },
    );
  }

  async deleteMessage(messageId: string): Promise<IMessage | null> {
    return Message.findByIdAndUpdate(
      messageId,
      {
        content: "This message was deleted",
        deleted: true,
        edited: false,
        replyTo: null,
        forwarded: false,
        forwardedFrom: null,
        reactions: [],
        linkPreview: undefined,
      },
      {
        new: true,
      },
    );
  }

  async deleteMessageByChatId(chatId: string): Promise<void> {
    await Message.deleteMany({ chat: chatId });
  }

  async searchMessages(
    filter: FilterQuery<IMessage>,
    projection: ProjectionType<IMessage>,
    sort: Record<string, SortOrder | { $meta: "textScore" }>,
    skip: number,
    limit: number,
  ): Promise<IMessage[]> {
    return Message.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }
}
