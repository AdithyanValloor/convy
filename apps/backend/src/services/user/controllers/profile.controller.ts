import { Response, Request, NextFunction } from "express";
import { Unauthorized, BadRequest } from "../../../utils/errors/httpErrors.js";
import { PROFILE_KEY_REGEX } from "../constants/regex.js";
import { userProfileService } from "../composition/user.container.js";

/** Profile controller handlers for authenticated profile actions. */

interface EditProfileBody {
  displayName?: string;
  username?: string;
  pronouns?: string;
  bio?: string;
  status?: string;
}

/** Returns the authenticated user's profile. */
export const viewProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await userProfileService.getProfileByUserId(userId);

    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

/** Updates editable profile fields for the authenticated user. */
export const editProfile = async (
  req: Request<{}, {}, EditProfileBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!Object.keys(req.body).length) {
      throw BadRequest("No fields provided to update");
    }

    const updatedProfile = await userProfileService.updateProfileByUserId(
      userId,
      req.body,
    );

    res.status(200).json(updatedProfile);
  } catch (err) {
    next(err);
  }
};

/** Attaches a validated profile picture key to the authenticated user. */
export const updateProfilePicture = async (
  req: Request<{}, {}, { key: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    const { key } = req.body;

    if (!key) {
      throw BadRequest("Key required");
    }

    if (!PROFILE_KEY_REGEX.test(key) || !key.startsWith(`profile/${userId}/`)) {
      throw Unauthorized();
    }

    const updated = await userProfileService.updateProfilePictureByUserId(
      userId,
      key,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/** Returns a signed download URL for the authenticated user's profile picture. */
export const getProfilePictureDownloadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const { key } = req.query;
    const url = await userProfileService.getProfilePictureDownloadUrlService(
      key as string,
    );

    res.json({ url });
  } catch (err) {
    next(err);
  }
};

/** Updates the authenticated user's username. */
export const updateUsernameController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { username } = req.body;
    const updatedUser = await userProfileService.updateUsername(
      userId,
      username,
    );

    res.status(200).json({
      success: true,
      message: "Username updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
