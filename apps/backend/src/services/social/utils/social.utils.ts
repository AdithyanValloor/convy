import { FriendshipModel } from "../models/friends.model.js";

export const getFriendIds = async (userId: string) => {
  const friendships = await FriendshipModel.find({
    $or: [
      { user1: userId },
      { user2: userId },
    ],
  }).lean();

  return friendships.map((f) =>
    f.user1.toString() === userId
      ? f.user2.toString()
      : f.user1.toString(),
  );
};

export const normalizeFriendship = (
  userA: string,
  userB: string,
) => {
  return userA < userB
    ? [userA, userB]
    : [userB, userA];
};

export const areFriends = async (
  userA: string,
  userB: string,
) => {
  const [user1, user2] = normalizeFriendship(
    userA,
    userB,
  );

  return FriendshipModel.exists({
    user1,
    user2,
  });
};