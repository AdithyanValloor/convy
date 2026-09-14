import { Types } from "mongoose";
import { UserDTO } from "../../../types/user.dto.js";

interface Group {
  members: UserDTO[];
  admin: UserDTO[];
  _id: Types.ObjectId;
  isGroup: boolean;
  chatName?: string;
  avatar?: {
    key: string | null;
  };
  lastMessage?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt: Date;
  deletedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  requestPending: boolean;
  requestInitiator: Types.ObjectId;
}

export interface NormalizedGroup {
  members: UserDTO[];
  admin: UserDTO[];
  _id: string;
  isGroup: boolean;
  chatName?: string;
  avatar?: {
    key: string | null;
  };
  lastMessage?: string;
  createdBy?: string;
  isDeleted: boolean;
  deletedAt: Date;
  deletedBy: string;
  createdAt: Date;
  updatedAt: Date;
  requestPending: boolean;
  requestInitiator: string;
}

export function normalizeGroup(group: Group): NormalizedGroup {
  return {
    ...group,
    _id: group._id.toString(),
    lastMessage: group.lastMessage?.toString(),
    createdBy: group.createdBy?.toString(),
    deletedBy: group.deletedBy?.toString(),
    requestInitiator: group.requestInitiator?.toString(),
  };
}