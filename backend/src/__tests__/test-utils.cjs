const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth, authorizeRoles } = require("../../src/middleware/auth");
const ROLES = require("../../src/constants/roles");
const http = require("http");

const prisma = new PrismaClient();

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
  try {
    // Skip auth for health check endpoint
    if (req.path === "/health") return next();

    // Get token from header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No token, authorization denied",
        code: "NO_AUTH_TOKEN",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "test-secret",
      );

      // Ensure req.user has all required fields
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || ROLES.USER,
        isActive: decoded.isActive !== false, // Default to true if not specified
        ...decoded,
      };

      // Add helper methods
      req.user.isAdmin = () => req.user.role === ROLES.ADMIN;
      req.user.isManager = () =>
        [ROLES.ADMIN, ROLES.MANAGER].includes(req.user.role);

      next();
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
        code: "INVALID_TOKEN",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      code: "AUTH_ERROR",
    });
  }
};

// Create a test server with proper route setup and error handling
const createTestServer = () => {
  const server = http.createServer();

  return {
    server,
    listen: () =>
      new Promise((resolve) => {
        server.listen(0, "0.0.0.0", () => {
          const address = server.address();
          const port = typeof address === "string" ? address : address.port;
          resolve({ port, server });
        });
      }),
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
      }),
  };
};

// Generate JWT token
const generateAuthToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1d" },
  );
};

// Clean up database
const cleanupDatabase = async () => {
  await prisma.reconciliationReport.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: "@example.com",
      },
    },
  });
};

// Create a test user
const createTestUser = async (userData = {}) => {
  const hashedPassword = await bcrypt.hash(userData.password || "test1234", 10);

  return prisma.user.create({
    data: {
      name: userData.name || "Test User",
      email: userData.email || `test-${Date.now()}@example.com`,
      password: hashedPassword,
      role: userData.role || "user",
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    },
  });
};

module.exports = {
  prisma,
  createTestServer,
  generateAuthToken,
  cleanupDatabase,
  createTestUser,
};
