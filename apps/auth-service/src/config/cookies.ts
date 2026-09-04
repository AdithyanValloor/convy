import type { CookieOptions } from "express";

/**
 * Shared cookie settings for auth-related cookies.
 *
 * In production we allow cross-site cookies (`SameSite=None`) so the frontend
 * can send auth cookies across origins, which also requires `secure: true`.
 * During local development we fall back to `SameSite=Lax` so cookies still
 * work over plain HTTP.
 */
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  // Keep the cookie available app-wide and ensure `clearCookie` uses
  // the same path when removing it.
  path: "/",
};