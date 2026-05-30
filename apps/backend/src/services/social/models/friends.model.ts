import { Schema, Types, model } from "mongoose";

export interface IFriendship extends Document {
  user1: Types.ObjectId;
  user2: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });
friendshipSchema.index({ user1: 1, createdAt: -1 });
friendshipSchema.index({ user2: 1, createdAt: -1 });

export const FriendshipModel = model("friendship", friendshipSchema);
