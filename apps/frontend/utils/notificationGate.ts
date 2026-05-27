import { NotificationSettings } from "@/redux/features/Notificationsettingsslice";

export type NotificationType =
  | "message"
  | "mention"
  | "friend_request"
  | "friend_accept"
  | "group_added"
  | null;

export const shouldNotify = (
  type: NotificationType,
  settings: NotificationSettings,
) => {
  if (!settings.allNotifications) return false;
  switch (type) {
    case "message":
      return settings.newMessages;

    case "mention":
      return settings.mentions;

    case "friend_request":
      return settings.friendRequests;

    case "friend_accept":
      return settings.friendRequestAccepted;

    case "group_added":
      return settings.groupAdded;

    default:
      return true;
  }
};
