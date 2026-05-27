/**
 * Notification-related socket emitters.
 * Uses userId-based rooms for targeted notification updates.
 */

import { getIO } from "../io.js";
import { InboxNotificationSocketPayload } from "../../services/notifications/types/notification.socket.js";

export const emitInboxNotification = (
  userId: string,
  payload: InboxNotificationSocketPayload,
) => {
  getIO().to(userId).emit("inbox_notification", payload);
};

export const emitNotificationRemoved = (
  userId: string,
  friendRequestId: string,
) => {
  // Clients remove the notification associated with this friend request.
  getIO().to(userId).emit("notification_removed", {
    friendRequestId,
  });
};

export const emitUnreadNotificationCount = (
  userId: string, 
  count: number
) => {
  getIO().to(userId).emit("notification_unread_count", { count });
};
