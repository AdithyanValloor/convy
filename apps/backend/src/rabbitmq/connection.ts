import amqp, { Channel, ChannelModel } from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ??
  "amqp://guest:guest@localhost:5672";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const getRabbitMQChannel = async (): Promise<Channel> => {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(RABBITMQ_URL);

  channel = await connection.createChannel();

  console.log("🐇 RabbitMQ connected");

  return channel;
};