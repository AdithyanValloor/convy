import { Schema, model, Types } from "mongoose";

interface IBlock {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
  createdAt: Date;
}

/** Block schema for one-way user block relationships. */
const blockSchema = new Schema<IBlock>(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blocked: {
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

// Prevents duplicate block rows for the same blocker-target pair.
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const BlockModel = model<IBlock>("Block", blockSchema);
