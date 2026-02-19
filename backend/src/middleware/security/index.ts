import express from "express";
import cors from "cors";
import { securityHeaders } from "../securityHeaders.js";

type RateLimiterOptions = {
  windowMs: number;
  max: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

const appStores = new WeakMap<express.Application, Map<string, Counter>>();

function getAppStore(app: express.Application) {
  let store = appStores.get(app);
  if (!store) {
    store = new Map();
    appStores.set(app, store);
  }
  return store;
}

function createRateLimiter(options: RateLimiterOptions) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const store = getAppStore(req.app);
    const ip = req.ip || "unknown";
    const routeKey = `${req.baseUrl || ""}${req.path || ""}`;
    const key = `${ip}:${routeKey}`;

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (existing.count >= options.max) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    existing.count += 1;
    store.set(key, existing);
    next();
  };
}

export const authRateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });
export const sensitiveRouteLimiter = createRateLimiter({ windowMs: 30_000, max: 10 });

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
      .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, "")
      .replace(/javascript:/gi, "");
  }

  if (Array.isArray(value)) {
    return value.map((v: any) => sanitizeValue(v));
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      next[k] = sanitizeValue(v);
    }
    return next;
  }

  return value;
}

function enforceJsonContentType(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const contentType = req.headers["content-type"];
  if (!contentType) {
    return next();
  }

  if (!String(contentType).includes("application/json")) {
    return res.status(415).send("Unsupported Media Type");
  }

  next();
}

function sanitizeRequestBody(req: express.Request, _res: express.Response, next: express.NextFunction) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
}

function enforceCors(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }

  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s: any) => s.trim())
    .filter(Boolean);

  if (allowed.length === 0 || allowed.includes(String(origin))) {
    res.setHeader("Access-Control-Allow-Origin", String(origin));
    res.setHeader("Vary", "Origin");
    return next();
  }

  res.status(403).send("CORS Forbidden");
}

export default function applySecurityMiddlewares(app: express.Application) {
  app.use(enforceCors);

  app.use(
    cors({
      origin: (_origin, callback) => callback(null, false),
      credentials: true,
    }),
  );

  app.use(securityHeaders);

  app.use((_, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  app.use(express.json({ limit: "100kb" }));

  app.use(enforceJsonContentType);
  app.use(sanitizeRequestBody);
}
