

/** Express type augmentation for authenticated request handling. */

export interface UserPaylod {
  authUserId: string;
  userId: string;
  email: string;
  id: string;
}

declare global {
  namespace Express {
    /** Adds the decoded authenticated user to Express requests. */
    interface Request {
      user: UserPaylod;
    }
  }
}

export {};
