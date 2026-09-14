import amqp, { ConfirmChannel, ChannelModel } from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;

export const getRabbitMQChannel = async (): Promise<ConfirmChannel> => {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(RABBITMQ_URL);

  channel = await connection.createConfirmChannel();

  console.log("🐇 Message Service connected to RabbitMQ");

  return channel;
};
