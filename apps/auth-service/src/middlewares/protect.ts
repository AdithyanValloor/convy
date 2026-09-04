import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const accessToken = req.cookies?.accessToken;

    const decoded = verifyAccessToken(accessToken);

    req.user = {
      ...decoded,
      id: decoded.userId,
    };

    next();
  } catch (err) {
    next(err);
  }
}
