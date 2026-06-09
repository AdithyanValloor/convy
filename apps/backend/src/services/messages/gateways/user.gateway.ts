import { UserModel } from "../../user/models/user.model.js";

export const getPrivacySettings = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .select("privacy");

  return user?.privacy;
};

export const canSeeReadReceipts = async (
  userId: string,
) => {
  const user = await UserModel.findById(userId)
    .select("privacy.readReceipts");

  return user?.privacy.readReceipts ?? false;
};