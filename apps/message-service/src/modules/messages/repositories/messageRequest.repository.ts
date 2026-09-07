
import { IMessageRequest } from "../models/messageRequest.model.js";

export interface IMessageRequestRepository {
  findPendingRequest(
    from: string,
    to: string,
  ): Promise<IMessageRequest | null>;

  findPendingRequestsForUser(
    userId: string,
  ): Promise<IMessageRequest[]>;

  createRequest(data: {
    from: string;
    to: string;
    firstMessage: string;
  }): Promise<IMessageRequest>;

  dailyCount(userId: string): Promise<number>;

  findById(requestId: string): Promise<IMessageRequest | null>;

  acceptRequest(requestId: string): Promise<void>;

  rejectRequest(requestId: string): Promise<void>;
}