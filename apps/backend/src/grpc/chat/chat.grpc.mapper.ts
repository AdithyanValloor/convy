import { ChatDto } from "../../types/chat.dto.js";
import { NetworkChat, Timestamp } from "./chat.grpc.client.js";

const timestampToDate = (
  timestamp: Timestamp | null | undefined,
): Date | undefined => {
  if (!timestamp) {
    return undefined;
  }

  const seconds = Number(timestamp.seconds);

  return new Date(seconds * 1000 + timestamp.nanos / 1_000_000);
};

export const networkChatToDto = (chat: NetworkChat): ChatDto => {
  return {
    _id: chat._id,
    members: chat.members,
    isGroup: chat.isGroup,
    chatName: chat.chatName,

    avatar: chat.avatar
      ? {
          key: chat.avatar.key ?? null,
        }
      : undefined,

    lastMessage: chat.lastMessage,
    admin: chat.admin,
    createdBy: chat.createdBy,

    isDeleted: chat.isDeleted,
    deletedAt: timestampToDate(chat.deletedAt),
    deletedBy: chat.deletedBy,

    createdAt: timestampToDate(chat.createdAt)!,
    updatedAt: timestampToDate(chat.updatedAt)!,

    requestPending: chat.requestPending,
    requestInitiator: chat.requestInitiator,
  };
};