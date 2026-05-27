import { Request, Response, NextFunction } from "express";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  getInboxNotifications,
  markNotificationRead,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  deleteNotification,
  deleteNotificationByFriendRequest,
  markMentionsReadForChat,
} from "../services/inboxNotification.service.js";

/** Inbox notification controller handlers for authenticated notification actions. */

/** Returns paginated inbox notifications for the current user. */
export const fetchInboxNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const page = Number(req.query.page) || 1;
    const result = await getInboxNotifications(userId, page);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Marks a single inbox notification as read for the current user. */
export const markNotificationReadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const notification = await markNotificationRead(
      req.params.id as string,
      userId,
    );

    res.json(notification);
  } catch (err) {
    next(err);
  }
};

/** Returns the unread inbox notification count for the current user. */
export const getUnreadNotificationCountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const result = await getUnreadNotificationCount(userId);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Marks all inbox notifications as read for the current user. */
export const markAllNotificationsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const result = await markAllNotificationsRead(userId);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Deletes a single inbox notification owned by the current user. */
export const deleteNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const notificationId = req.params.id as string;
    if (!notificationId) throw new Error("Notification ID is required");
    const result = await deleteNotification(notificationId, userId);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/** Deletes the inbox notification associated with a friend request. */
export const deleteNotificationByFriendRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { friendRequestId } = req.params as Record<string, string>;
    const result = await deleteNotificationByFriendRequest(friendRequestId);

    if (!result) {
      res.status(404).json({
        message: "Notification not found",
      });
      return;
    }

    res.json({
      success: true,
      notificationId: result.notificationId,
    });
  } catch (err) {
    next(err);
  }
};

/** Marks mention notifications as read for a specific chat. */
export const markMentionsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { chatId } = req.params as Record<string, string>;
    if (!chatId) throw new Error("Chat ID is required");

    await markMentionsReadForChat(userId, chatId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
