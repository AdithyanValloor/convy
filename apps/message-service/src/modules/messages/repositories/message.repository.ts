import { FilterQuery, ProjectionType, SortOrder } from "mongoose";
import { IMessage } from "../models/message.model.js";
import { MessageFile } from "../types/message.types.js";

export interface IMessageRepository {
  findLatestIncomingMessage(
    chatId: string,
    userId: string,
  ): Promise<IMessage | null>;

  findLatestMessage(chatId: string): Promise<IMessage | null>;

  findMessages(
    filter: FilterQuery<IMessage>,
    sort: { createdAt: 1 | -1 },
    skip: number,
    limit: number,
  ): Promise<IMessage[]>;

  countMessages(filter: FilterQuery<IMessage>): Promise<number>;

  createMessage(data: {
    sender: string;
    content: string;
    file?: MessageFile;
    chat: string;
    deliveredTo: string[];
    replyTo?: string | null;
    linkPreview?: null;
    mentions: string[];
  }): Promise<IMessage>;

  findById(messageId: string): Promise<IMessage | null>;

  findByIds(messageIds: string[]): Promise<IMessage[]>;

  createForwardedMessage(data: {
    chat: string;
    sender: string;
    content?: string;
    file?: {
      key: string;
    };
    deliveredTo: string[];
    forwardedFrom: string;
    linkPreview: unknown;
  }): Promise<IMessage>;

  toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<IMessage | null>;

  markMessagesAsSeen(chatId: string, userId: string): Promise<void>;

  countUnseenMessages(chatId: string, userId: string): Promise<number>;

  editMessage(messageId: string, content: string): Promise<IMessage | null>;

  deleteMessage(messageId: string): Promise<IMessage | null>;

  deleteMessageByChatId(chatId: string): Promise<void>;

  searchMessages(
    filter: FilterQuery<IMessage>,
    projection: ProjectionType<IMessage>,
    sort: Record<string, SortOrder | { $meta: "textScore" }>,
    skip: number,
    limit: number,
  ): Promise<IMessage[]>;
}
