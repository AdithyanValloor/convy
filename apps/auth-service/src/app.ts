import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./errors/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { logger } from "./infra/logger/logger.js";
import { requestId } from "./middlewares/request-id.js";
import { register } from "./infra/metrics/metrics.js";

export const createApp = (): Application => {
  const app = express();

  // Assign a request ID before other middleware can fail.
  app.use(requestId);

  app.use(express.json());
  app.use(cookieParser());

  const clientOrigins =
    process.env.CLIENT_URLS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) || [];

  if (clientOrigins.length === 0) {
    logger.warn(
      {
        event: "cors_origins_missing",
        service: "auth-service",
      },
      "CLIENT_URLS is not configured; review CORS settings",
    );
  }

  app.use(
    cors({
      origin: clientOrigins,
      credentials: true,
    }),
  );

  app.use("/api/auth", authRouter);

  app.get("/api/auth/health", (_, res) => {
    res.status(200).json({
      success: true,
      message: "auth-service is running",
    });
  });

  app.get("/metrics", async (_req, res, next) => {
    try {
      res.setHeader("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler);

  return app;
};
