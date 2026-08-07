import mongoose from "mongoose";
import { AuthUserModel, IAuthUser } from "../models/auth.model.js";
import { CreateAccountData, IAuthRepository } from "./auth.repository.js";
import { IUser, UserModel } from "../../user/models/user.model.js";

export class MongoAuthRepository implements IAuthRepository {
  async findById(userId: string): Promise<IAuthUser | null> {
    return await AuthUserModel.findById(userId);
  }

  async findByEmail(email: string): Promise<IAuthUser | null> {
    return await AuthUserModel.findOne({ email }).select("+hashedPassword");;
  }

  async emailExists(email: string) {
    return (
        await AuthUserModel.exists({ email })
    ) !== null;
}

  async isEmailTakenByAnotherUser(
    userId: string,
    email: string,
  ): Promise<boolean> {
    const taken = await AuthUserModel.findOne({
      email,
      _id: { $ne: userId },
    });

    return !!taken;
  }

  // TODO: Implement with user API.
  async createAccount(
    data: CreateAccountData,
  ): Promise<{ authUser: IAuthUser; profileUser: IUser }> {
    const session = await mongoose.startSession();

    let authUser: IAuthUser;
    let profileUser: IUser;

    try {
      session.startTransaction();

      const userId = new mongoose.Types.ObjectId();

      [authUser] = await AuthUserModel.create(
        [
          {
            _id: userId,
            email: data.email,
            hashedPassword: data.hashedPassword,
          },
        ],
        { session },
      );
      [profileUser] = await UserModel.create(
        [
          {
            _id: userId,
            username: data.username,
            displayName: data.displayName,
          },
        ],
        { session },
      );
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }

    if (!authUser || !profileUser) {
      throw new Error("Account creation failed");
    }

    return {
      authUser,
      profileUser,
    };
  }

  async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<IAuthUser | null> {
    const user = await AuthUserModel.findByIdAndUpdate(userId, {
      hashedPassword,
    });
    return user;
  }

  async updateEmail(userId: string, email: string): Promise<IAuthUser | null> {
    const user = await AuthUserModel.findByIdAndUpdate(
      userId,
      {
        email,
      },
      { new: true },
    );
    return user;
  }

  async findAuthUserForPasswordCheck(userId: string): Promise<IAuthUser | null> {
    return AuthUserModel.findById(userId).select("+hashedPassword");
  }
}
