import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  sendOtp,
  sendForgotPasswordOtp,
  verifyOtp,
  register,
  login,
  logout,
  refreshToken,
  checkPasswordController,
  sendEmailChangeOtpController,
  updateEmailController,
  changePasswordController,
  forgotPasswordController,
} from "../../src/controllers/auth.controller.js";

import { authService } from "../../src/composition/auth.container.js";

vi.mock("../../src/composition/auth.container.js", () => ({
  authService: {
    sendRegistrationOtp: vi.fn(),
    sendForgotEmailOtp: vi.fn(),
    verifyRegistrationOtp: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    refreshTokenFunction: vi.fn(),
    checkPassword: vi.fn(),
    sendEmailChangeOtp: vi.fn(),
    verifyAndUpdateEmail: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
  },
}));

describe("Auth Controller", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      cookies: {},
      user: undefined,
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  describe("sendOtp()", () => {
    it("should send registration OTP successfully", async () => {
      req.body = {
        email: "test@gmail.com",
      };

      vi.mocked(authService.sendRegistrationOtp).mockResolvedValue();

      await sendOtp(req, res, next);

      expect(authService.sendRegistrationOtp).toHaveBeenCalledWith(
        "test@gmail.com",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "OTP sent to test@gmail.com",
      });

      expect(next).not.toHaveBeenCalled();
    });

    it("should pass service error to next()", async () => {
      req.body = {
        email: "test@gmail.com",
      };

      const error = new Error("Email already registered");

      vi.mocked(authService.sendRegistrationOtp).mockRejectedValue(error);

      await sendOtp(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("sendForgotPasswordOtp()", () => {
    it("should send forgot-password OTP successfully", async () => {
      req.body = {
        email: "test@gmail.com",
      };

      vi.mocked(authService.sendForgotEmailOtp).mockResolvedValue();

      await sendForgotPasswordOtp(req, res, next);

      expect(authService.sendForgotEmailOtp).toHaveBeenCalledWith(
        "test@gmail.com",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          "If an account exists for that email, an OTP has been sent.",
      });
    });
  });

  describe("verifyOtp()", () => {
    it("should verify registration OTP successfully", async () => {
      req.body = {
        email: "test@gmail.com",
        otp: "123456",
      };

      vi.mocked(authService.verifyRegistrationOtp).mockResolvedValue();

      await verifyOtp(req, res, next);

      expect(authService.verifyRegistrationOtp).toHaveBeenCalledWith(
        "test@gmail.com",
        "123456",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified",
      });
    });

    it("should pass verification error to next()", async () => {
      req.body = {
        email: "test@gmail.com",
        otp: "123456",
      };

      const error = new Error("Invalid or expired OTP");

      vi.mocked(authService.verifyRegistrationOtp).mockRejectedValue(error);

      await verifyOtp(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("register()", () => {
    it("should reject missing required fields", async () => {
      req.body = {
        displayName: "",
        username: "",
        email: "",
        password: "",
      };

      await register(req, res, next);

      expect(authService.registerUser).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });

    it("should register user and set authentication cookies", async () => {
      req.body = {
        displayName: "Test User",
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
      };

      vi.mocked(authService.registerUser).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await register(req, res, next);

      expect(authService.registerUser).toHaveBeenCalledWith(
        "Test User",
        "testuser",
        "test@gmail.com",
        "password123",
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        "access-token",
        expect.objectContaining({
          maxAge: 15 * 60 * 1000,
        }),
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.objectContaining({
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
      });
    });

    it("should pass registration error to next()", async () => {
      req.body = {
        displayName: "Test User",
        username: "testuser",
        email: "test@gmail.com",
        password: "password123",
      };

      const error = new Error("Registration failed");

      vi.mocked(authService.registerUser).mockRejectedValue(error);

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("login()", () => {
    it("should reject missing credentials", async () => {
      req.body = {
        email: "",
        password: "",
      };

      await login(req, res, next);

      expect(authService.loginUser).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });

    it("should login user and set authentication cookies", async () => {
      req.body = {
        email: "test@gmail.com",
        password: "password123",
      };

      vi.mocked(authService.loginUser).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      await login(req, res, next);

      expect(authService.loginUser).toHaveBeenCalledWith(
        "test@gmail.com",
        "password123",
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        "access-token",
        expect.objectContaining({
          maxAge: 15 * 60 * 1000,
        }),
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.objectContaining({
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
      });
    });

    it("should pass login error to next()", async () => {
      req.body = {
        email: "test@gmail.com",
        password: "wrong-password",
      };

      const error = new Error("Invalid email or password");

      vi.mocked(authService.loginUser).mockRejectedValue(error);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("logout()", () => {
    it("should clear authentication cookies", () => {
      logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.any(Object),
      );

      expect(res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        expect.any(Object),
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });
  });

  describe("refreshToken()", () => {
    it("should refresh access token successfully", async () => {
      req.cookies.refreshToken = "refresh-token";

      const user = {
        id: "user-1",
        username: "testuser",
      };

      vi.mocked(authService.refreshTokenFunction).mockResolvedValue({
        accessToken: "new-access-token",
        user: user as any,
      });

      await refreshToken(req, res, next);

      expect(authService.refreshTokenFunction).toHaveBeenCalledWith(
        "refresh-token",
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken",
        "new-access-token",
        expect.objectContaining({
          maxAge: 15 * 60 * 1000,
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        user,
      });
    });

    it("should pass refresh error to next()", async () => {
      req.cookies.refreshToken = "invalid-token";

      const error = new Error("Invalid refresh token");

      vi.mocked(authService.refreshTokenFunction).mockRejectedValue(error);

      await refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("checkPasswordController()", () => {
    it("should reject request when user is missing", async () => {
      req.user = undefined;

      await checkPasswordController(req, res, next);

      expect(authService.checkPassword).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });

    it("should check password successfully", async () => {
      req.user = {
        id: "user-1",
      };

      req.body = {
        password: "password123",
      };

      vi.mocked(authService.checkPassword).mockResolvedValue({
        isMatch: true,
      });

      await checkPasswordController(req, res, next);

      expect(authService.checkPassword).toHaveBeenCalledWith(
        "user-1",
        "password123",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isMatch: true,
      });
    });
  });

  describe("sendEmailChangeOtpController()", () => {
    it("should reject request when user is missing", async () => {
      req.user = undefined;

      await sendEmailChangeOtpController(req, res, next);

      expect(authService.sendEmailChangeOtp).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });

    it("should send email change OTP successfully", async () => {
      req.user = {
        id: "user-1",
      };

      req.body = {
        email: "new@gmail.com",
      };

      vi.mocked(authService.sendEmailChangeOtp).mockResolvedValue();

      await sendEmailChangeOtpController(req, res, next);

      expect(authService.sendEmailChangeOtp).toHaveBeenCalledWith(
        "user-1",
        "new@gmail.com",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OTP sent",
      });
    });
  });

  describe("updateEmailController()", () => {
    it("should reject request when user is missing", async () => {
      req.user = undefined;

      await updateEmailController(req, res, next);

      expect(authService.verifyAndUpdateEmail).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });

    it("should update email successfully", async () => {
      req.user = {
        id: "user-1",
      };

      req.body = {
        email: "new@gmail.com",
        otp: "123456",
      };

      const updatedUser = {
        id: "user-1",
        email: "new@gmail.com",
      };

      vi.mocked(authService.verifyAndUpdateEmail).mockResolvedValue(
        updatedUser as any,
      );

      await updateEmailController(req, res, next);

      expect(authService.verifyAndUpdateEmail).toHaveBeenCalledWith(
        "user-1",
        "new@gmail.com",
        "123456",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Email updated successfully.",
        data: updatedUser,
      });
    });
  });

  describe("changePasswordController()", () => {
    it("should reject request when user is missing", async () => {
      req.user = undefined;

      await changePasswordController(req, res, next);

      expect(authService.changePassword).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalled();
    });

    it("should change password successfully", async () => {
      req.user = {
        id: "user-1",
      };

      req.body = {
        currentPassword: "old-password",
        newPassword: "new-password123",
      };

      vi.mocked(authService.changePassword).mockResolvedValue();

      await changePasswordController(req, res, next);

      expect(authService.changePassword).toHaveBeenCalledWith(
        "user-1",
        "old-password",
        "new-password123",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Password changed successfully",
      });
    });
  });

  describe("forgotPasswordController()", () => {
    it("should reset password successfully", async () => {
      req.body = {
        email: "test@gmail.com",
        newPassword: "new-password123",
      };

      vi.mocked(authService.forgotPassword).mockResolvedValue();

      await forgotPasswordController(req, res, next);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        "test@gmail.com",
        "new-password123",
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Password changed successfully",
      });
    });
  });
});

