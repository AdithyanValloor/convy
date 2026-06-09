import { Types } from "mongoose";
import { FriendshipModel } from "../models/friends.model.js";
import { FriendRequestModel } from "../models/request.model.js";

export const friendCleanup = async (ids: Types.ObjectId[]) => {
  await FriendshipModel.deleteMany({
    $or: [{ user1: { $in: ids } }, { user2: { $in: ids } }],
  });
};

export const requestCleanup = async (ids: Types.ObjectId[]) => {
  await FriendRequestModel.deleteMany({
    $or: [{ from: { $in: ids } }, { to: { $in: ids } }],
  });
};
