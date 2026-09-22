import "./config/env.js";

import { createApp } from "./app.js";
import { connectRedis } from "./config/redis.js";
import { connectDb } from "./config/db.js";
import { getRabbitMQChannel } from "./rabbitmq/connection.js";
import { startChatGrpcServer } from "./grpc/grpc.server.js";

const PORT = Number(process.env.PORT) || 9001;

export const startServer = async (): Promise<void> => {
  try {
    await connectRedis();
    await connectDb();

    await getRabbitMQChannel()

    const app = createApp();

    startChatGrpcServer()

    app.get("/", (_, res) => {
      res.status(200).json({
        success: true,
        message: "Convy message-service server is running",
      });
    });

    app.listen(PORT, () => {
      console.log(`[Message Service] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start message Service:", error);
    process.exit(1);
  }
};
