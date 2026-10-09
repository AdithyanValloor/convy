import { Request, Response, NextFunction } from "express";

import { authService } from "../composition/auth.container.js";
import { BadRequest, Unauthorized } from "../errors/httpErrors.js";
import { authCookieOptions } from "../config/cookies.js";

/** Auth and account bootstrap controller handlers for user onboarding and sessions. */

interface RegisterBody {
  displayName?: string;
  username?: string;
  email?: string;
  password?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

/** Sends a registration OTP to the provided email address. */
export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    await authService.sendRegistrationOtp(email);

    req.log.info(
      { event: "registration_otp_requested" },
      "Registration OTP request processed",
    );

    res.status(200).json({ message: `OTP sent to ${email}` });
  } catch (err) {
    next(err);
  }
};

/** Sends a forgot password OTP to the provided email address. */
export const sendForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    await authService.sendForgotEmailOtp(email);

    req.log.info(
      { event: "password_reset_otp_requested" },
      "Password reset OTP request processed",
    );

    res.status(200).json({
      success: true,
      message: "If an account exists for that email, an OTP has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

/** Verifies a registration OTP for the provided email address. */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body;

    await authService.verifyRegistrationOtp(email, otp);

    req.log.info(
      { event: "registration_otp_verified" },
      "Registration OTP verified successfully",
    );

    res.status(200).json({ message: "Email verified" });
  } catch (err) {
    next(err);
  }
};

/** Registers a new user and sets access and refresh cookies. */
export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { displayName, username, email, password } = req.body;

    if (!displayName || !username || !email || !password) {
      throw BadRequest("Invalid request body");
    }

    const { accessToken, refreshToken } = await authService.registerUser(
      displayName,
      username,
      email,
      password,
    );

    req.log.info(
      { event: "user_registered" },
      "User registration completed successfully",
    );

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** Logs a user in and refreshes their auth cookies. */
export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw BadRequest("Email and password required");
    }

    const { accessToken, refreshToken } = await authService.loginUser(
      email,
      password,
    );

    req.log.info({ event: "login_success" }, "User authenticated successfully");

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** Clears the active auth cookies for the current session. */
export const logout = (req: Request, res: Response) => {
  req.log.info(
    {
      event: "user_logged_out",
      userId: req.user?.id,
    },
    "Logout processed",
  );

  res.clearCookie("refreshToken", authCookieOptions);
  res.clearCookie("accessToken", authCookieOptions);

  res.status(200).json({ message: "Logged out successfully" });
};

/** Exchanges a refresh token cookie for a new access token. */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.refreshToken;

    const { accessToken, user } = await authService.refreshTokenFunction(token);

    req.log.info(
      { event: "token_refreshed" },
      "Access token refreshed successfully",
    );

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

/** Checks whether the provided password matches the current user's password. */
export const checkPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const { password } = req.body;
    const { isMatch } = await authService.checkPassword(userId, password);

    req.log.info(
      { event: "password_check_completed", userId },
      "Password check completed",
    );

    res.status(200).json({ success: true, isMatch });
  } catch (err) {
    next(err);
  }
};

/** Sends an OTP to confirm an email change for the authenticated user. */
export const sendEmailChangeOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const { email } = req.body;

    await authService.sendEmailChangeOtp(userId, email);

    req.log.info(
      { event: "email_change_otp_requested", userId },
      "Email change OTP request processed",
    );

    res.status(200).json({
      success: true,
      message: "OTP sent",
    });
  } catch (err) {
    next(err);
  }
};

/** Verifies an email-change OTP and saves the new email address. */
export const updateEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const { email, otp } = req.body;

    const updatedUser = await authService.verifyAndUpdateEmail(
      userId,
      email,
      otp,
    );

    req.log.info(
      { event: "email_updated", userId },
      "Email updated successfully",
    );

    res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

/** Changes the authenticated user's password. */
export const changePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    req.log.info(
      { event: "password_changed", userId },
      "Password changed successfully",
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};

/** Changes the user's password through the forgot-password flow. */
export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    await authService.forgotPassword(email, newPassword);

    req.log.info(
      { event: "password_reset_completed" },
      "Password reset completed successfully",
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};
