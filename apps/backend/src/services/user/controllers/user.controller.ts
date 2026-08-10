import { NextFunction, Response, Request } from "express";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import { getCachedUser, setCachedUser } from "../cache/user.cache.js";
import { MongoUserRepository } from "../repositories/mongo-user.repository.js";

const userRepository = new MongoUserRepository();

/** Returns the currently authenticated user. */
export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const cached = await getCachedUser(userId);

    if (cached) {
      return res.status(200).json({
        message: "Current user fetched successfully",
        user: cached,
      });
    }

    const user = await userRepository.findById(userId);
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
