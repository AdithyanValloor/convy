import { JwtPayload } from "../services/auth/types/user.types.js";

/** Express type augmentation for authenticated request handling. */

declare global {
  namespace Express {
    /** Adds the decoded authenticated user to Express requests. */
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
