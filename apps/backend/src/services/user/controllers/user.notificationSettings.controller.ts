import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/authRequest.js";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../services/user.notificationSettings.service.js";

/** Notification settings controller handlers for authenticated user preferences. */

/** Returns notification settings for the authenticated user. */
export const getNotificationSettingsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const settings = await getNotificationSettings(userId);

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

/** Updates notification settings for the authenticated user. */
export const updateNotificationSettingsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const updates = req.body;
    const settings = await updateNotificationSettings(userId, updates);

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};
