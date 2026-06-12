import mongoose, { Document, Schema, Types, model } from "mongoose";
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  displayName: string;
  pronouns?: string | null;
  status?: string | null;
  bio: string | null;
  dateOfBirth?: Date | null;
  profilePicture: {
    key: string | null;
  };
  isBanned: boolean;
  isActive: boolean;
  banExpiry: Date | null;
  banType: "temporary" | "permanent" | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  scheduledDeletionAt: Date | null;
  deletionWarningEmailSentAt: Date | null;
  deactivatedAt: Date | null;
  privacy: {
    friendRequests: "everyone" | "friends" | "nobody";
    readReceipts: boolean;
    typingIndicators: boolean;
  };
  notificationSettings: {
    allNotifications: boolean;
    newMessages: boolean;
    mentions: boolean;
    replies: boolean;
    friendRequests: boolean;
    friendRequestAccepted: boolean;
    groupAdded: boolean;
  };
}

/** User schema for identity, profile data, account state, and preferences. */
const userSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 3,
    },
    displayName: {
      type: String,
    },
    pronouns: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    profilePicture: {
      key: {
        type: String,
        default: null,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    banType: {
      type: String,
      enum: ["temporary", "permanent"],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      // Optional for now while profile completion stays flexible.
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banExpiry: {
      type: Date,
      default: null,
    },
    scheduledDeletionAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletionWarningEmailSentAt: {
      type: Date,
      default: null,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    privacy: {
      friendRequests: {
        type: String,
        enum: ["everyone", "friends", "nobody"],
        default: "everyone",
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
      typingIndicators: {
        type: Boolean,
        default: true,
      },
    },
    notificationSettings: {
      allNotifications: {
        type: Boolean,
        default: true,
      },
      newMessages: {
        type: Boolean,
        default: true,
      },
      mentions: {
        type: Boolean,
        default: true,
      },
      replies: {
        type: Boolean,
        default: true,
      },
      friendRequests: {
        type: Boolean,
        default: true,
      },
      friendRequestAccepted: {
        type: Boolean,
        default: true,
      },
      groupAdded: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<IUser>("User", userSchema);
