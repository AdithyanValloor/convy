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
import { startUserGrpcServer } from "./services/user/grpc/user.grpc.server.js";

// Load environment variables before reading config values.
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
