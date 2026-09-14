import {
  NotificationNotifyGroupAddedEvent,
  NotificationNotifyMentionEvent,
  NotificationNotifyReplyEvent,
} from "../events/notifications.events.js";
import { publishEvent } from "../helpers/publisher.helper.js";

export const publishNotificationNotifyReply = async (
  event: NotificationNotifyReplyEvent,
): Promise<void> => {
  await publishEvent("notification.notify-reply", event);

  console.log("✅ RabbitMQ confirmed notification.notify-reply");
};

export const publishNotificationNotifyMention = async (
  event: NotificationNotifyMentionEvent,
): Promise<void> => {
  await publishEvent("notification.notify-mention", event);

  console.log("✅ RabbitMQ confirmed notification.notify-mention");
};

export const publishNotificationNotifyGroupAdded = async (
  event: NotificationNotifyGroupAddedEvent,
): Promise<void> => {
  await publishEvent("notification.notify-group-added", event);

  console.log("✅ RabbitMQ confirmed notification.notify-group-added");
};
