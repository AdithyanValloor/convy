import { NotFound } from "../../../utils/errors/httpErrors.js";
import {
  getCachedUser,
  invalidateUserCache,
  setCachedUser,
} from "../cache/user.cache.js";
import { UserModel } from "../models/user.model.js";
import { UserDTO } from "../types/user.dto.js";

export const normalizeUser = (user: any): UserDTO => ({
  ...user,
  id: String(user._id),
});

export const findUserById = async (userId: string): Promise<UserDTO> => {
  const cached = await getCachedUser(userId);
  if (cached) return cached;

  const user = await UserModel.findById(userId).lean();
  if (!user) throw NotFound("User not found");

  await setCachedUser(userId, normalizeUser(user));
  return normalizeUser(user);
};

export const findUserByName = async (
  username: string,
): Promise<UserDTO | null> => {
  const user = await UserModel.findOne({ username }).lean();

  return user ? normalizeUser(user) : null;
};

export const fetchUsers = async (userIds: string[]): Promise<UserDTO[]> => {
  const users = await UserModel.find(
    {
      _id: { $in: userIds },
    },
    "displayName username profilePicture",
  ).lean();

  return users.map(normalizeUser);
};

export const userNameExists = async (username: string) => {
  const exists = await UserModel.exists({ username });
  return !!exists;
};

export const getUserPrivacy = async (userId: string) => {
  const user = await findUserById(userId);
  return user.privacy;
};

export const clearProfilePicture = async (userId: string, key: string) => {
  await UserModel.updateOne(
    {
      _id: userId,
      "profilePicture.key": key,
    },
    {
      $set: {
        "profilePicture.key": null,
      },
    },
  );

  await invalidateUserCache(userId);
};
