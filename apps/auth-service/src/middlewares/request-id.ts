import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../infra/logger/logger.js";
import {
  httpRequestsTotal,
  httpRequestDuration,
} from "../infra/metrics/metrics.js";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const incomingRequestId = req.header("X-Request-ID");
  const id = incomingRequestId || randomUUID();

  req.requestId = id;
  req.log = logger.child({ requestId: id });
  res.setHeader("X-Request-ID", id);

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;

    const durationMs = durationSeconds * 1000;

    // Avoid recording arbitrary URLs as metric labels.
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);

    req.log.info(
      {
        event: "http_request",
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      },
      "HTTP request completed",
    );
  });

  next();
};
