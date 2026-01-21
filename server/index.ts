import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { jobService } from "./jobs/service";
import { logEvent, logError, recordError, recordRequest } from "../shared/logging";
import { newRequestId } from "./runtime/audit-log";

if (String(process.env.NODE_ENV || "").toLowerCase() === "production") {
  if (String(process.env.ALLOW_DEV_RELAXATIONS || "").toLowerCase() === "true") {
    throw new Error("ALLOW_DEV_RELAXATIONS must not be enabled in production");
  }
}

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
    requestId?: string
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
// Health check endpoint - must be before other middleware to ensure it's always accessible
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'ok', message: 'AccuBooks API is healthy' });
});

// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AccuBooks API is running' });
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    recordError("server.http");
    logError("server.http", "unhandled_request_error", err, {
      requestId: (_req as any)?.requestId,
      method: (_req as any)?.method,
      path: (_req as any)?.path,
      statusCode: status,
    });

    res.status(status).json({ message });
  });

  process.on("unhandledRejection", (reason) => {
    recordError("server.process");
    logError("server.process", "unhandledRejection", reason, { requestId: null });
  });

  process.on("uncaughtException", (error) => {
    recordError("server.process");
    logError("server.process", "uncaughtException", error, { requestId: null });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    log('SIGTERM received, shutting down gracefully');
    await jobService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    log('SIGINT received, shutting down gracefully');
    await jobService.shutdown();
    process.exit(0);
  });
})();
