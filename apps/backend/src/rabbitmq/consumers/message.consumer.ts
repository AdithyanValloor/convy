import { getRabbitMQChannel } from "../connection.js";
import { handleMessageEvent } from "../handlers/message.handler.js";
import { setupRabbitMQTopology } from "../topology.js";


export const startMessageRabbitMQConsumer = async () => {
  const channel = await getRabbitMQChannel();

  await setupRabbitMQTopology();

  channel.prefetch(1);

  await channel.consume("backend.messages", async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());

      console.log(
        "🐇 Received RabbitMQ event:",
        event.eventType,
      );

      await handleMessageEvent(event);

      channel.ack(message);
    } catch (error) {
      console.error(
        "RabbitMQ message processing failed:",
        error,
      );

      channel.nack(message, false, false);
    }
  });

  console.log("🐇 Message consumer started");
};