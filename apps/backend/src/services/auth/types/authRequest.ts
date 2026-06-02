import { Request } from "express";
import { JwtPayload } from "./user.types.js";


/** User request typing helpers for authenticated Express handlers. */

/** Extends Express requests with the optional decoded authenticated user. */
export interface AuthRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user?: JwtPayload;
}
