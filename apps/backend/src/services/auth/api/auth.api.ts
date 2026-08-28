import { NotFound } from "../../../utils/errors/httpErrors.js";
import bcrypt from "bcrypt";
import { PostgresAuthRepository } from "../repositories/postgres-auth.repository.js";


const authRepository = new PostgresAuthRepository();

export const verifyPassword = async (userId: string, password: string) => {
  const user = await authRepository.findAuthUserForPasswordCheck(userId);
  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  return isMatch;
};

