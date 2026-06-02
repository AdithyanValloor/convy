import { NextFunction, Response } from "express";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import { UserModel } from "../models/user.model.js";
import { AuthRequest } from "../../auth/types/authRequest.js";

/** Returns the currently authenticated user. */
export const currentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();

    const user = await UserModel.findById(userId).select("-password");
    if (!user) throw Unauthorized("User no longer exists");

    res.status(200).json({
      message: "Current user fetched successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};