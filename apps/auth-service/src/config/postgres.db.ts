import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import { logger } from "../infra/logger/logger.js";

dotenv.config();

/**
 * PostgreSQL connection configuration.
 */

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not defined");
}

export const postgresPool = new Pool({
  connectionString: POSTGRES_URL,
  max: 1,
});

export const postgresDb = drizzle({
  client: postgresPool,
});

export const checkPostgresConnection = async (): Promise<void> => {
  try {
    await postgresPool.query("SELECT 1");

    logger.info(
      {
        event: "postgres_connection_ready",
      },
      "PostgreSQL connection established",
    );
  } catch (error) {
    logger.fatal(
      {
        event: "postgres_connection_failed",
        errorName:
          error instanceof Error ? error.name : "UnknownError",
        errorMessage:
          error instanceof Error ? error.message : String(error),
      },
      "PostgreSQL connection check failed",
    );

    throw error;
  }
};
