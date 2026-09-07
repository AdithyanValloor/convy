import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./errors/error.middleware.js";
import { registerRoutes } from "./routes.js";

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  const clientOrigins =
    process.env.CLIENT_URLS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) || [];

  if (clientOrigins.length === 0) {
    console.warn(
      "CLIENT_URLS not set in environment variables. CORS may be misconfigured.",
    );
  }

  app.use(
    cors({
      origin: clientOrigins,
      credentials: true,
    }),
  );

  registerRoutes(app);

  app.use(errorHandler);

  return app;
};
