import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/api/health", (req: any, res: any) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Simple auth login
app.post("/api/auth/login", (req: any, res: any) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);

  if (email === "admin@accubooks.com" && password === "admin123") {
    res.json({
      success: true,
      data: {
        user: {
          id: "1",
          name: "Admin User",
          email: "admin@accubooks.com",
          role: "ADMIN",
        },
        accessToken: "mock-token-123",
        expiresIn: 3600,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
});

// Keep running
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  process.exit(0);
});
