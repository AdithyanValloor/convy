import { Schema, Document, model, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  sender: Types.ObjectId;

  content?: string;

  edited: boolean;
  deleted: boolean;

  deliveredTo: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  mentions: Types.ObjectId[];

  replyTo?: Types.ObjectId | null;

  forwarded: boolean;
  forwardedFrom?: Types.ObjectId | null;

  reactions: {
    emoji: string;
    user: Types.ObjectId;
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

/** Message schema for chat content, delivery state, reactions, and attachments. */
const messageSchema: Schema<IMessage> = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },

    edited: {
      type: Boolean,
      default: false,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    forwarded: {
      type: Boolean,
      default: false,
    },

    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],

    linkPreview: {
      type: {
        url: String,
        title: String,
        description: String,
        image: String,
        siteName: String,
        isLargeImage: Boolean,
      },
      default: undefined,
    },

    file: {
      key: String,
      mimeType: String,
      size: Number,
    },
  },
  {
    timestamps: true,
  },
);

// Supports chat pagination and recent message loading.
messageSchema.index({ chat: 1, createdAt: -1 });
// Supports in-chat text search.
messageSchema.index({ chat: 1, content: "text" });
// Supports mention lookups and mention-based notifications.
messageSchema.index({ chat: 1, mentions: 1 });

export const Message = model<IMessage>("Message", messageSchema);
