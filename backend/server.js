import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import usersRoutes from "./src/routes/users.routes.js";
import companiesRoutes from "./src/routes/companies.routes.js";
import transactionsRoutes from "./src/routes/transactions.routes.js";
import invoicesRoutes from "./src/routes/invoices.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import billingRoutes from "./src/routes/billing.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import { 
  apiLimiter, 
  authLimiter, 
  requestSizeLimit, 
  sanitizeInput,
  securityLogger,
  validateEnvironment 
} from "./src/middleware/security.middleware.js";
import { authenticate } from "./src/middleware/auth.middleware.js";
import { injectCompanyContext } from "./src/middleware/tenancy.middleware.js";
import { enforcePlanLimits } from "./src/middleware/plan-enforcement.middleware.js";
import logger from "./src/config/logger.js";

dotenv.config();
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;

let prisma;
try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  });
  logger.info("Prisma client initialized");
} catch (error) {
  logger.error("Failed to initialize Prisma client", { error: error.message });
  process.exit(1);
}

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Security middleware
app.use(requestSizeLimit);
app.use(sanitizeInput);
app.use(securityLogger);

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: "ok",
      database: "connected",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: PORT,
    });
  } catch (error) {
    logger.error("Health check failed", { error: error.message });
    res.status(503).json({
      status: "error",
      database: "disconnected",
      environment: process.env.NODE_ENV || "development",
      error: error.message,
    });
  }
});

// Simple health endpoint for Render
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
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
app.use("/api/users", apiLimiter, authenticate, injectCompanyContext, enforcePlanLimits, usersRoutes);
app.use("/api/companies", apiLimiter, authenticate, injectCompanyContext, enforcePlanLimits, companiesRoutes);
app.use("/api/transactions", apiLimiter, authenticate, injectCompanyContext, transactionsRoutes);
app.use("/api/invoices", apiLimiter, authenticate, injectCompanyContext, invoicesRoutes);
app.use("/api/billing", apiLimiter, billingRoutes);
app.use("/api/admin", apiLimiter, adminRoutes);

// Dashboard stats endpoint
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const [userStats, companyStats, transactionStats, invoiceStats] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.transaction.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.invoice.aggregate({ _sum: { amount: true }, _count: true }),
    ]);
    
    res.json({
      success: true,
      data: {
        users: { total: userStats },
        companies: { total: companyStats },
        transactions: { 
          total: transactionStats._count,
          totalAmount: transactionStats._sum.amount || 0,
        },
        invoices: { 
          total: invoiceStats._count,
          totalAmount: invoiceStats._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
});

// Legacy basic endpoints (deprecated - use module routes instead)
app.get("/api/transactions/legacy", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 50,
    });
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
});

app.get("/api/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({
      success: true,
      data: companies,
      count: companies.length,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
      error: error.message,
    });
  }
});

app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
});

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

app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
});

const server = app.listen(PORT, () => {
  logger.info("AccuBooks Backend Server Started", {
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    endpoints: [
      `/api/health`,
      `/api/auth/*`,
      `/api/users`,
      `/api/companies`,
      `/api/transactions`,
      `/api/invoices`,
      `/api/billing`,
      `/api/admin`,
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
    await prisma.$disconnect();
    logger.info("Database connection closed");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Error during shutdown", { error: error.message });
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
