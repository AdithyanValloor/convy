import { friendsRespository } from "../composition/container.js";

export const normalizeFriendship = (userA: string, userB: string) => {
  return userA < userB ? [userA, userB] : [userB, userA];
};

export const areFriendsCheck = async (userA: string, userB: string) => {
  const [user1, user2] = normalizeFriendship(userA, userB);

  return friendsRespository.findFriendship(user1, user2);
};
