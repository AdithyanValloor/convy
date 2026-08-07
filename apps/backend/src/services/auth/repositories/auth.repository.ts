import { IUser } from "../../user/models/user.model.js";
import {  IAuthUser } from "../models/auth.model.js";

export interface CreateAccountData {
  email: string;
  username: string;
  displayName: string;
  hashedPassword: string;
}

export interface IAuthRepository {
  findById(userId: string): Promise<IAuthUser | null>;
  findByEmail(email: string): Promise<IAuthUser | null>;
  emailExists(email: string): Promise<boolean>;
  isEmailTakenByAnotherUser(userId: string, email: string): Promise<boolean>;
  createAccount(data: CreateAccountData): Promise<{
    authUser: IAuthUser;
    profileUser: IUser;
  }>;
  updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<IAuthUser | null>;
  updateEmail(userId: string, email: string): Promise<IAuthUser | null>;
  findAuthUserForPasswordCheck(userId: string): Promise<IAuthUser | null>;
}

