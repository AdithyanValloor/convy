import { MessageDto } from "../../types/message.dto.js";
import { NetworkMessage, Timestamp } from "./message.grpc.client.js";

const timestampToDate = (
  timestamp: Timestamp | null | undefined,
): Date | undefined => {
  if (!timestamp) {
    return undefined;
  }

  const seconds = Number(timestamp.seconds);

  return new Date(
    seconds * 1000 +
      timestamp.nanos / 1_000_000,
  );
};

export const networkMessageToDto = (
  message: NetworkMessage,
): MessageDto => {
  return {
    _id: message._id,

    chat: message.chat,
    sender: message.sender,

    content: message.content,

    edited: message.edited,
    deleted: message.deleted,

    deliveredTo: message.deliveredTo,
    seenBy: message.seenBy,
    mentions: message.mentions,

    replyTo: message.replyTo ?? null,

    forwarded: message.forwarded,
    forwardedFrom: message.forwardedFrom ?? null,

    reactions: message.reactions.map((reaction) => ({
      emoji: reaction.emoji,
      user: reaction.user,
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

    createdAt: timestampToDate(message.createdAt)!,
    updatedAt: timestampToDate(message.updatedAt)!,
  };
};