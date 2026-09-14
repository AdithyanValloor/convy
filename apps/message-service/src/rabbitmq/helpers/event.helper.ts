import crypto from "node:crypto";

export const createEvent = <
  TEventType extends string,
  TPayload,
>(
  eventType: TEventType,
  payload: TPayload,
) => {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    occurredAt: new Date().toISOString(),
    payload,
  };
};