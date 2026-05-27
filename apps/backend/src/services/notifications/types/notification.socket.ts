/** Serialized inbox notification shape used in API responses and socket payloads. */
export interface InboxNotificationDTO {
  _id: string;
  type: string;

  actor?: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: any;
  };

  chat?: {
    _id: string;
    chatName?: string;
    isGroup?: boolean;
  };

  message?: {
    _id: string;
    content: string;
    chat?: string;
  };

  group?: {
    _id: string;
    chatName?: string;
    isGroup?: boolean;
  };

  read: boolean;
  createdAt: Date;
}

/** Socket payload wrapper for inbox notification events. */
export interface InboxNotificationSocketPayload {
  type: string;
  notification: InboxNotificationDTO;
}
