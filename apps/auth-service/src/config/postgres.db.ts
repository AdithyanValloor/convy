import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();

/**
 * PostgreSQL connection configuration.
 *
 * Loads the PostgreSQL connection string from environment variables
 * and creates a shared connection pool for the application.
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

    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection failed:");
    console.dir(error, { depth: null });

    process.exit(1);
  }
};