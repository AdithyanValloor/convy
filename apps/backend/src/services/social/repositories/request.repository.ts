import { ClientSession } from "mongoose";
import { IFriendRequest } from "../models/request.model.js";

export interface IRequestRepository {
  findById(requestId: string): Promise<IFriendRequest | null>;

  deleteRequestById(requestId: string): Promise<void>;

  createFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<IFriendRequest>;

  deletePendingRequestsBetweenUsers(
    userA: string,
    userB: string,
  ): Promise<void>;

  findFriendRequestExists(
    fromUserId: string,
    toUserId: string,
  ): Promise<boolean>;

  findIncomingFriendRequests(userId: string): Promise<IFriendRequest[]>;

  findOutGoingFriendRequests(userId: string): Promise<IFriendRequest[]>;

  acceptFriendRequest(requestId: string, session: ClientSession): Promise<void>;

  rejectFriendRequest(requestId: string): Promise<void>;
}
