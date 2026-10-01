import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../../src/services/auth.service.js";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("../../src/utils/jwt.js", () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("../../src/infra/grpc/user.grpc.client.js", () => ({
  createProfile: vi.fn(),
  findAuthUserIdByUserId: vi.fn(),
  findUserByAuthUserId: vi.fn(),
  userNameExists: vi.fn(),
}));

vi.mock("../../src/otp/otpStore.js", () => ({
  isVerified: vi.fn(),
  clearEmail: vi.fn(),
  markVerified: vi.fn(),
}));

vi.mock("../../src/utils/email.js", () => ({
  validateEmail: vi.fn(),
}));

vi.mock("../../src/services/otp.service.js", () => ({
  sendOtpToEmail: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

import bcrypt, { compare } from "bcrypt";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../src/utils/jwt.js";

import {
  createProfile,
  findAuthUserIdByUserId,
  findUserByAuthUserId,
  userNameExists,
} from "../../src/infra/grpc/user.grpc.client.js";
import {
  clearEmail,
  isVerified,
  markVerified,
} from "../../src/otp/otpStore.js";
import {
  sendOtpToEmail,
  verifyEmailOtp,
} from "../../src/services/otp.service.js";
import { validateEmail } from "../../src/utils/email.js";

describe("AuthService", () => {
  const authRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findAuthUserForPasswordCheck: vi.fn(),
    updatePassword: vi.fn(),
    emailExists: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    isEmailTakenByAnotherUser: vi.fn(),
    updateEmail: vi.fn(),
  };

  const service = new AuthService(authRepository as any);

  const authUser = {
    id: "auth-user-123",
    email: "test@gmail.com",
    hashedPassword: "hashed-password",
  };

  const profileUser = {
    id: "profile-user-123",
  };

  const testPayload = {
    id: "auth-user-123",
    userId: "user-123",
    email: "test@gmail.com",
    password: "password",
  };

  const refreshTokenPayload = {
    authUserId: "auth-user-123",
    email: "test@gmail.com",
  };

  const HASH_SALT = 10;

  const registerUserPayload = {
    displayName: "user",
    username: "user",
    email: "test@gmail.com",
    password: "password",
  };

  const profileError = new Error("User service returned no response");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login()", () => {
    it("login(): Missing email", async () => {
      await expect(service.loginUser("", testPayload.password)).rejects.toThrow(
        "Email and password required",
      );

      expect(authRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("login(): Invalid user", async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.loginUser(testPayload.email, testPayload.password),
      ).rejects.toThrow("Invalid email or password");

      expect(authRepository.findByEmail).toHaveBeenCalledWith(
        testPayload.email,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("login(): Wrong password", async () => {
      authRepository.findByEmail.mockResolvedValue(authUser);

      vi.mocked(bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.loginUser(testPayload.email, testPayload.password),
      ).rejects.toThrow("Invalid email or password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        testPayload.password,
        authUser.hashedPassword,
      );

      expect(findUserByAuthUserId).not.toHaveBeenCalled();
    });

    it("login(): Successful login", async () => {
      authRepository.findByEmail.mockResolvedValue(authUser);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);
      vi.mocked(findUserByAuthUserId as any).mockResolvedValue(profileUser);
      vi.mocked(generateAccessToken).mockReturnValue("access-token");
      vi.mocked(generateRefreshToken).mockReturnValue("refresh-token");

      const result = await service.loginUser(
        testPayload.email,
        testPayload.password,
      );

      expect(authRepository.findByEmail).toHaveBeenCalledWith(
        testPayload.email,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        testPayload.password,
        authUser.hashedPassword,
      );

      expect(findUserByAuthUserId).toHaveBeenCalledWith(authUser.id);

      expect(generateAccessToken).toHaveBeenCalled();

      expect(generateRefreshToken).toHaveBeenCalled();

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("refreshTokenFunction()", () => {
    it("refreshTokenFunction(): Missing token", async () => {
      await expect(service.refreshTokenFunction("")).rejects.toThrow(
        "Refresh token missing",
      );
    });

    it("refreshTokenFunction(): User not found", async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue(refreshTokenPayload);
      authRepository.findById.mockResolvedValue(null);

      await expect(
        service.refreshTokenFunction("refresh-token"),
      ).rejects.toThrow("User not found");

      expect(authRepository.findById).toHaveBeenCalledWith(
        refreshTokenPayload.authUserId,
      );

      expect(findUserByAuthUserId).not.toHaveBeenCalled();
    });

    it("refreshTokenFunction(): Successful refresh", async () => {
      vi.mocked(verifyRefreshToken).mockReturnValue(refreshTokenPayload);
      authRepository.findById.mockResolvedValue(authUser);
      vi.mocked(findUserByAuthUserId as any).mockResolvedValue(profileUser);

      await expect(service.refreshTokenFunction("token")).resolves.toEqual({
        accessToken: "access-token",
        user: profileUser,
      });

      expect(authRepository.findById).toHaveBeenCalledWith(
        refreshTokenPayload.authUserId,
      );

      expect(findUserByAuthUserId).toHaveBeenCalledWith(authUser.id);
    });
  });

  describe("changePassword()", () => {
    it("changePassword(): Missing password", async () => {
      await expect(
        service.changePassword("user-1", "currentPassword", ""),
      ).rejects.toThrow("New password must be at least 8 characters");
    });

    it("changePassword(): Password is too short", async () => {
      await expect(
        service.changePassword("user-1", "currentPassword", "short"),
      ).rejects.toThrow("New password must be at least 8 characters");
    });

    it("changePassword(): User not found", async () => {
      authRepository.findAuthUserForPasswordCheck.mockResolvedValue(null);
      vi.mocked(findAuthUserIdByUserId as any).mockResolvedValue(authUser.id);

      await expect(
        service.changePassword(
          testPayload.userId,
          testPayload.password,
          "new-password",
        ),
      ).rejects.toThrow("User not found");

      expect(authRepository.findAuthUserForPasswordCheck).toHaveBeenCalledWith(
        authUser.id,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("changePassword(): Current password is incorrect", async () => {
      authRepository.findAuthUserForPasswordCheck.mockResolvedValue(authUser);
      vi.mocked(findAuthUserIdByUserId as any).mockResolvedValue(authUser.id);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.changePassword(
          testPayload.userId,
          testPayload.password,
          "new-password",
        ),
      ).rejects.toThrow("Current password is incorrect");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        testPayload.password,
        authUser.hashedPassword,
      );

      expect(authRepository.findAuthUserForPasswordCheck).toHaveBeenCalledWith(
        authUser.id,
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("changePassword(): Successful password change", async () => {
      authRepository.findAuthUserForPasswordCheck.mockResolvedValue(authUser);
      vi.mocked(findAuthUserIdByUserId as any).mockResolvedValue(authUser.id);
      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);
      vi.mocked(bcrypt.hash as any).mockResolvedValue("updated-password");

      const result = await service.changePassword(
        testPayload.userId,
        testPayload.password,
        "new-password",
      );

      expect(result).toBeUndefined();

      expect(bcrypt.hash).toHaveBeenCalledWith("new-password", HASH_SALT);
      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        testPayload.userId,
        "updated-password",
      );
    });
  });

  describe("registerUser()", () => {
    it("registerUser(): Email is not verified", async () => {
      vi.mocked(isVerified).mockResolvedValue(false);

      await expect(
        service.registerUser(
          registerUserPayload.displayName,
          registerUserPayload.username,
          registerUserPayload.email,
          registerUserPayload.password,
        ),
      ).rejects.toThrow("Email not verified");

      expect(authRepository.emailExists).not.toHaveBeenCalled();
      expect(userNameExists).not.toHaveBeenCalled();
    });

    it("registerUser(): Missing fields", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);

      await expect(service.registerUser("", "", "", "")).rejects.toThrow(
        "Missing required fields",
      );

      expect(authRepository.emailExists).not.toHaveBeenCalled();
      expect(userNameExists).not.toHaveBeenCalled();
    });

    it("registerUser(): Email already registered", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);
      vi.mocked(authRepository.emailExists).mockResolvedValue(true);

      await expect(
        service.registerUser(
          registerUserPayload.displayName,
          registerUserPayload.username,
          registerUserPayload.email,
          registerUserPayload.password,
        ),
      ).rejects.toThrow("Email already registered");

      expect(userNameExists).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("registerUser(): Username already exists", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);
      vi.mocked(authRepository.emailExists).mockResolvedValue(false);
      vi.mocked(userNameExists).mockResolvedValue(true);

      await expect(
        service.registerUser(
          registerUserPayload.displayName,
          registerUserPayload.username,
          registerUserPayload.email,
          registerUserPayload.password,
        ),
      ).rejects.toThrow("Username already exists");

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(authRepository.create).not.toHaveBeenCalled();
    });

    it("registerUser(): Account creation failed", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);
      vi.mocked(authRepository.emailExists).mockResolvedValue(false);
      vi.mocked(userNameExists).mockResolvedValue(false);

      vi.mocked(bcrypt.hash as any).mockResolvedValue("hashed-password");

      vi.mocked(createProfile).mockRejectedValue(profileError);

      authRepository.create.mockResolvedValue(authUser);

      await expect(
        service.registerUser(
          registerUserPayload.displayName,
          registerUserPayload.username,
          registerUserPayload.email,
          registerUserPayload.password,
        ),
      ).rejects.toThrow("User service returned no response");

      expect(authRepository.deleteById).toHaveBeenCalledWith(
        expect.any(String),
      );
      expect(clearEmail).not.toHaveBeenCalled();
    });

    it("registerUser(): Successful account creation", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);
      vi.mocked(authRepository.emailExists).mockResolvedValue(false);
      vi.mocked(userNameExists).mockResolvedValue(false);

      vi.mocked(bcrypt.hash as any).mockResolvedValue("hashed-password");

      authRepository.create.mockResolvedValue(authUser);

      vi.mocked(createProfile as any).mockResolvedValue(profileUser);

      vi.mocked(generateAccessToken).mockReturnValue("access-token");

      vi.mocked(generateRefreshToken).mockReturnValue("refresh-token");

      const result = await service.registerUser(
        registerUserPayload.displayName,
        registerUserPayload.username,
        registerUserPayload.email,
        registerUserPayload.password,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        registerUserPayload.password,
        HASH_SALT,
      );

      expect(authRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          email: registerUserPayload.email,
          hashedPassword: "hashed-password",
        }),
      );

      expect(createProfile).toHaveBeenCalledWith({
        authUserId: expect.any(String),
        username: registerUserPayload.username,
        displayName: registerUserPayload.displayName,
      });

      expect(clearEmail).toHaveBeenCalledWith(registerUserPayload.email);

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });
  });

  describe("sendRegistrationOtp()", () => {
    it("sendRegistrationOtp(): Missing email", async () => {
      await expect(service.sendRegistrationOtp("")).rejects.toThrow(
        "Email is required",
      );

      expect(authRepository.emailExists).not.toHaveBeenCalled();
      expect(sendOtpToEmail).not.toHaveBeenCalled();
    });

    it("sendRegistrationOtp(): Email already registered", async () => {
      authRepository.emailExists.mockResolvedValue(true);

      await expect(
        service.sendRegistrationOtp("test@gmail.com"),
      ).rejects.toThrow("Email already registered");

      expect(sendOtpToEmail).not.toHaveBeenCalled();
    });

    it("sendRegistrationOtp(): Successful OTP request", async () => {
      authRepository.emailExists.mockResolvedValue(false);

      await service.sendRegistrationOtp("test@gmail.com");

      expect(authRepository.emailExists).toHaveBeenCalledWith("test@gmail.com");

      expect(sendOtpToEmail).toHaveBeenCalledWith("test@gmail.com");
    });
  });

  describe("sendForgotEmailOtp()", () => {
    it("sendForgotEmailOtp(): Missing email", async () => {
      await expect(service.sendForgotEmailOtp("")).rejects.toThrow(
        "Email is required",
      );

      expect(authRepository.emailExists).not.toHaveBeenCalled();
    });

    it("sendForgotEmailOtp(): Email does not exist", async () => {
      authRepository.emailExists.mockResolvedValue(false);

      await service.sendForgotEmailOtp("unknown@gmail.com");

      expect(sendOtpToEmail).not.toHaveBeenCalled();
    });

    it("sendForgotEmailOtp(): Successful OTP request", async () => {
      authRepository.emailExists.mockResolvedValue(true);

      await service.sendForgotEmailOtp("test@gmail.com");

      expect(sendOtpToEmail).toHaveBeenCalledWith("test@gmail.com");
    });
  });

  describe("verifyRegistrationOtp()", () => {
    it("verifyRegistrationOtp(): Missing email or OTP", async () => {
      await expect(service.verifyRegistrationOtp("", "")).rejects.toThrow(
        "Email and OTP are required",
      );

      expect(verifyEmailOtp).not.toHaveBeenCalled();
      expect(markVerified).not.toHaveBeenCalled();
    });

    it("verifyRegistrationOtp(): Successful verification", async () => {
      vi.mocked(verifyEmailOtp as any).mockReturnValue(undefined);

      await service.verifyRegistrationOtp("test@gmail.com", "123456");

      expect(verifyEmailOtp).toHaveBeenCalledWith("test@gmail.com", "123456");

      expect(markVerified).toHaveBeenCalledWith("test@gmail.com");
    });
  });

  describe("checkPassword()", () => {
    it("checkPassword(): User not found", async () => {
      authRepository.findAuthUserForPasswordCheck.mockResolvedValue(null);

      await expect(service.checkPassword("user-1", "password")).rejects.toThrow(
        "User not found",
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("checkPassword(): Incorrect password", async () => {
      authRepository.findAuthUserForPasswordCheck.mockResolvedValue(authUser);

      vi.mocked(bcrypt.compare as any).mockResolvedValue(false);

      const result = await service.checkPassword("user-1", "wrong-password");

      expect(result).toEqual({
        isMatch: false,
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong-password",
        authUser.hashedPassword,
      );
    });

    it("checkPassword(): Correct password", async () => {
      authRepository.findAuthUserForPasswordCheck.mockResolvedValue(authUser);

      vi.mocked(bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.checkPassword("user-1", "correct-password");

      expect(result).toEqual({
        isMatch: true,
      });
    });
  });

  describe("forgotPassword()", () => {
    it("forgotPassword(): Missing email", async () => {
      await expect(service.forgotPassword("", "new-password")).rejects.toThrow(
        "Email is required",
      );

      expect(isVerified).not.toHaveBeenCalled();
      expect(authRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("forgotPassword(): Email not verified", async () => {
      vi.mocked(isVerified).mockResolvedValue(false);

      await expect(
        service.forgotPassword("test@gmail.com", "new-password"),
      ).rejects.toThrow("Email not verified");

      expect(authRepository.findByEmail).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("forgotPassword(): User not found", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword("test@gmail.com", "new-password"),
      ).rejects.toThrow("User not found");

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("forgotPassword(): Successful password reset", async () => {
      vi.mocked(isVerified).mockResolvedValue(true);
      authRepository.findByEmail.mockResolvedValue(authUser);

      vi.mocked(bcrypt.hash as any).mockResolvedValue("new-hashed-password");

      await service.forgotPassword("test@gmail.com", "new-password");

      expect(bcrypt.hash).toHaveBeenCalledWith("new-password", HASH_SALT);

      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        authUser.id,
        "new-hashed-password",
      );

      expect(clearEmail).toHaveBeenCalledWith("test@gmail.com");
    });
  });

  describe("sendEmailChangeOtp()", () => {
    it("sendEmailChangeOtp(): User not found", async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(
        service.sendEmailChangeOtp("user-1", "new@gmail.com"),
      ).rejects.toThrow("User not found");

      expect(sendOtpToEmail).not.toHaveBeenCalled();
    });

    it("sendEmailChangeOtp(): Same email", async () => {
      authRepository.findById.mockResolvedValue(authUser);

      vi.mocked(validateEmail).mockReturnValue(authUser.email);

      await expect(
        service.sendEmailChangeOtp(authUser.id, authUser.email),
      ).rejects.toThrow("New email must differ from your current email");

      expect(sendOtpToEmail).not.toHaveBeenCalled();
    });

    it("sendEmailChangeOtp(): Email already used", async () => {
      authRepository.findById.mockResolvedValue(authUser);

      vi.mocked(validateEmail).mockReturnValue("other@gmail.com");

      authRepository.isEmailTakenByAnotherUser.mockResolvedValue(true);

      await expect(
        service.sendEmailChangeOtp(authUser.id, "other@gmail.com"),
      ).rejects.toThrow("Email is already registered to another account");

      expect(sendOtpToEmail).not.toHaveBeenCalled();
    });

    it("sendEmailChangeOtp(): Successful OTP request", async () => {
      authRepository.findById.mockResolvedValue(authUser);

      vi.mocked(validateEmail).mockReturnValue("new@gmail.com");

      authRepository.isEmailTakenByAnotherUser.mockResolvedValue(false);

      await service.sendEmailChangeOtp(authUser.id, "new@gmail.com");

      expect(sendOtpToEmail).toHaveBeenCalledWith("new@gmail.com");
    });
  });

  describe("verifyAndUpdateEmail()", () => {
    it("verifyAndUpdateEmail(): User validation fails", async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(
        service.verifyAndUpdateEmail("user-1", "new@gmail.com", "123456"),
      ).rejects.toThrow("User not found");

      expect(verifyEmailOtp).not.toHaveBeenCalled();
    });

    it("verifyAndUpdateEmail(): Missing OTP", async () => {
      authRepository.findById.mockResolvedValue(authUser);

      vi.mocked(validateEmail).mockReturnValue("new@gmail.com");

      authRepository.isEmailTakenByAnotherUser.mockResolvedValue(false);

      await expect(
        service.verifyAndUpdateEmail(authUser.id, "new@gmail.com", ""),
      ).rejects.toThrow("OTP is required");

      expect(verifyEmailOtp).not.toHaveBeenCalled();
    });

    it("verifyAndUpdateEmail(): Successful email update", async () => {
      authRepository.findById.mockResolvedValue(authUser);

      vi.mocked(validateEmail).mockReturnValue("new@gmail.com");

      authRepository.isEmailTakenByAnotherUser.mockResolvedValue(false);

      vi.mocked(verifyEmailOtp as any).mockReturnValue(undefined);

      authRepository.updateEmail.mockResolvedValue({
        ...authUser,
        email: "new@gmail.com",
      });

      const result = await service.verifyAndUpdateEmail(
        authUser.id,
        "new@gmail.com",
        "123456",
      );

      expect(verifyEmailOtp).toHaveBeenCalledWith("new@gmail.com", "123456");

      expect(authRepository.updateEmail).toHaveBeenCalledWith(
        authUser.id,
        "new@gmail.com",
      );

      expect(clearEmail).toHaveBeenCalledWith("new@gmail.com");

      expect(result).toEqual({
        ...authUser,
        email: "new@gmail.com",
      });
    });
  });

  describe("updateEmail()", () => {
    it("updateEmail(): User not found", async () => {
      authRepository.updateEmail.mockResolvedValue(null);

      await expect(
        service.updateEmail("user-1", "new@gmail.com"),
      ).rejects.toThrow("User not found");
    });

    it("updateEmail(): Successful email update", async () => {
      const updatedUser = {
        ...authUser,
        email: "new@gmail.com",
      };

      authRepository.updateEmail.mockResolvedValue(updatedUser);

      const result = await service.updateEmail(authUser.id, "new@gmail.com");

      expect(authRepository.updateEmail).toHaveBeenCalledWith(
        authUser.id,
        "new@gmail.com",
      );

      expect(result).toEqual(updatedUser);
    });
  });
});
