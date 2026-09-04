import { IAuthUser } from "../models/auth.model.js";

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
  create(data: {
    id: string;
    email: string;
    hashedPassword: string;
  }): Promise<IAuthUser>;
  deleteById(userId: string): Promise<void>;
  updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<IAuthUser | null>;
  updateEmail(userId: string, email: string): Promise<IAuthUser | null>;
  findAuthUserForPasswordCheck(userId: string): Promise<IAuthUser | null>;
}
