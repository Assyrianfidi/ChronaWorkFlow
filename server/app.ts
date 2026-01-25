import express from "express";
import { logEvent, recordRequest } from "../shared/logging";
import { newRequestId } from "./runtime/audit-log";
import { authenticate } from "./middleware/authenticate";
import { authorizeRequest } from "./middleware/authorize";
import { enforceBillingStatus } from "./middleware/billing-status";
import { enforcePlanLimits } from "./middleware/plan-limits";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
    requestId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function createApp() {
  const app = express();

  app.get("/api/health", (req, res) => {
    console.log("Health check endpoint hit");
    res.json({ status: "ok", message: "AccuBooks API is healthy" });
  });

  app.get("/", (req, res) => {
    res.json({ status: "ok", message: "AccuBooks API is running" });
  });

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const requestId = newRequestId();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        recordRequest("server.http");
        const slowMs = Number(process.env.SLOW_REQUEST_MS || 1500);
        const isSlow = Number.isFinite(slowMs) && duration >= slowMs;
        logEvent({
          level: isSlow ? "warn" : "info",
          component: "server.http",
          message: isSlow ? "slow_request" : "request",
          data: {
            requestId: req.requestId,
            method: req.method,
            path,
            statusCode: res.statusCode,
            durationMs: duration,
          },
        });
      }
    });

    next();
  });

  app.use("/api", authenticate(), authorizeRequest(), enforceBillingStatus(), enforcePlanLimits());

  return app;
}
