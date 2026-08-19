import { ClientSession } from "mongoose";
import { FriendshipModel } from "../models/friends.model.js";
import { IFriendsRepository } from "./friends.repository.js";

export class FriendsRepository implements IFriendsRepository {
  async createFriendShip(
    user1: string,
    user2: string,
    session: ClientSession,
  ): Promise<void> {
    await FriendshipModel.create(
      [
        {
          user1,
          user2,
        },
      ],
      {
        session,
      },
    );
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await FriendshipModel.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .select("user1 user2")
      .lean();

    return friendships.map((friendship) =>
      friendship.user1.toString() === userId
        ? friendship.user2.toString()
        : friendship.user1.toString(),
    );
  }

  async findFriendship(user1: string, user2: string): Promise<boolean> {
    const friendship = await FriendshipModel.exists({
      user1,
      user2,
    });

    return !!friendship;
  }

  async deleteFriendship(user1: string, user2: string): Promise<void> {
    await FriendshipModel.deleteOne({
      user1,
      user2,
    });
  }
}
