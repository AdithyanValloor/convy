/** Normalized message payload emitted over sockets to connected clients. */
export interface MessageSocketPayload {
  _id: string;
  chat: string;

  sender: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: {
      url?: string | null;
    };
  };

  content: string;
  edited: boolean;
  deleted: boolean;

  reactions: {
    emoji: string;
    user: {
      _id: string;
      username: string;
      displayName?: string;
      profilePicture?: {
        url?: string | null;
      };
    };
  }[];

  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
      displayName?: string;
    };
  } | null;

  linkPreview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    isLargeImage?: boolean;
  } | null;

  createdAt: string;
  updatedAt: string;
}
