import { Request, Response, NextFunction } from "express";
import { BadRequest, Unauthorized } from "../../../utils/errors/httpErrors.js";
import { UserModel } from "../models/user.model.js";
import { authCookieOptions } from "../../../config/cookies.js";
import { checkPassword } from "../services/user.service.js";
import {
  loginUser,
  registerUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  refreshTokenFunction,
} from "../../auth/auth.service.js";

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

    await sendRegistrationOtp(email);

    res.status(200).json({ message: `OTP sent to ${email}` });
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

    await verifyRegistrationOtp(email, otp);

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

    const { accessToken, refreshToken, safeUser } = await registerUser(
      displayName,
      username,
      email,
      password,
    );

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: safeUser });
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

    const { accessToken, refreshToken, safeUser } = await loginUser(
      email,
      password,
    );

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user: safeUser });
  } catch (err) {
    next(err);
  }
};

/** Clears the active auth cookies for the current session. */
export const logout = (_req: Request, res: Response) => {
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
    const { accessToken, user } = await refreshTokenFunction(token);

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

/** Returns the currently authenticated user. */
export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const user = await UserModel.findById(userId).select("-password");
    if (!user) throw Unauthorized("User no longer exists");

    res.status(200).json({
      message: "Current user fetched successfully",
      user,
    });
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
    const { isMatch } = await checkPassword(userId, password);

    res.status(200).json({ success: true, isMatch });
  } catch (err) {
    next(err);
  }
};
