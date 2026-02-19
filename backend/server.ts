import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import { MemberRole, Role, BillingStatusEnum, PaymentStatus } from "@prisma/client";
import usersRoutes from "./src/routes/users.routes.js";
import companiesRoutes from "./src/routes/companies.routes.js";
import transactionsRoutes from "./src/modules/transactions/transactions.routes.js";
import invoicesRoutes from "./src/routes/invoicing/invoice.routes.js";
import { authRoutes } from "./src/routes/auth.routes.js";
import billingRoutes from "./src/routes/billing/billing.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import reportsRoutes from "./src/routes/reports.routes.js";
import accountsRoutes from "./src/modules/accounts/accounts.routes.js";
import gdprRoutes from "./src/routes/gdpr.routes.js";
import { dashboardRoutes } from "./src/routes/dashboard.routes.js";
import { 
  apiLimiter, 
  authLimiter, 
  requestSizeLimit, 
  sanitizeInput,
  securityLogger,
  validateEnvironment,
  csrfProtection
} from "./src/middleware/security.middleware.js";
import { protect as authenticate } from "./src/middleware/auth.middleware.js";
import { injectCompanyContext } from "./src/middleware/tenancy.middleware.js";
import { enforcePlanLimits } from "./src/middleware/plan-enforcement.middleware.js";
import { tenantContextMiddleware } from "./src/middleware/tenant-context.middleware.js";
import { databaseTenantContextMiddleware } from "./src/middleware/database-tenant-context.middleware.js";
import { requestTimeout } from "./src/middleware/request-timeout.middleware.js";
import { correlationId } from "./src/middleware/correlation-id.middleware.js";
import { prisma } from "./src/utils/prisma.js";
import logger from "./src/config/logger.js";
import { initRedis, disconnectRedis, getRedisRateLimitStore } from "./src/config/redis.js";
import { metricsMiddleware, metricsHandler } from "./src/config/prometheus.js";
import { globalErrorHandler } from "./src/middleware/error.middleware.js";
import { bootValidation } from "./src/utils/boot-validation.js";
import { fileURLToPath } from "node:url";
import crypto from "crypto";

dotenv.config();
validateEnvironment();

// ============================================================================
// CRITICAL: Boot-time safety validation MUST run before server starts
// Enforces structural integrity: single Prisma client, no versioned files,
// tenant middleware present, production security requirements
// Server will EXIT if any validation fails
// ============================================================================
bootValidation.validate();

export { prisma };

export const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// CRITICAL: Health endpoints MUST be the FIRST routes defined
// These are defined at the TOP before ANY middleware to guarantee public access
// Load balancers, Kubernetes, and monitoring systems require these endpoints
// ============================================================================

// Readiness probe - checks database connectivity
app.get('/api/health/ready', async (req, res) => {
  try {
    await prisma.users.count({ take: 1 } as any);
    res.status(200).json({
      ready: true,
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      database: "disconnected"
    });
  }
});

// Liveness probe - simple uptime check (no database)
app.get('/api/health/alive', (req, res) => {
  res.status(200).json({
    alive: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Security headers with HSTS
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CRITICAL: Health endpoints MUST be defined BEFORE any security middleware
// Load balancers, Kubernetes, and monitoring systems need these to be completely public
// No CSRF tokens, no auth, no rate limiting, no request size checks
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection using Prisma client (not raw SQL — blocked by V3 middleware)
    await prisma.users.count({ take: 1 } as any);
    
    res.status(200).json({
      status: "ok",
      database: "connected",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: PORT,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      },
    });
  } catch (error) {
    const err = error as Error;
    logger.error("Health check failed", { error: err.message });
    res.status(503).json({
      status: "error",
      database: "disconnected",
      environment: process.env.NODE_ENV || "development",
      error: process.env.NODE_ENV === 'production' ? 'Database unavailable' : err.message,
    });
  }
});

// Readiness probe for load balancers (Kubernetes, ALB, etc.)
app.get("/api/health/ready", async (req, res) => {
  try {
    await prisma.users.count({ take: 1 } as any);
    res.status(200).json({
      ready: true,
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      database: "disconnected"
    });
  }
});

