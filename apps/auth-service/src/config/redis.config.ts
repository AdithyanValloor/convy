import { createClient } from "redis";
import { logger } from "../infra/logger/logger.js";

export const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  logger.error(
    {
      event: "redis_client_error",
      errorName: err.name,
      errorMessage: err.message,
    },
    "Redis client error",
  );
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();

    logger.info(
      {
        event: "redis_connection_ready",
      },
      "Redis connection established",
    );
  } catch (error) {
    logger.fatal(
      {
        event: "redis_connection_failed",
        errorName:
          error instanceof Error ? error.name : "UnknownError",
        errorMessage:
          error instanceof Error ? error.message : String(error),
      },
      "Failed to connect to Redis during startup",
    );

    throw error;
  }
};
