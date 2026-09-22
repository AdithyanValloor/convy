import { UserDTO } from "../services/user/types/user.dto.js";

export interface ChatDto {
  _id: string;
  members: string[];
  isGroup: boolean;
  chatName?: string;
  avatar?: {
    key: string | null;
  };
  lastMessage?: string;
  admin: string[];
  createdBy?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  createdAt: Date;
  updatedAt: Date;

  requestPending: boolean;
  requestInitiator?: string;
}

export interface ChatSocketResponseDTO {
  _id: string;
  members: UserDTO[];
  isGroup: boolean;
  chatName?: string;
  avatar?: {
    key: string | null;
  };
  lastMessage?: string;
  admin: UserDTO[];
  createdBy?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  createdAt: Date;
  updatedAt: Date;

  requestPending: boolean;
  requestInitiator?: string;
}
