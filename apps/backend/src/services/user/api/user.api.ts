import { NotFound } from "../../../utils/errors/httpErrors.js";
import { getCachedUser, setCachedUser } from "../cache/user.cache.js";
import { UserModel } from "../models/user.model.js";

export const findUserById = async (userId: string) => {
  const cached = await getCachedUser(userId);
  if (cached) return cached;

  const user = await UserModel.findById(userId).lean();
  if (!user) throw NotFound("User not found");

  await setCachedUser(userId, user);
  return user;
};

export const findUserByName = async (username: string) => {
  const user = await UserModel.findOne({ username }).lean();
  return user;
};

export const fetchUsers = async (userIds: string[]) => {
  const users = await UserModel.find(
    {
      _id: { $in: userIds },
    },
    "displayName username profilePicture",
  ).lean();

  return users;
};

export const userNameExists = async (username: string) => {
  const exists = await UserModel.exists({ username });
  return !!exists;
};

export const getUserPrivacy = async (userId: string) => {
  const user = await findUserById(userId);
  return user.privacy;
};
