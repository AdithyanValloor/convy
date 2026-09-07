import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectRedis } from "./config/redis.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 9001;

export const startServer = async (): Promise<void> => {
  try {
    await connectRedis();
    await connectDb();

    const app = createApp();

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
