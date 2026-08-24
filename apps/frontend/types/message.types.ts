/**
 * Profile picture object
 */
export interface ProfilePicture {
  key: string | null;
}

/**
 * User info embedded inside messages
 */
export interface MessageUser {
  _id: string;
  username: string;
  displayName: string;
  profilePicture?: ProfilePicture;
}

/**
 * Chat info embedded inside message
 */
export interface MessageChat {
  _id: string;
  chatName?: string;
  isGroup: boolean;
}

/**
 * Reaction object
 */
export interface MessageReaction {
  emoji: string;
  user: MessageUser;
}

export interface LinkPreview {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  isLargeImage?: boolean;
}

/**
 * Core message type (REST + Socket compatible)
 */
export interface ChatMessage {
  _id: string;
  chat: string;
  sender: MessageUser;

  content: string;

  edited: boolean;
  deleted: boolean;

  deliveredTo: string[];
  seenBy: string[];

  replyTo: ChatMessage | null;
  reactions: MessageReaction[];
  linkPreview?: LinkPreview;

  file?: {
    key: string;
    mimeType: string;
    size: number;
  };

  createdAt: string;
  updatedAt: string;
}
