import { Document, model, Schema, Types } from "mongoose";

export interface IAuthUser extends Document {
  _id: Types.ObjectId;
  email: string;
  hashedPassword: string;
  createdAt: Date;
  updatedAt: Date;
}

const authUserSchema: Schema<IAuthUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

export const AuthUserModel = model<IAuthUser>("AuthUser", authUserSchema);
