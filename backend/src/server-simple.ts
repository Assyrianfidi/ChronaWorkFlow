import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRoutes } from "./routes/auth.routes.simple.js";
import { StatusCodes } from "http-status-codes";
import adminFeaturesRouter from "./routes/admin.features.simple";

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "unknown",
    database: "connection_check_skipped",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminFeaturesRouter);

// Simple mock data routes for demo
app.get("/api/invoices", async (req: Request, res: Response) => {
  try {
    const mockInvoices = [
      {
        id: "1",
        invoiceNumber: "INV-001",
        customerName: "ABC Corporation",
        amount: 2500.0,
        status: "PAID",
        dueDate: "2024-12-15",
        createdAt: "2024-12-01",
      },
      {
        id: "2",
        invoiceNumber: "INV-002",
        customerName: "XYZ Industries",
        amount: 1800.5,
        status: "PENDING",
        dueDate: "2024-12-20",
        createdAt: "2024-12-05",
      },
    ];

    res.json({
      success: true,
      data: mockInvoices,
      pagination: {
        page: 1,
        limit: 10,
        total: mockInvoices.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
});

app.get("/api/customers", async (req: Request, res: Response) => {
  try {
    const mockCustomers = [
      {
        id: "1",
        name: "ABC Corporation",
        email: "billing@abc-corp.com",
        phone: "+1-555-0101",
        address: "123 Business St, City, State 12345",
        totalInvoices: 5,
        totalRevenue: 12500.0,
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        name: "XYZ Industries",
        email: "accounts@xyz-ind.com",
        phone: "+1-555-0102",
        address: "456 Commerce Ave, City, State 67890",
        totalInvoices: 3,
        totalRevenue: 8400.0,
        createdAt: "2024-02-20",
      },
    ];

    res.json({
      success: true,
      data: mockCustomers,
      pagination: {
        page: 1,
        limit: 10,
        total: mockCustomers.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

app.get("/api/transactions", async (req: Request, res: Response) => {
  try {
    const mockTransactions = [
      {
        id: "1",
        type: "INCOME",
        category: "Invoice Payment",
        description: "Payment for INV-001",
        amount: 2500.0,
        date: "2024-12-10",
        invoiceId: "1",
        customerId: "1",
      },
      {
        id: "2",
        type: "EXPENSE",
        category: "Office Supplies",
        description: "Monthly office supplies",
        amount: -350.0,
        date: "2024-12-08",
        invoiceId: null,
        customerId: null,
      },
    ];

    res.json({
      success: true,
      data: mockTransactions,
      pagination: {
        page: 1,
        limit: 10,
        total: mockTransactions.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
});

app.get("/api/reports/summary", async (req: Request, res: Response) => {
  try {
    const mockSummary = {
      totalRevenue: 45200.0,
      totalExpenses: 12300.0,
      netProfit: 32900.0,
      pendingInvoices: 8,
      paidInvoices: 24,
      overdueInvoices: 3,
    };

    res.json({
      success: true,
      data: mockSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch report summary",
    });
  }
});

app.get("/api/notifications", async (req: Request, res: Response) => {
  try {
    const mockNotifications = [
      {
        id: "1",
        type: "INFO",
        title: "New Invoice Created",
        message: "Invoice INV-003 has been created for ABC Corporation",
        read: false,
        createdAt: "2024-12-10T10:30:00Z",
      },
      {
        id: "2",
        type: "WARNING",
        title: "Overdue Invoice",
        message: "Invoice INV-002 is overdue. Payment required.",
        read: false,
        createdAt: "2024-12-09T14:15:00Z",
      },
    ];

    res.json({
      success: true,
      data: mockNotifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

app.get("/api/users/profile", async (req: Request, res: Response) => {
  try {
    // Mock user profile - in real app this would come from authenticated user
    const mockProfile = {
      id: "1",
      name: "Admin User",
      email: "admin@accubooks.com",
      role: "ADMIN",
      avatar: null,
      lastLogin: "2024-12-10T09:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
    };

    res.json({
      success: true,
      data: mockProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Resource not found",
    error: {
      code: "NOT_FOUND",
      path: req.path,
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal server error",
    error: {
      code: "INTERNAL_ERROR",
      message: err.message,
    },
  });
});

// Start server
async function startServer() {
  try {
    console.log("Starting simple AccuBooks server...");

    const PORT = 3001;
    const server = app.listen(PORT, () => {
      console.log(`✅ Simple AccuBooks server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`📄 Mock data endpoints available`);
    });

    // Keep the server running
    process.on("SIGINT", () => {
      console.log("\nShutting down server...");
      server.close(() => {
        console.log("Server shut down.");
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start server
startServer();

export default app;
