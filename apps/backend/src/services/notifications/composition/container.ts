import { InboxNotificationRepository } from "../repositories/mongo-inboxNotification.repository.js";
import { InboxNotificationService } from "../services/inboxNotification.service.js";

export const inboxNotificationRepository = new InboxNotificationRepository();
export const inboxNotificationService = new InboxNotificationService(
  inboxNotificationRepository,
);
