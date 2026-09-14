import { getRabbitMQChannel } from "../connection.js";


const MESSAGE_EVENTS_EXCHANGE = "message.events";

interface RabbitMQEvent {
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: object;
}

export const publishEvent = async (
  routingKey: string,
  event: RabbitMQEvent,
): Promise<void> => {
  const channel = await getRabbitMQChannel();

  await channel.assertExchange(MESSAGE_EVENTS_EXCHANGE, "direct", {
    durable: true,
  });

  const message = Buffer.from(JSON.stringify(event));

  channel.publish(MESSAGE_EVENTS_EXCHANGE, routingKey, message, {
    persistent: true,
    contentType: "application/json",
  });

  await channel.waitForConfirms();
};
