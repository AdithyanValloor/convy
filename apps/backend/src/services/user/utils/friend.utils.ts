import { UserModel } from "../models/user.model.js";

/** Friend utility helpers for relationship checks. */

/** Returns whether two users are already connected as friends. */
export const areFriends = async (
  userA: string,
  userB: string,
): Promise<boolean> => {
  const user = await UserModel.findOne({
    _id: userA,
    friendList: userB,
  });

  return !!user;
};
