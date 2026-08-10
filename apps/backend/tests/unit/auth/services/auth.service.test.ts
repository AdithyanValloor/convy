import { describe, beforeEach, expect, it, vi, Mocked } from "vitest";

vi.mock("../../../../src/services/auth/utils/jwt.js", () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("../../../../src/services/auth/services/otp.service.js", () => ({
  sendOtpToEmail: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

vi.mock("../../../../src/services/auth/otp/otpStore.js", () => ({
  markVerified: vi.fn(),
  isVerified: vi.fn(),
  clearEmail: vi.fn(),
}));

vi.mock("../../../../src/services/user/api/user.api.js", () => ({
  userNameExists: vi.fn(),
  findUserById: vi.fn(),
}));

import bcrypt from "bcrypt";
import * as UserAPI from "../../../../src/services/user/api/user.api.js";
import {
  sendOtpToEmail,
  verifyEmailOtp,
} from "../../../../src/services/auth/services/otp.service.js";
import {
  markVerified,
  isVerified,
} from "../../../../src/services/auth/otp/otpStore.js";
import { AuthService } from "../../../../src/services/auth/services/auth.service.js";
import { createFakeAuthRepository } from "../../../helpers/auth/fake-auth.repository.js";
import type { IAuthRepository } from "../../../../src/services/auth/repositories/index.js";
import {
  BadRequest,
  Unauthorized,
} from "../../../../src/utils/errors/httpErrors.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../../src/services/auth/utils/jwt.js";

const mockedSendOtp = vi.mocked(sendOtpToEmail);
const mockedVerifyOtp = vi.mocked(verifyEmailOtp);
const mockedMarkVerified = vi.mocked(markVerified);
const mockedIsVerified = vi.mocked(isVerified);
const mockedVerifyRefreshToken = vi.mocked(verifyRefreshToken);
const mockedUserAPI = vi.mocked(UserAPI);

const mockedGenerateAccessToken = vi.mocked(generateAccessToken);
const mockedGenerateRefreshToken = vi.mocked(generateRefreshToken);

describe("AuthService", () => {
  let fakeAuthRepository: Mocked<IAuthRepository>;
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();

    fakeAuthRepository = createFakeAuthRepository();
    authService = new AuthService(fakeAuthRepository);
  });

  describe("sendRegistrationOtp", () => {
    it("throws if email already exists", async () => {
      fakeAuthRepository.emailExists.mockResolvedValue(true);

      await expect(
        authService.sendRegistrationOtp("john@example.com"),
      ).rejects.toThrow("Email already registered");
    });

    it("throws if email is missing", async () => {
      await expect(authService.sendRegistrationOtp("")).rejects.toThrow(
        "Email is required",
      );
    });

    it("sends otp to the email if valid", async () => {
      fakeAuthRepository.emailExists.mockResolvedValue(false);
      mockedSendOtp.mockResolvedValue(undefined);

      await authService.sendRegistrationOtp("john@example.com");

      expect(mockedSendOtp).toHaveBeenCalledTimes(1);
      expect(mockedSendOtp).toHaveBeenCalledWith("john@example.com");
    });
  });

  describe("verifyRegistrationOtp", () => {
    it("throws if email or otp is missing", async () => {
      await expect(authService.verifyRegistrationOtp("", "")).rejects.toThrow(
        "Email and OTP are required",
      );
    });

    it("throws if otp is invalid", async () => {
      mockedVerifyOtp.mockImplementation(() => {
        throw BadRequest("Invalid or expired OTP");
      });

      await expect(
        authService.verifyRegistrationOtp("john@example.com", "145785"),
      ).rejects.toThrow("Invalid or expired OTP");

      expect(mockedVerifyOtp).toHaveBeenCalledTimes(1);
      expect(mockedVerifyOtp).toHaveBeenCalledWith(
        "john@example.com",
        "145785",
      );

      expect(mockedMarkVerified).not.toHaveBeenCalled();
    });

    it("marks email as verified when otp is valid", async () => {
      mockedVerifyOtp.mockReturnValue(true);

      await authService.verifyRegistrationOtp("john@example.com", "145785");

      expect(mockedVerifyOtp).toHaveBeenCalledTimes(1);
      expect(mockedMarkVerified).toHaveBeenCalledWith("john@example.com");
    });
  });

  describe("registerUser", () => {
    it("throws if email is not verified", async () => {
      mockedIsVerified.mockResolvedValue(false);
      await expect(
        authService.registerUser(
          "john",
          "john1",
          "john@example.com",
          "pass1234",
        ),
      ).rejects.toThrow("Email not verified");

      expect(mockedIsVerified).toHaveBeenCalledOnce();
      expect(mockedIsVerified).toHaveBeenCalledWith("john@example.com");
    });

    it("throws if required fields are missing", async () => {
      mockedIsVerified.mockResolvedValue(true);
      await expect(authService.registerUser("", "", "", "")).rejects.toThrow(
        "Missing required fields",
      );
    });

    it("throws if email already exists", async () => {
      mockedIsVerified.mockResolvedValue(true);
      fakeAuthRepository.emailExists.mockResolvedValue(true);
      await expect(
        authService.registerUser(
          "John",
          "john123",
          "john@example.com",
          "password123",
        ),
      ).rejects.toThrow("Email already registered");

      expect(fakeAuthRepository.emailExists).toHaveBeenCalledWith(
        "john@example.com",
      );
    });

    it("throw if username already exists", async () => {
      mockedIsVerified.mockResolvedValue(true);
      fakeAuthRepository.emailExists.mockResolvedValue(false);
      mockedUserAPI.userNameExists.mockResolvedValue(true);

      await expect(
        authService.registerUser(
          "John",
          "john123",
          "john@example.com",
          "password123",
        ),
      ).rejects.toThrow("Username already exists");

      expect(mockedUserAPI.userNameExists).toHaveBeenCalledWith("john123");
    });
  });

  describe("login", () => {
    it("throws if email or password is missing", async () => {
      await expect(authService.loginUser("", "")).rejects.toThrow(
        "Email and password required",
      );
    });

    it("throws if email doesn't exist", async () => {
      fakeAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.loginUser("john@example.com", "password123"),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws if password is incorrect", async () => {
      const hashedPassword = await bcrypt.hash("correct-password", 10);

      fakeAuthRepository.findByEmail.mockResolvedValue({
        _id: "1",
        email: "john@example.com",
        hashedPassword,
      } as any);

      mockedUserAPI.findUserById.mockResolvedValue({
        _id: "1",
        username: "john",
        displayName: "John",
      } as any);

      await expect(
        authService.loginUser("john@example.com", "wrong-password"),
      ).rejects.toThrow("Invalid email or password");
    });

    it("returns tokens and user on successful login", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);

      const authUser = {
        _id: "1",
        email: "john@example.com",
        hashedPassword,
      };

      const profileUser = {
        _id: "1",
        username: "john",
        displayName: "John",
      };

      fakeAuthRepository.findByEmail.mockResolvedValue(authUser as any);

      mockedUserAPI.findUserById.mockResolvedValue(profileUser as any);

      mockedGenerateAccessToken.mockReturnValue("access-token");

      mockedGenerateRefreshToken.mockReturnValue("refresh-token");

      const result = await authService.loginUser(
        "john@example.com",
        "password123",
      );

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        safeUser: profileUser,
      });

      expect(fakeAuthRepository.findByEmail).toHaveBeenCalledWith(
        "john@example.com",
      );

      expect(mockedUserAPI.findUserById).toHaveBeenCalledWith("1");
    });
  });

  describe("refreshTokenFunction", () => {
    it("throws if refresh token is missing", async () => {
      await expect(authService.refreshTokenFunction("")).rejects.toThrow(
        "Refresh token missing",
      );
    });

    it("throws if refresh token is invalid", async () => {
      mockedVerifyRefreshToken.mockImplementation(() => {
        throw Unauthorized("Invalid refresh token payload");
      });

      await expect(
        authService.refreshTokenFunction("bad-token"),
      ).rejects.toThrow("Invalid refresh token payload");
    });

    it("throws if user is not found", async () => {
      mockedVerifyRefreshToken.mockReturnValue({
        id: "123",
      } as any);

      fakeAuthRepository.findById.mockResolvedValue(null);

      await expect(authService.refreshTokenFunction("token")).rejects.toThrow(
        "User not found",
      );

      expect(fakeAuthRepository.findById).toHaveBeenCalledWith("123");
    });

    it("returns a new access token", async () => {
      const authUser = {
        _id: "123",
        email: "john@example.com",
        username: "john",
        displayName: "John",
      };

      mockedVerifyRefreshToken.mockReturnValue({
        id: "123",
      } as any);

      fakeAuthRepository.findById.mockResolvedValue(authUser as any);

      mockedGenerateAccessToken.mockReturnValue("new-access-token");

      const result = await authService.refreshTokenFunction("token");

      expect(result).toEqual({
        accessToken: "new-access-token",
        user: authUser,
      });

      expect(mockedGenerateAccessToken).toHaveBeenCalledTimes(1);
      expect(fakeAuthRepository.findById).toHaveBeenCalledWith("123");
    });
  });

  describe("checkPassword", () => {
    it("throw if user is not found", async () => {
      fakeAuthRepository.findAuthUserForPasswordCheck.mockResolvedValue(null);
      await expect(authService.checkPassword("1", "pass1234")).rejects.toThrow(
        "User not found",
      );
    });

    it("throw if password doesn't match", async () => {
      const hashedPassword = await bcrypt.hash("correct-password", 10);

      fakeAuthRepository.findAuthUserForPasswordCheck.mockResolvedValue({
        _id: "1",
        hashedPassword,
      } as any);

      const result = await authService.checkPassword("1", "wrong-password");

      expect(result).toEqual({
        isMatch: false,
      });
    });

    it("password matched", async () => {
      const hashedPassword = await bcrypt.hash("correct-password", 10);

      fakeAuthRepository.findAuthUserForPasswordCheck.mockResolvedValue({
        _id: "1",
        hashedPassword,
      } as any);

      const result = await authService.checkPassword("1", "correct-password");

      expect(result).toEqual({
        isMatch: true,
      });
    });

    describe("changePassword", () => {
      it("throws if new password is too short", async () => {
        await expect(
          authService.changePassword("user-id", "current-password", "short"),
        ).rejects.toThrow("New password must be at least 8 characters");

        expect(
          fakeAuthRepository.findAuthUserForPasswordCheck,
        ).not.toHaveBeenCalled();
      });

      it("throws if user is not found", async () => {
        fakeAuthRepository.findAuthUserForPasswordCheck.mockResolvedValue(null);
        await expect(
          authService.changePassword("user-id", "current-password", "pass1234"),
        ).rejects.toThrow("User not found");
      });

      it("throws if current password is incorrect", async () => {
        const hashedPassword = await bcrypt.hash("correct-password", 10);

        fakeAuthRepository.findAuthUserForPasswordCheck.mockResolvedValue({
          _id: "1",
          hashedPassword,
        } as any);

        await expect(
          authService.changePassword("1", "wrong-password", "new-password123"),
        ).rejects.toThrow("Current password is incorrect");

        expect(fakeAuthRepository.updatePassword).not.toHaveBeenCalled();
      });

      it("updates the password successfully", async () => {
        const hashedPassword = await bcrypt.hash("correct-password", 10);

        fakeAuthRepository.findAuthUserForPasswordCheck.mockResolvedValue({
          _id: "1",
          hashedPassword,
        } as any);

        await authService.changePassword(
          "1",
          "correct-password",
          "new-password123",
        );

        expect(fakeAuthRepository.updatePassword).toHaveBeenCalledTimes(1);

        expect(fakeAuthRepository.updatePassword).toHaveBeenCalledWith(
          "1",
          expect.any(String),
        );
      });
    });
  });

  describe("sendEmailChangeOtp", () => {
    it("throws if user is not found", async () => {
      fakeAuthRepository.findById.mockResolvedValue(null);

      await expect(
        authService.sendEmailChangeOtp("1", "new@example.com"),
      ).rejects.toThrow("User not found");

      expect(mockedSendOtp).not.toHaveBeenCalled();
    });

    it("throws if new email is the same as current email", async () => {
      fakeAuthRepository.findById.mockResolvedValue({
        _id: "1",
        email: "john@example.com",
      } as any);

      await expect(
        authService.sendEmailChangeOtp("1", "john@example.com"),
      ).rejects.toThrow("New email must differ from your current email");

      expect(mockedSendOtp).not.toHaveBeenCalled();
    });

    it("throws if email is already registered", async () => {
      fakeAuthRepository.findById.mockResolvedValue({
        _id: "1",
        email: "old@example.com",
      } as any);

      fakeAuthRepository.isEmailTakenByAnotherUser.mockResolvedValue(true);

      await expect(
        authService.sendEmailChangeOtp("1", "new@example.com"),
      ).rejects.toThrow("Email is already registered to another account");

      expect(mockedSendOtp).not.toHaveBeenCalled();
    });

    it("sends otp to the new email", async () => {
      fakeAuthRepository.findById.mockResolvedValue({
        _id: "1",
        email: "old@example.com",
      } as any);

      fakeAuthRepository.isEmailTakenByAnotherUser.mockResolvedValue(false);

      mockedSendOtp.mockResolvedValue(undefined);

      await authService.sendEmailChangeOtp("1", "new@example.com");

      expect(fakeAuthRepository.findById).toHaveBeenCalledWith("1");

      expect(fakeAuthRepository.isEmailTakenByAnotherUser).toHaveBeenCalledWith(
        "1",
        "new@example.com",
      );

      expect(mockedSendOtp).toHaveBeenCalledWith("new@example.com");
    });
  });
});
