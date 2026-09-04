import dotenv from "dotenv";
import { checkPostgresConnection } from "./src/config/postgres.db.js";
import { connectRedis } from "./src/config/redis.config.js";
import { createApp } from "./app.js";

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
        message: "Convy auth-service server is running",
      });
    });

    app.listen(PORT, () => {
      console.log(`[Auth Service] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
