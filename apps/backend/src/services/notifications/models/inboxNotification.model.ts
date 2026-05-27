import mongoose, { Schema, Types, Document } from "mongoose";

export type InboxNotificationType =
  | "mention"
  | "reply"
  | "friend_request_received"
  | "friend_request_accepted"
  | "group_added";

export interface IInboxNotification extends Document {
  user: Types.ObjectId;
  actor?: Types.ObjectId;

  type: InboxNotificationType;

  chat?: Types.ObjectId;
  message?: Types.ObjectId;
  friendRequest?: Types.ObjectId;
  group?: Types.ObjectId;

  read: boolean;

  createdAt: Date;
}

/** Inbox notification schema for mentions, replies, and social activity updates. */
const inboxNotificationSchema = new Schema<IInboxNotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: [
        "mention",
        "reply",
        "friend_request_received",
        "friend_request_accepted",
        "group_added",
      ],
      required: true,
    },

    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },

    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    friendRequest: {
      type: Schema.Types.ObjectId,
      ref: "FriendRequest",
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Supports notification inbox ordering by newest first per user.
inboxNotificationSchema.index({ user: 1, createdAt: -1 });

export const InboxNotificationModel = mongoose.model<IInboxNotification>(
  "InboxNotification",
  inboxNotificationSchema,
);
