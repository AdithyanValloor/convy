export interface ChatUser {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: {
    key: string | null;
  };
}

export interface MessageFile {
  key: string;
  mimeType: string;
  size: number;
}

export interface Chat {
  _id: string;
  members: ChatUser[];
  isGroup: boolean;
  chatName: string;
  admin: ChatUser[];
  createdBy?: ChatUser;
  isPinned?: boolean;
  isArchived?: boolean;
  lastReadAt?: string | null;
  mutedUntil?: string | null;
  unreadCounts: Record<string, number>;
  lastMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
  clearedAt?: string | null;
  avatar?: { key: string } | null;
}

export interface ChatMessage {
  _id: string;
  chat: string;
  sender: string;
  content: string;
  edited: boolean;
  deleted: boolean;
  deliveredTo: string[];
  seenBy: string[];
  replyTo: string | null;
  reactions: MessageReaction[];
  file?: MessageFile | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  _id: string;
  emoji: string;
  user: string;
}
