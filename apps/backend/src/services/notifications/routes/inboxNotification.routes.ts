import { Router } from "express";
import {
  fetchInboxNotificationsController,
  markNotificationReadController,
  getUnreadNotificationCountController,
  markAllNotificationsReadController,
  deleteNotificationByFriendRequestController,
  deleteNotificationController,
  markMentionsReadController,
} from "../controllers/inboxNotification.controller.js";
import { protect } from "../../../utils/middleware/protect.js";

const router = Router();

/** Inbox notification routes for authenticated users. */

// Notification inbox retrieval and unread counters.
router.get("/", protect, fetchInboxNotificationsController);
router.get("/unread-count", protect, getUnreadNotificationCountController);

// Notification and mention read-state updates.
router.patch(
  "/chat/:chatId/read-mentions",
  protect,
  markMentionsReadController,
);
router.patch("/:id/read", protect, markNotificationReadController);
router.patch("/read-all", protect, markAllNotificationsReadController);

// Notification deletion routes.
router.delete(
  "/friend-request/:friendRequestId",
  protect,
  deleteNotificationByFriendRequestController,
);

router.delete("/:id", protect, deleteNotificationController);

export { router as inboxNotificationsRouter };
