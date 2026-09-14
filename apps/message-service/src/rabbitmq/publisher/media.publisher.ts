import { MediaDeleteFileEvent } from "../events/media.events.js";
import { publishEvent } from "../helpers/publisher.helper.js";

export const publishMediaDeleteFile = async (
  event: MediaDeleteFileEvent,
): Promise<void> => {
  await publishEvent("media.delete-file", event);

  console.log("✅ RabbitMQ confirmed media.delete-file");
};
