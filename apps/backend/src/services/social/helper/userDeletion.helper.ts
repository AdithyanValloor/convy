import { UserModel } from "../../user/models/user.model.js";

export const getExpiredDeletionUsers = async () => {
  const expiredAccounts = await UserModel.find({
    scheduledDeletionAt: { $lte: new Date() },
  }).select("_id");

  return expiredAccounts;
};
