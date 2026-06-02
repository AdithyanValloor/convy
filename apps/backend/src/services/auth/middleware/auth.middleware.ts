import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
} from "../../../utils/jwt.js";

import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import { authCookieOptions } from "../../../config/cookies.js";

const { TokenExpiredError } = jwt;

/**
 * Authentication guard middleware.
 * Verifies access tokens and refreshes expired sessions when possible.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Read both tokens up front so access-token expiry can fall back to refresh.
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      throw Unauthorized("Unauthenticated");
    }

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        req.user = decoded;

        return next();
      } catch (err) {
        // Only token expiry is allowed to continue into refresh flow.
        if (!(err instanceof TokenExpiredError)) {
          throw Unauthorized("Invalid access token");
        }
      }
    }

    if (!refreshToken) {
      throw Unauthorized("Session expired");
    }

    const decoded = verifyRefreshToken(refreshToken);

    // const user = await AuthUserModel.findById(decoded.id);
    // if (!user) {
    //   throw Unauthorized("Session invalid");
    // }

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
    });

    res.cookie("accessToken", newAccessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Continue the request with the refreshed user payload.
    req.user = decoded;

    next();
  } catch (err) {
    next(err);
  }
};
