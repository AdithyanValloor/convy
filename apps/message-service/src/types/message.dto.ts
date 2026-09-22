import { IMessage } from "../modules/messages/models/message.model.js";

export interface MessageDto {
  _id: string;

  chat: string;
  sender: string;

  content?: string;

  edited: boolean;
  deleted: boolean;

  deliveredTo: string[];
  seenBy: string[];
  mentions: string[];

  replyTo?: string | null;

  forwarded: boolean;
  forwardedFrom?: string | null;

  reactions: {
    emoji: string;
    user: string;
  }[];

  linkPreview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    isLargeImage?: boolean;
  };

  file?: {
    key: string;
    mimeType: string;
    size: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const toMessageDto = (message: IMessage): MessageDto => {
  return {
    _id: message._id.toString(),

    chat: message.chat.toString(),
    sender: message.sender.toString(),

    content: message.content,

    edited: message.edited,
    deleted: message.deleted,

    deliveredTo: message.deliveredTo.map((user) => user.toString()),
    seenBy: message.seenBy.map((user) => user.toString()),
    mentions: message.mentions.map((user) => user.toString()),

    replyTo: message.replyTo?.toString() ?? null,

    forwarded: message.forwarded,
    forwardedFrom: message.forwardedFrom?.toString() ?? null,

    reactions: message.reactions.map((reaction) => ({
      emoji: reaction.emoji,
      user: reaction.user.toString(),
    })),

    linkPreview: message.linkPreview
      ? {
          url: message.linkPreview.url,
          title: message.linkPreview.title,
          description: message.linkPreview.description,
          image: message.linkPreview.image,
          siteName: message.linkPreview.siteName,
          isLargeImage: message.linkPreview.isLargeImage,
        }
      : undefined,

    file: message.file
      ? {
          key: message.file.key,
          mimeType: message.file.mimeType,
          size: message.file.size,
        }
      : undefined,

    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};