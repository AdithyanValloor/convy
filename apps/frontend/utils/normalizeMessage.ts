import { ChatMessage } from "@/types/message.types";
import { MessageType } from "@/redux/features/messageSlice";
import { ChatMessage as ChatLastMessage } from "@/types/chat.types";
import { NewMessagePayload } from "@/types/socket.types";

export function normalizeSocketMessage(msg: NewMessagePayload): MessageType {
  return {
    _id: msg._id,
    chat: msg.chat,
    sender: {
      _id: msg.sender._id,
      username: msg.sender.username,
      displayName: msg.sender.displayName,
      profilePicture: { key: msg.sender.profilePicture?.key ?? null },
    },
    content: msg.content,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    edited: msg.edited,
    deleted: msg.deleted,
    deliveredTo: msg.deliveredTo,
    seenBy: msg.seenBy,
    linkPreview: msg.linkPreview,
    file: msg.file ? {
      key: msg.file?.key,
      mimeType: msg.file?.mimeType,
      size: msg.file?.size,
    } : undefined,
    replyTo: msg.replyTo
      ? {
          _id: msg.replyTo._id,
          content: msg.replyTo.content,
          sender: {
            _id: msg.replyTo.sender._id,
            username: msg.replyTo.sender.username,
            displayName: msg.replyTo.sender.displayName,
          },
        }
      : null,
    reactions: msg.reactions?.map((r) => ({
      emoji: r.emoji,
      user: {
        _id: r.user._id,
        username: r.user.username,
      },
    })),
  };
}

export function toChatLastMessage(msg: ChatMessage): ChatLastMessage {
  return {
    _id: msg._id,
    chat: msg.chat,
    sender: msg.sender._id,
    content: msg.content,
    edited: msg.edited,
    deleted: msg.deleted,
    deliveredTo: msg.deliveredTo,
    seenBy: msg.seenBy,
    replyTo: msg.replyTo?._id ?? null,
    reactions: msg.reactions.map((r) => ({
      _id: `${msg._id}-${r.user._id}`,
      emoji: r.emoji,
      user: r.user._id,
    })),
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
}
