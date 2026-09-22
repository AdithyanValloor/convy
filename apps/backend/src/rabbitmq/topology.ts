import { getRabbitMQChannel } from "./connection.js";

export const setupRabbitMQTopology = async () => {
  const channel = await getRabbitMQChannel();

  // Exchange
  await channel.assertExchange("message.events", "direct", {
    durable: true,
  });

  // Message events queue
  await channel.assertQueue("backend.messages", {
    durable: true,
  });

  const messageEvents = [
    "message.created",
    "message.mentioned",
    "message.unread-update",
    "message.edited",
    "message.reaction",
    "message.delete",
    "message.seen",

    // Message request events
    "message-request.created",
    "message-request.accepted",
    "message-request.rejected",
  ];

  for (const routingKey of messageEvents) {
    await channel.bindQueue("backend.messages", "message.events", routingKey);
  }

  // Group events queue
  await channel.assertQueue("backend.groups", {
    durable: true,
  });

  const groupEvents = [
    "group.created",
    "group.members-added",
    "group.member-removed",
    "group.updated",
    "group.deleted",
    "group.admin-toggle",
    "group.member-left",
    "group.transfer-owner",
  ];

  for (const routingKey of groupEvents) {
    await channel.bindQueue("backend.groups", "message.events", routingKey);
  }

  // Notification events queue
  await channel.assertQueue("backend.notifications", {
    durable: true,
  });

  const notificationEvents = [
    "notification.notify-reply",
    "notification.notify-mention",
    "notification.notify-group-added",
  ];

  for (const routingKey of notificationEvents) {
    await channel.bindQueue(
      "backend.notifications",
      "message.events",
      routingKey,
    );
  }

  // Media events queue
  await channel.assertQueue("backend.media", {
    durable: true,
  });

  const mediaEvents = ["media.delete-file"];

  for (const routingKey of mediaEvents) {
    await channel.bindQueue("backend.media", "message.events", routingKey);
  }

  console.log("🐇 RabbitMQ topology ready");
};
