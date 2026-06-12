import { NextFunction, Response, Request } from "express";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import { UserModel } from "../models/user.model.js";
import { getCachedUser, setCachedUser } from "../cache/user.cache.js";

/** Returns the currently authenticated user. */
export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const cached = await getCachedUser(userId);

    if (cached) {
      return res.status(200).json({
        message: "Current user fetched successfully",
        user: cached,
      });
    }

    const user = await UserModel.findById(userId).lean();
    if (!user) throw Unauthorized("User no longer exists");
    await setCachedUser(userId, user);

    res.status(200).json({
      message: "Current user fetched successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};
