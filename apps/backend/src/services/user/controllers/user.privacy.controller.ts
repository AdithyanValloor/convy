import { Response, NextFunction, Request } from "express";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import { emitPrivacyUpdated } from "../../../socket/emitters/privacy.emitter.js";
import { userPrivacyService } from "../composition/user.container.js";

/** Privacy controller handlers for authenticated user privacy preferences. */

/** Returns privacy settings for the authenticated user. */
export const getPrivacyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const privacy = await userPrivacyService.getPrivacySettings(userId);

    res.status(200).json({ success: true, data: privacy });
  } catch (err) {
    next(err);
  }
};

/** Updates privacy settings and emits the change for the authenticated user. */
export const updatePrivacyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const updates = req.body;
    const privacy = await userPrivacyService.updatePrivacySettings(userId, updates);

    emitPrivacyUpdated(userId);

    res.status(200).json({ success: true, data: privacy });
  } catch (err) {
    next(err);
  }
};
