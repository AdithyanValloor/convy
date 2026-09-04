import jwt from "jsonwebtoken";
import { AccessTokenPayload, RefreshTokenPayload } from "../types/user.types.js";
import { Unauthorized } from "../errors/httpErrors.js";

/**
 * JWT utilities.
 * Fails fast if required secrets are not configured.
 */

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined");
}

// Short-lived token for authenticated API requests.
export const generateAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

// Longer-lived token used to mint new access tokens.
export const generateRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw Unauthorized("Invalid access token payload");
  }

  return decoded as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET);

  if (typeof decoded === "string") {
    throw Unauthorized("Invalid refresh token payload");
  }

  return decoded as RefreshTokenPayload;
};
