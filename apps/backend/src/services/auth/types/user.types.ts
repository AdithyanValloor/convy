/** User identity type helpers shared across authenticated flows. */

/** Represents the decoded user data attached after token verification. */

// export interface JwtPayload {
//   id: string;
//   email: string;
// }

export interface AccessTokenPayload {
  authUserId: string;
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  authUserId: string;
  email: string;
}
