import { Request, Response, NextFunction } from "express";
import { authCookieOptions } from "../../../config/cookies.js";
import { authService } from "../composition/auth.container.js";


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

    const session = await authService.authenticateSession( accessToken, refreshToken);

    if(session.newAccessToken){
      res.cookie("accessToken", session.newAccessToken, {
        ...authCookieOptions,
        maxAge: 15 * 60 * 1000,
      });
    }

    req.user = session.user;

    next();
  } catch (err) {
    next(err);
  }
};
