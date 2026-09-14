import { startGroupRabbitMQConsumer } from "./consumers/group.consumer.js";
import { startMediaRabbitMQConsumer } from "./consumers/media.consumer.js";
import { startMessageRabbitMQConsumer } from "./consumers/message.consumer.js";
import { startNotificationRabbitMQConsumer } from "./consumers/notification.consumer.js";

export const startRabbitMQConsumers = async () => {
  await startMessageRabbitMQConsumer();
  await startGroupRabbitMQConsumer();
  await startMediaRabbitMQConsumer();
  await startNotificationRabbitMQConsumer();
};
