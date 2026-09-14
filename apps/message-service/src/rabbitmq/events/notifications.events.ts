export interface NotificationNotifyReplyEvent {
  eventId: string;
  eventType: "notification.notify-reply";
  occurredAt: string;

  payload: {
    replyUserId: string;
    senderId: string;
    chatId: string;
    messageId: string;
  };
}

export interface NotificationNotifyMentionEvent {
  eventId: string;
  eventType: "notification.notify-mention";
  occurredAt: string;

  payload: {
    userId: string;
    senderId: string;
    chatId: string;
    messageId: string;
  };
}

export interface NotificationNotifyGroupAddedEvent {
  eventId: string;
  eventType: "notification.notify-group-added";
  occurredAt: string;

  payload: {
    userId: string;
    currentUserId: string;
    chatId: string;
  };
}
