import {
  MessageCreatedEvent,
  MessageDeleteEvent,
  MessageEditedEvent,
  MessageMentionedEvent,
  MessageReactionEvent,
  MessageRequestAcceptedEvent,
  MessageRequestCreatedEvent,
  MessageRequestRejectedEvent,
  MessageSeenEvent,
  MessageUnreadUpdateEvent,
} from "../events/message.events.js";
import { publishEvent } from "../helpers/publisher.helper.js";

export const publishMessageCreated = async (
  event: MessageCreatedEvent,
): Promise<void> => {
  await publishEvent("message.created", event);

  console.log("✅ RabbitMQ confirmed message.created");
};

export const publishMessageMentioned = async (
  event: MessageMentionedEvent,
): Promise<void> => {
  await publishEvent("message.mentioned", event);

  console.log("✅ RabbitMQ confirmed message.mentioned");
};

export const publishMessageEdited = async (
  event: MessageEditedEvent,
): Promise<void> => {
  await publishEvent("message.edited", event);

  console.log("✅ RabbitMQ confirmed message.edited");
};

export const publishUnreadUpdate = async (
  event: MessageUnreadUpdateEvent,
): Promise<void> => {
  await publishEvent("message.unread-update", event);

  console.log("✅ RabbitMQ confirmed message.unread-update");
};

export const publishMessagesSeen = async (
  event: MessageSeenEvent,
): Promise<void> => {
  await publishEvent("message.seen", event);

  console.log("✅ RabbitMQ confirmed message.seen");
};

export const publishMessageReaction = async (
  event: MessageReactionEvent,
): Promise<void> => {
  await publishEvent("message.reaction", event);

  console.log("✅ RabbitMQ confirmed message.reaction");
};

export const publishMessageDelete = async (
  event: MessageDeleteEvent,
): Promise<void> => {
  await publishEvent("message.delete", event);

  console.log("✅ RabbitMQ confirmed message.delete");
};

export const publishMessagerequestAccepted = async (
  event: MessageRequestAcceptedEvent,
): Promise<void> => {
  await publishEvent("message-request.accepted", event);

  console.log("✅ RabbitMQ confirmed message-request.accepted");
};

export const publishMessagerequestRejected = async (
  event: MessageRequestRejectedEvent,
): Promise<void> => {
  await publishEvent("message-request.rejected", event);

  console.log("✅ RabbitMQ confirmed message-request.rejected");
};

export const publishMessagerequestCreated = async (
  event: MessageRequestCreatedEvent,
): Promise<void> => {
  await publishEvent("message-request.created", event);

  console.log("✅ RabbitMQ confirmed message-request.created");
};
