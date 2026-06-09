import { UserModel } from "../../user/models/user.model.js";

export const getFriends = async (friendIds: string[]) => {
  const friends = await UserModel.find(
    {
      _id: { $in: friendIds },
    },
    "displayName username profilePicture",
  ).lean();

  return friends;
};

export const findUserById = async (id: string) => {
  const user = await UserModel.findById(id);
  return user;
};

export const findUserByName = async (username: string) => {
  const user = await UserModel.findOne({ username });
  return user;
};
