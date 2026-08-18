import mongoose, { Schema, Types } from "mongoose";

export interface IMessageRequest {
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  firstMessage: string;
  createdAt: Date;
}

/** Message request schema for gated direct-message requests between users. */
const messageRequestSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstMessage: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Keeps only one pending request active per sender-recipient pair.
messageRequestSchema.index(
  { from: 1, to: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

// Supports inbox and sent-request lookups by status.
messageRequestSchema.index({ to: 1, status: 1 });
messageRequestSchema.index({ from: 1, status: 1 });

export const MessageRequestModel = mongoose.model<IMessageRequest>(
  "MessageRequest",
  messageRequestSchema,
);
