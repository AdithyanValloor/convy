/** Base application error for operational failures. */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Excludes this constructor from the captured stack trace.
    Error.captureStackTrace(this, this.constructor);
  }
}
