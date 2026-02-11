import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

let prisma;
try {
  prisma = new PrismaClient();
  console.log("✅ Prisma client initialized");
} catch (error) {
  console.error("❌ Failed to initialize Prisma client:", error);
  process.exit(1);
}

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    port: PORT,
  });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: password || "default",
        role: role || "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
});

app.get("/api/transactions", async (req, res) => {
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
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: {
      code: "INTERNAL_ERROR",
      message: err.message,
    },
  });
});

const server = app.listen(PORT, () => {
  console.log("");
  console.log("🚀 ========================================");
  console.log(`   AccuBooks Backend Server Started`);
  console.log("   ========================================");
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Port: ${PORT}`);
  console.log("");
  console.log("   📊 API Endpoints:");
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Users: http://localhost:${PORT}/api/users`);
  console.log(`   - Transactions: http://localhost:${PORT}/api/transactions`);
  console.log(`   - Companies: http://localhost:${PORT}/api/companies`);
  console.log(`   - Invoices: http://localhost:${PORT}/api/invoices`);
  console.log("   ========================================");
  console.log("");
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

const shutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("✅ Database connection closed");
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
