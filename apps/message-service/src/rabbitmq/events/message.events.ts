import { MessageRequestDTO } from "../../modules/messages/types/message.types.js";
import { MessageSocketPayload } from "../types/message.types.js";

export interface MessageCreatedEvent {
  eventId: string;
  eventType: "message.created";
  occurredAt: string;

  payload: {
    chatId: string;
    message: MessageSocketPayload;
  };
}

export interface MessageMentionedEvent {
  eventId: string;
  eventType: "message.mentioned";
  occurredAt: string;

  payload: {
    userId: string;
    chatId: string;
    message: MessageSocketPayload;
  };
}
export interface MessageEditedEvent {
  eventId: string;
  eventType: "message.edited";
  occurredAt: string;

  payload: {
    chatId: string;
    message: MessageSocketPayload;
  };
}

export interface MessageReactionEvent {
  eventId: string;
  eventType: "message.reaction";
  occurredAt: string;

  payload: {
    chatId: string;
    message: MessageSocketPayload;
  };
}

export interface MessageDeleteEvent {
  eventId: string;
  eventType: "message.delete";
  occurredAt: string;

  payload: {
    chatId: string;
    message: MessageSocketPayload;
  };
}

export interface MessageUnreadUpdateEvent {
  eventId: string;
  eventType: "message.unread-update";
  occurredAt: string;

  payload: {
    memberId: string;
    chatId: string;
    unreadCounts: number;
  };
}

export interface MessageSeenEvent {
  eventId: string;
  eventType: "message.seen";
  occurredAt: string;

  payload: {
    memberId: string;
    chatId: string;
    unreadCounts: number;
  };
}

export interface MessageRequestAcceptedEvent {
  eventId: string;
  eventType: "message-request.accepted";
  occurredAt: string;

  payload: {
    userA: string;
    userB: string;
    requestPayload: {
      requestId: string;
      chat: string;
    };
  };
}

export interface MessageRequestRejectedEvent {
  eventId: string;
  eventType: "message-request.rejected";
  occurredAt: string;

  payload: {
    fromUserId: string;
    requestId: string;
    chatId: string;
  };
}

export interface MessageRequestCreatedEvent {
  eventId: string;
  eventType: "message-request.created";
  occurredAt: string;

  payload: {
    senderId: string;
    toUserId: string;
    request: MessageRequestDTO;
  };
}
