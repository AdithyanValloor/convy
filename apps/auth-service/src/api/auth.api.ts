
import bcrypt from "bcrypt";
import { PostgresAuthRepository } from "../repositories/postgres-auth.repository.js";
import { NotFound } from "../errors/httpErrors.js";


const authRepository = new PostgresAuthRepository();

export const verifyPassword = async (userId: string, password: string) => {
  const user = await authRepository.findAuthUserForPasswordCheck(userId);
  if (!user) throw NotFound("User not found");

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  return isMatch;
};

