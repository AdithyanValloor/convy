/**
 * Builds the Express app without starting the HTTP server.
 * Keeps app setup separate from process/bootstrap code.
 */

import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middleware/error.middleware.js";
import { startScheduledDeletionJob } from "./jobs/scheduledDeletionJob.js";
import { registerRoutes } from "./routes.js";

export const createApp = (): Application => {
  const app = express();

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

  // Start background cleanup when the app boots.
  startScheduledDeletionJob();

  app.use(express.json());
  app.use(cookieParser());

  // Register feature routes under the API namespace.
  registerRoutes(app);

  // Register last so route and middleware errors reach the global handler.
  app.use(errorHandler);

  return app;
};
