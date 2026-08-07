import { MongoAuthRepository } from "../auth/repositories/mongo-auth.repository.js";
import { AuthService } from "../auth/services/auth.service.js";

const repo = new MongoAuthRepository()
export const authService = new AuthService(repo)