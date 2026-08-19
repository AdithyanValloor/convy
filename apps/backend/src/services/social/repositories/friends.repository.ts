import { ClientSession } from "mongoose";
import { IFriendship } from "../models/friends.model.js";

export interface IFriendsRepository {

  createFriendShip(user1: string, user2: string, session: ClientSession): Promise<void>;

  getFriendIds(userId: string): Promise<string[]>;

  findFriendship(user1: string, user2: string): Promise<boolean>;

  deleteFriendship(user1: string, user2: string): Promise<void>;
}
