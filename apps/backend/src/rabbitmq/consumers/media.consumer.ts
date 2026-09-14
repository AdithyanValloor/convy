import * as MediaAPI from "../../services/media/api/media.api.js";
import { getRabbitMQChannel } from "../connection.js";
import { setupRabbitMQTopology } from "../topology.js";

export const startMediaRabbitMQConsumer = async () => {
  const channel = await getRabbitMQChannel();

  await setupRabbitMQTopology();

  channel.prefetch(1);

  await channel.consume("backend.media", async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());

      console.log("🐇 Received media event:", event.eventType);

      switch (event.eventType) {
        case "media.delete-file":
          await MediaAPI.deleteFileApi(event.payload.key);
          break;

        default:
          console.warn(`Unknown media event: ${event.eventType}`);
      }

      channel.ack(message);
    } catch (error) {
      console.error("Media RabbitMQ message processing failed:", error);
      channel.nack(message, false, false);
    }
  });

  console.log("🐇 Media RabbitMQ consumer started");
};
