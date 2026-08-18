import { UserDTO } from "../../user/types/user.dto.js";

/** Shared message route params and request body types. */

export interface MessageParams {
  chatId?: string;
  messageId?: string;
}

export interface MessageReqParams {
  requestId?: string;
}

export interface MessageFile {
  key: string;
  mimeType: string;
  size: number;
}

/** Payload used when creating a new message. */
export interface SendMessageBody {
  chatId: string;
  content?: string;
  replyTo?: string | null;
  mentionIds?: string[];
  file?: MessageFile;
}

export interface EditMessageBody {
  content: string;
}

export interface ReactionBody {
  emoji: string;
}

export interface ForwardMessageBody {
  messageId: string;
  targetChatIds: string[];
}

export interface MessageBody {
  chatId?: string;
  content?: string;
  replyTo?: string | null;
  emoji?: string;
  messageId?: string | null;
  targetChatIds?: string[];
  mentionIds?: string[];
  file?: MessageFile;
}

export interface MessageRequestDTO {
  from: UserDTO;
  to: UserDTO;
  status: "pending" | "accepted" | "rejected";
  firstMessage: string;
  createdAt: Date;
}
