import mongoose from "mongoose";
import dotenv from "dotenv";

/**
 * MongoDB connection helper.
 *
 * Loads configuration from environment variables and establishes
 * a single Mongoose connection during application bootstrap.
 * The process exits if the connection fails.
 */

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

export const connectDb = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 20,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error instanceof Error ? error.message : error,
    );

    process.exit(1);
  }
};
