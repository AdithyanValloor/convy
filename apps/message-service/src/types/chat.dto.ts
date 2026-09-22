import { IChat } from "../modules/chat/models/chat.model.js";

export interface ChatDto {
  _id: string;
  members: string[];
  isGroup: boolean;
  chatName?: string;
  avatar?: {
    key: string | null;
  };
  lastMessage?: string;
  admin: string[];
  createdBy?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  createdAt: Date;
  updatedAt: Date;

  requestPending: boolean;
  requestInitiator?: string;
}

export const toChatDto = (chat: IChat): ChatDto => {
  return {
    _id: chat._id.toString(),
    members: chat.members.map((member) => member.toString()),
    isGroup: chat.isGroup,
    chatName: chat.chatName,
    avatar: chat.avatar,
    lastMessage: chat.lastMessage?.toString(),
    admin: chat.admin.map((admin) => admin.toString()),
    createdBy: chat.createdBy?.toString(),

    isDeleted: chat.isDeleted,
    deletedAt: chat.deletedAt,
    deletedBy: chat.deletedBy?.toString(),

    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,

    requestPending: chat.requestPending,
    requestInitiator: chat.requestInitiator?.toString(),
  };
};