import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Basic API info
app.get("/api", (req, res) => {
  res.json({
    message: "AccuBooks API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Start server with error handling
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

console.log("Server setup complete");