// Liveness probe for orchestration (Kubernetes, Docker Swarm, etc.)
app.get("/api/health/alive", async (req, res) => {
  res.status(200).json({
    alive: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get("/api/metrics", metricsHandler);

// Simple health endpoint for Render / load balancers (backward compatibility)
app.get("/health", async (req, res) => {
  try {
    await prisma.users.count({ take: 1 } as any);
    res.status(200).json({
      status: "ok",
      database: "connected",
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// Public routes (no authentication required)
app.use("/api/auth", authLimiter, authRoutes);

// Protected routes (authentication required)
// Tenant context middleware wraps request in AsyncLocalStorage for V3 isolation
// Database tenant context middleware sets PostgreSQL session variable for RLS enforcement
app.use("/api/users", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, usersRoutes);
app.use("/api/companies", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, companiesRoutes);
app.use("/api/transactions", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, transactionsRoutes);
app.use("/api/invoices", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, invoicesRoutes);
app.use("/api/billing", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, billingRoutes);
app.use("/api/admin", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, adminRoutes);
app.use("/api/reports", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, reportsRoutes);
app.use("/api/accounts", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, accountsRoutes);
app.use("/api/gdpr", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, gdprRoutes);
app.use("/api/dashboard", apiLimiter, authenticate, tenantContextMiddleware, databaseTenantContextMiddleware, dashboardRoutes);

// Dashboard stats endpoint (Already moved to specific controller/route if needed, but keeping for now if preferred)
// Removing duplicate implementations of companies, invoices, transactions logic that are now in their own routes


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
    error: {
      code: "NOT_FOUND",
      path: req.path,
    },
  });
});

app.use(globalErrorHandler);

export async function startServer() {
  // Initialize Redis for production rate limiting (graceful fallback to in-memory)
  await initRedis();

  // Seed staging admin if needed (skip if disabled or schema mismatch)
  if (process.env.NODE_ENV === "staging" && process.env.SEED_ADMIN !== "false") {
    try {
      await prisma.$transaction(async (tx: any) => {
        const adminEmail = "admin@staging.accubooks.com";
        const existing = await tx.users.findUnique({ where: { email: adminEmail } });
        if (existing) {
          return; // idempotent
        }

        const companyId = crypto.randomUUID();
        const company = await tx.companies.create({
          data: {
            id: companyId,
            name: "Staging Admin Company",
            updatedAt: new Date(),
            isActive: true,
          },
        });

        await tx.billing_status.create({
          data: {
            id: crypto.randomUUID(),
            companyId: company.id,
            billingStatus: BillingStatusEnum.ACTIVE,
            paymentStatus: PaymentStatus.CURRENT,
            planType: "TRIAL",
            updatedAt: new Date(),
          },
        });

        const hashedPassword = await bcrypt.hash("AdminPassword123!@#", 10);

        const adminUser = await tx.users.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: "Staging Admin",
            role: Role.ADMIN,
            isActive: true,
            updatedAt: new Date(),
            currentCompanyId: company.id,
          },
        });

        await tx.company_members.create({
          data: {
            id: crypto.randomUUID(),
            userId: adminUser.id,
            companyId: company.id,
            role: MemberRole.OWNER,
            isActive: true,
          },
        });
      });
      logger.info("Staging admin seeded or already present");
    } catch (err: any) {
      logger.error("Failed to seed staging admin", { error: err.message });
    }
  }

  const server = app.listen(PORT, () => {
    logger.info("AccuBooks Backend Server Started", {
      environment: process.env.NODE_ENV || "development",
      port: PORT,
      endpoints: [
        `/api/health`,
        `/api/metrics`,
        `/api/auth/*`,
        `/api/users`,
        `/api/companies`,
        `/api/transactions`,
        `/api/invoices`,
        `/api/billing`,
        `/api/admin`,
        `/api/gdpr`,
      ],
    });
  });

  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection", { error: err });
    server.close(() => process.exit(1));
  });

  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    try {
      await disconnectRedis();
      await prisma.$disconnect();
      logger.info("Database and Redis connections closed");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    } catch (error) {
      logger.error("Error during shutdown", { error: (error as Error).message });
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return server;
}

// Start server only when executed directly (not when imported by tests)
if (process.env.NODE_ENV !== 'test') {
  const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
  if (isMain) {
    startServer();
  }
}

export default app;
