
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

