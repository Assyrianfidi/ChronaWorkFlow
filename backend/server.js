import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { errorHandler } from "./src/middleware/error.middleware";

// Import routes
import authRoutes from "./src/routes/auth.routes";
import reportRoutes from "./src/routes/reports.routes";

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create Prisma client with error handling
let prisma;
try {
  prisma = new PrismaClient();
  console.log("✅ Prisma client initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Prisma client:", error);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Reconciliation Reports endpoints
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await prisma.reconciliationReport.findMany({
      orderBy: { date: "desc" },
    });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { date, amount, status } = req.body;
    const report = await prisma.reconciliationReport.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        status,
      },
    });
    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(400).json({ error: "Failed to create report" });
  }
});

// Users endpoints
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });
    res.status(201).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: "Failed to create user" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
    error: {
      code: "NOT_FOUND",
      description: "The requested resource was not found on this server.",
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`,
  );
  console.log(`🌐 Listening on http://localhost:${PORT}`);
  console.log(`🔒 Authentication: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📊 Reports API: http://localhost:${PORT}/api/reports`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");

  try {
    await prisma.$disconnect();
    console.log("✅ Database connection closed");

    server.close(() => {
      console.log("🛑 Server closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
