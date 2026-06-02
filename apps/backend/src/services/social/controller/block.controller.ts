import { Request, Response, NextFunction } from "express";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  blockUser,
  getBlockedByUsers,
  getBlockedUsers,
  unblockUser,
} from "../service/block.service.js";
import {
  emitUserBlocked,
  emitUserUnblocked,
} from "../../../socket/emitters/block.emitter.js";

/** Block controller handlers for authenticated block and unblock actions. */

/** Returns users blocked by the current user. */
export const getBlockedUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const blockedUsers = await getBlockedUsers(userId);

    res.status(200).json({ blockedUsers });
  } catch (err) {
    next(err);
  }
};

/** Returns user IDs that have blocked the current user. */
export const getBlockedByUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const blockedByUserIds = await getBlockedByUsers(userId);

    res.json({ blockedByUserIds });
  } catch (err) {
    next(err);
  }
};

/** Blocks a target user and emits the block event when it is newly created. */
export const blockUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { targetUserId } = req.params as Record<string, string>;
    const result = await blockUser(userId, targetUserId);

    if (!result?.alreadyBlocked) {
      emitUserBlocked(userId, targetUserId);
    }

    res.status(200).json({
      message: "User blocked successfully",
      blockedUser: result.blockedUser,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/** Unblocks a target user and emits the unblock event when a block existed. */
export const unblockUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { targetUserId } = req.params as Record<string, string>;
    const result = await unblockUser(userId, targetUserId);

    if (!result?.notBlocked) {
      emitUserUnblocked(targetUserId, userId);
    }

    res.status(200).json({
      message: "User unblocked successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
