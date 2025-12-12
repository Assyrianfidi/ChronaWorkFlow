import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create Prisma client with error handling (optional for now)
let prisma = null;
const initDatabase = async () => {
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
    console.log("✅ Prisma client initialized successfully");

    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Prisma client:", error);
    console.log("⚠️  Continuing without database connection...");
    prisma = null;
  }
};

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Simple health check without database dependency for now
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: "connection_check_skipped",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Basic API routes
app.get("/api", (req, res) => {
  res.json({
    message: "AccuBooks API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/api/health",
      accounts: "/api/accounts",
      transactions: "/api/transactions",
      invoices: "/api/invoices",
      reports: "/api/reports",
    },
  });
});

// Mock data for demonstration
const mockAccounts = [
  { id: "1", code: "1000", name: "Cash", type: "Asset", balance: 10000 },
  {
    id: "2",
    code: "2000",
    name: "Accounts Payable",
    type: "Liability",
    balance: -5000,
  },
  { id: "3", code: "3000", name: "Revenue", type: "Equity", balance: 50000 },
];

const mockTransactions = [
  {
    id: "1",
    date: "2023-01-01",
    description: "Initial Investment",
    amount: 10000,
    type: "debit",
    accountId: "1",
  },
  {
    id: "2",
    date: "2023-01-02",
    description: "Office Supplies",
    amount: 500,
    type: "credit",
    accountId: "2",
  },
];

const mockInvoices = [
  {
    id: "1",
    number: "INV-001",
    customer: "ABC Corp",
    amount: 2500,
    status: "paid",
    date: "2023-01-15",
  },
  {
    id: "2",
    number: "INV-002",
    customer: "XYZ Ltd",
    amount: 1500,
    status: "pending",
    date: "2023-01-20",
  },
];

// Accounts endpoints
app.get("/api/accounts", (req, res) => {
  try {
    res.json({
      success: true,
      data: mockAccounts,
      count: mockAccounts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/accounts/:id", (req, res) => {
  try {
    const account = mockAccounts.find((acc) => acc.id === req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }
    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Transactions endpoints
app.get("/api/transactions", (req, res) => {
  try {
    res.json({
      success: true,
      data: mockTransactions,
      count: mockTransactions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/transactions", (req, res) => {
  try {
    const newTransaction = {
      id: (mockTransactions.length + 1).toString(),
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };
    mockTransactions.push(newTransaction);

    res.status(201).json({
      success: true,
      data: newTransaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Invoices endpoints
app.get("/api/invoices", (req, res) => {
  try {
    res.json({
      success: true,
      data: mockInvoices,
      count: mockInvoices.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/invoices/:id", (req, res) => {
  try {
    const invoice = mockInvoices.find((inv) => inv.id === req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Reports endpoints
app.get("/api/reports/summary", (req, res) => {
  try {
    const totalAssets = mockAccounts
      .filter((acc) => acc.type === "Asset")
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalLiabilities = mockAccounts
      .filter((acc) => acc.type === "Liability")
      .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

    const totalEquity = mockAccounts
      .filter((acc) => acc.type === "Equity")
      .reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      success: true,
      data: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        netWorth: totalAssets - totalLiabilities,
        accountCount: mockAccounts.length,
        transactionCount: mockTransactions.length,
        invoiceCount: mockInvoices.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Initialize database first
    await initDatabase();

    console.log(`Attempting to start server on port ${PORT}...`);
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 AccuBooks API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    server.on("error", (error) => {
      console.error("Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
      }
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
