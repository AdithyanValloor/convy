import { NotFound } from "../../../utils/errors/httpErrors.js";
import { AuthUserModel } from "../models/auth.model.js";
import bcrypt from "bcrypt";

export const verifyPassword = async (userId: string, password: string) => {
  const user = await AuthUserModel.findById(userId).select("+hashedPassword");
  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  return isMatch;
};
