import { FlattenMaps } from "mongoose";
import { NotFound } from "../../../utils/errors/httpErrors.js";
import {
  getCachedUser,
  invalidateUserCache,
  setCachedUser,
} from "../cache/user.cache.js";
import { IUser } from "../models/user.model.js";
import { MongoUserRepository } from "../repositories/mongo-user.repository.js";
import { UserDTO } from "../types/user.dto.js";

const userRepository = new MongoUserRepository();

export const normalizeUser = (user: FlattenMaps<IUser> | IUser): UserDTO => ({
  ...user,
  id: String(user._id),
});

export const createProfile = async (data: {
  authUserId: string;
  username: string;
  displayName: string;
}): Promise<UserDTO> => {
  const user = await userRepository.createProfile(data);

  return normalizeUser(user);
};

export const findUserByAuthUserId = async (
  authUserId: string,
): Promise<UserDTO> => {
  const user = await userRepository.findByAuthUserId(authUserId);
  if (!user) throw NotFound("User not found");

  const normalized = normalizeUser(user);

  await setCachedUser(user._id.toString(), normalized);

  return normalized;
};

export const findUserById = async (userId: string): Promise<UserDTO> => {
  const cached = await getCachedUser(userId);
  if (cached) return cached;

  const user = await userRepository.findById(userId);
  if (!user) throw NotFound("User not found");

  await setCachedUser(userId, normalizeUser(user));
  return normalizeUser(user);
};

export const findUserByName = async (
  username: string,
): Promise<UserDTO | null> => {
  const user = await userRepository.findByUsername(username);

  return user ? normalizeUser(user) : null;
};

export const fetchUsers = async (userIds: string[]): Promise<UserDTO[]> => {
  const users = await userRepository.findByIds(userIds);
  return users.map(normalizeUser);
};

export const userNameExists = async (username: string) => {
  const exists = await userRepository.usernameExists(username);
  return !!exists;
};

export const getUserPrivacy = async (userId: string) => {
  const user = await findUserById(userId);
  return user.privacy;
};

export const clearProfilePicture = async (userId: string, key: string) => {
  await userRepository.clearProfilePicture(userId, key);
  await invalidateUserCache(userId);
};
