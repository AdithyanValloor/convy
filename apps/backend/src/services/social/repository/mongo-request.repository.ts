import { ClientSession } from "mongoose";
import { FriendRequestModel, IFriendRequest } from "../models/request.model.js";
import { IRequestRepository } from "./request.repository.js";

export class RequestRepository implements IRequestRepository {
  async findById(requestId: string): Promise<IFriendRequest | null> {
    return FriendRequestModel.findById(requestId);
  }

  async deleteRequestById(requestId: string): Promise<void> {
    await FriendRequestModel.findByIdAndDelete(requestId);
  }

  async createFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<IFriendRequest> {
    const request = await FriendRequestModel.create({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    return request.toObject();
  }

  async deletePendingRequestsBetweenUsers(
    userA: string,
    userB: string,
  ): Promise<void> {
    await FriendRequestModel.deleteMany({
      $or: [
        {
          from: userA,
          to: userB,
          status: "pending",
        },
        {
          from: userB,
          to: userA,
          status: "pending",
        },
      ],
    });
  }

  async findFriendRequestExists(
    fromUserId: string,
    toUserId: string,
  ): Promise<boolean> {
    const request = await FriendRequestModel.exists({
      $or: [
        {
          from: fromUserId,
          to: toUserId,
        },
        {
          from: toUserId,
          to: fromUserId,
        },
      ],
      status: "pending",
    });

    return !!request;
  }

  async findIncomingFriendRequests(userId: string): Promise<IFriendRequest[]> {
    return FriendRequestModel.find({
      to: userId,
      status: "pending",
    }).lean();
  }

  async findOutGoingFriendRequests(userId: string): Promise<IFriendRequest[]> {
    return FriendRequestModel.find({
      from: userId,
      status: "pending",
    }).lean();
  }

  async acceptFriendRequest(
    requestId: string,
    session: ClientSession,
  ): Promise<void> {
    await FriendRequestModel.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status: "accepted",
        },
      },
      { session },
    );
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await FriendRequestModel.findByIdAndUpdate(requestId, {
      $set: {
        status: "rejected",
      },
    });
  }
}
