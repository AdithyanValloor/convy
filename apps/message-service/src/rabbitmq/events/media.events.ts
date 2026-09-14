export interface MediaDeleteFileEvent {
  eventId: string;
  eventType: "media.delete-file";
  occurredAt: string;

  payload: {
    key: string;
  };
}
