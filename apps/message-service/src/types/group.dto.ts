import { UserDTO } from "./user.dto.js";

export interface GroupDTO  {
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