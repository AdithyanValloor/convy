import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "./AppError.js";

/**
 * Global Express error handler.
 * Normalizes known app errors and falls back to a generic 500 response.
 */

export const errorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    req.log.warn(
      {
        event: "request_error",
        errorName: err.name,
        statusCode: err.statusCode,
      },
      err.message,
    );

    res.status(err.statusCode).json({
      message: err.message,
    });

    return;
  }

  req.log.error(
    {
      event: "unhandled_error",
      error: {
        name: err instanceof Error ? err.name : "UnknownError",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      statusCode: 500,
    },
    "Unhandled server error",
  );

  res.status(500).json({
    message: "Internal server error",
  });
};
