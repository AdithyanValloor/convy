import { Schema, model, Types } from "mongoose";

export interface IChatUserState {
  userId: Types.ObjectId;
  chatId: Types.ObjectId;
  isArchived: boolean;
  isPinned: boolean;
  clearedAt?: Date | null;
  lastReadAt?: Date | null;
  mutedUntil?: Date | null;
}

/** Per-user chat state such as archive, pin, read, clear, and mute metadata. */
const chatUserStateSchema = new Schema<IChatUserState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    clearedAt: {
      type: Date,
      default: null,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Ensures each user has a single state record per chat.
chatUserStateSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export const ChatUserState = model<IChatUserState>(
  "ChatUserState",
  chatUserStateSchema,
);
