import { vi, Mocked } from "vitest";
import type { IAuthRepository } from "../../../src/services/auth/repositories/index.js";

export function createFakeAuthRepository(): Mocked<IAuthRepository> {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    emailExists: vi.fn(),
    isEmailTakenByAnotherUser: vi.fn(),
    createAccount: vi.fn(),
    updatePassword: vi.fn(),
    updateEmail: vi.fn(),
    findAuthUserForPasswordCheck: vi.fn(),
  };
}