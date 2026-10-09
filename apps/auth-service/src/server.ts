import dotenv from "dotenv";
import { checkPostgresConnection } from "./config/postgres.db.js";
import { connectRedis } from "./config/redis.config.js";
import { createApp } from "./app.js";
import { logger } from "./infra/logger/logger.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 9001;

export const startServer = async (): Promise<void> => {
  try {
    await checkPostgresConnection();
    await connectRedis();

    const app = createApp();

    app.get("/", (_, res) => {
      res.status(200).json({
        success: true,
        message: "Melo auth-service is running",
      });
    });

    app.listen(PORT, () => {
      logger.info(
        {
          event: "server_started",
          port: PORT,
          service: "auth-service",
        },
        "Auth service started successfully",
      );
    });
  } catch (error) {
    logger.fatal(
      {
        event: "server_start_failed",
        errorName:
          error instanceof Error ? error.name : "UnknownError",
        errorMessage:
          error instanceof Error ? error.message : String(error),
      },
      "Failed to start auth service",
    );

    process.exit(1);
  }
};
