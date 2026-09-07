import { FlattenMaps } from "mongoose";
import {
  IMessageRequest,
  MessageRequestModel,
} from "../models/messageRequest.model.js";
import { IMessageRequestRepository } from "./messageRequest.repository.js";

export class MessageRequestRepository implements IMessageRequestRepository {
  async findPendingRequest(
    from: string,
    to: string,
  ): Promise<FlattenMaps<IMessageRequest> | null> {
    return MessageRequestModel.findOne({
      from,
      to,
      status: "pending",
    }).lean();
  }

  async findPendingRequestsForUser(
    userId: string,
  ): Promise<FlattenMaps<IMessageRequest>[]> {
    return MessageRequestModel.find({
      status: "pending",
      to: userId,
    }).lean();
  }

  async createRequest(data: {
    from: string;
    to: string;
    firstMessage: string;
  }): Promise<FlattenMaps<IMessageRequest>> {
    const request = await MessageRequestModel.create(data);

    return request.toObject();
  }

  async dailyCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return MessageRequestModel.countDocuments({
      from: userId,
      createdAt: { $gte: startOfDay },
    });
  }

  async findById(requestId: string): Promise<IMessageRequest | null> {
    return MessageRequestModel.findById(requestId);
  }

  async acceptRequest(requestId: string): Promise<void> {
    await MessageRequestModel.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status: "accepted",
        },
      },
      { new: true },
    ).lean();
  }

  async rejectRequest(requestId: string): Promise<void> {
    await MessageRequestModel.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true },
    ).lean();
  }
}
