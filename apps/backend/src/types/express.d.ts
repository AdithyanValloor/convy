

/** Express type augmentation for authenticated request handling. */

import { JwtPayload } from "./auth.types.ts";

declare global {
  namespace Express {
    /** Adds the decoded authenticated user to Express requests. */
    interface Request {
      user: JwtPayload;
    }
  }
}

export {};
