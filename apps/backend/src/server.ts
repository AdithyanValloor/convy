/**
 * Server bootstrap.
 * Loads infrastructure dependencies and starts the HTTP server.
 */

import dotenv from "dotenv";
import http from "http";

import { connectDb } from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { createApp } from "./app.js";
import { connectRedis } from "./config/redis.js";
import { checkPostgresConnection } from "./config/postgres.db.js";
import { startUserGrpcServer } from "./grpc/grpc.server.js";
import { startRabbitMQConsumers } from "./rabbitmq/index.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 9000;

export const startServer = async (): Promise<void> => {
  try {
    await connectDb();
    await checkPostgresConnection();
    await connectRedis();

    const app = createApp();
    const server = http.createServer(app);

    initSocket(server);
    
    await startRabbitMQConsumers();

    startUserGrpcServer();

    app.get("/", (_, res) => {
      res.status(200).json({
        success: true,
        message: "Convy backend is running",
      });
    });

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
