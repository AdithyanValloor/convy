import { AppError } from "./AppError.js";

/** HTTP-specific AppError helpers. */

export const BadRequest = (msg: string) => new AppError(msg, 400);
export const Unauthorized = (msg = "Unauthorized") => new AppError(msg, 401);
export const Forbidden = (msg = "Forbidden") => new AppError(msg, 403);
export const NotFound = (msg = "Not found") => new AppError(msg, 404);
export const Conflict = (msg = "Conflict") => new AppError(msg, 409);
