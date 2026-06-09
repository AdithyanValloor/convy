import { UserModel } from "../../user/models/user.model.js";

export const findUserById = async (id: string) => {
  const user = await UserModel.findById(id);
  return user;
};