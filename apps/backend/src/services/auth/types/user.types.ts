/** User identity type helpers shared across authenticated flows. */

/** Represents the decoded user data attached after token verification. */
export interface JwtPayload {
  id: string;
  email: string;
}