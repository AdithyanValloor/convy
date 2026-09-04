import jwt from "jsonwebtoken";
import { Unauthorized } from "../errors/httpErrors.js";

/**
 * JWT utilities.
 * Fails fast if required secrets are not configured.
 */

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export interface AccessTokenPayload {
  authUserId: string;
  userId: string;
  email: string;
}

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined");
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw Unauthorized("Invalid access token payload");
  }

  return decoded as AccessTokenPayload;
};
