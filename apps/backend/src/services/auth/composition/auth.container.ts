
import { PostgresAuthRepository } from "../repositories/postgres-auth.repository.js"
import { AuthService } from "../services/auth.service.js"

const repo = new PostgresAuthRepository()
export const authService = new AuthService(repo)