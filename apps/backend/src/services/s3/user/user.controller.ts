import { NextFunction, Response } from "express";
import { AuthRequest } from "../../user/types/authRequest.js";
import {
  BadRequest,
  NotFound,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import { deleteFile, generateUploadUrl } from "../s3.service.js";
import { UserModel } from "../../user/models/user.model.js";
import { PROFILE_KEY_REGEX } from "../../user/constants/regex.js";

const MAX_PROFILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_PROFILE_TYPES = new Set(["image/png", "image/jpeg"]);

/** Returns a signed upload URL for a user's profile picture. */
export const uploadProfilePicture = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { fileType, fileSize } = req.body;

    if (
      typeof fileType !== "string" ||
      typeof fileSize !== "number" ||
      fileSize <= 0
    ) {
      throw BadRequest("Invalid input");
    }

    if (fileSize > MAX_PROFILE_SIZE) {
      throw BadRequest("File too large");
    }

    if (!ALLOWED_PROFILE_TYPES.has(fileType)) {
      throw BadRequest("Invalid profile image type");
    }

    const data = await generateUploadUrl(
      { type: "profile", userId },
      fileType,
      fileSize,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/** Deletes the current user's stored profile picture after key validation. */
export const deleteProfilePicture = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { key } = req.query;

    if (!key || typeof key !== "string") {
      throw BadRequest("Invalid key");
    }

    if (
      !PROFILE_KEY_REGEX.test(key) ||
      !key.startsWith(`profile/${userId}/`)
    ) {
      throw Unauthorized();
    }

    const user = await UserModel.findById(userId);

    if (!user) throw NotFound("User not found");

    try {
      await deleteFile(key);
    } catch (err) {
      return next(err);
    }

    if (user?.profilePicture?.key === key) {
      user.profilePicture = { key: null, url: null };
      await user.save();
    }

    res.json({
      message: "Profile picture deleted",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};
