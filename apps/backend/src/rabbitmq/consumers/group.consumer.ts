import { getRabbitMQChannel } from "../connection.js";
import { handleGroupEvent } from "../handlers/group.handler.js";
import { setupRabbitMQTopology } from "../topology.js";


export const startGroupRabbitMQConsumer = async () => {
  const channel = await getRabbitMQChannel();

  await setupRabbitMQTopology();

  channel.prefetch(1);

  await channel.consume("backend.groups", async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());

      console.log("🐇 Received group RabbitMQ event:", event.eventType);

      await handleGroupEvent(event);

      channel.ack(message);
    } catch (error) {
      console.error("RabbitMQ group message processing failed:", error);

      channel.nack(message, false, false);
    }
  });

  console.log("🐇 Group RabbitMQ consumer started");
};
