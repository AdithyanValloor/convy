import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors/AppError.js";

/**
 * Global Express error handler.
 * Normalizes known app errors and falls back to a generic 500 response.
 */
export const errorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // AppError instances are safe to expose to clients.
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
    });
    return;
  }

  console.error("[ErrorMiddleware] Unhandled error:", err);

  res.status(500).json({
    message: "Internal server error",
  });
};
