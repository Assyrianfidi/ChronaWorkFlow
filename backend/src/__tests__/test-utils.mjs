import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Simple error handlers for testing
const notFoundHandler = (req, res, next) => {
  res.status(404).json({ success: false, message: 'Not Found' });
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
};

// Initialize Prisma client
const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  JWT_SECRET: 'test-secret-key',
  JWT_EXPIRES_IN: '1d',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'admin123',
  USER_EMAIL: 'user@example.com',
  USER_PASSWORD: 'user123',
  TEST_USER: {
    email: 'testuser@example.com',
    password: 'test123',
    name: 'Test User',
    role: 'USER',
    isActive: true
  }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = TEST_CONFIG.JWT_SECRET;
process.env.JWT_EXPIRES_IN = TEST_CONFIG.JWT_EXPIRES_IN;
process.env.PORT = '0'; // Use random port for tests

/**
 * Cleans up the test database
 */
async function cleanupDatabase() {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public' AND tablename != '_prisma_migrations'
  `;

  // Disable foreign key checks
  await prisma.$executeRaw`SET session_replication_role = 'replica'`;

  try {
    for (const { tablename } of tablenames) {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.error(`Error cleaning up table ${tablename}:`, error);
      }
    }
  } finally {
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = 'origin'`;
  }
}

/**
 * Creates test users (admin and regular user)
 */
async function createTestUsers() {
  // Clean up first
  await cleanupDatabase();
  
  const adminEmail = TEST_CONFIG.ADMIN_EMAIL;
  const adminPassword = TEST_CONFIG.ADMIN_PASSWORD;
  const testUserEmail = 'testuser@example.com';
  const testUserPassword = 'test123';
  
  try {
    // Delete existing test users first
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminEmail, TEST_CONFIG.USER_EMAIL]
        }
      }
    });

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: 'Test Admin',
        password: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
        isActive: true
      }
    });
    
    // Create regular user
    const user = await prisma.user.upsert({
      where: { email: TEST_CONFIG.USER_EMAIL },
      update: {},
      create: {
        email: TEST_CONFIG.USER_EMAIL,
        name: 'Test User',
        password: await bcrypt.hash(TEST_CONFIG.USER_PASSWORD, 10),
        role: 'USER',
        isActive: true
      }
    });

    // Store users globally for tests
    global.testAdmin = adminUser;
    global.testAdminPassword = adminPassword;
    global.testUser = user;
    global.testUserPassword = TEST_CONFIG.USER_PASSWORD;

    console.log('Test users created successfully');
    return { adminUser, user };
  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  }
};

/**
 * Generates a JWT token for testing
 */
const generateTestToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isActive: user.isActive !== false, // Default to true if not specified
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 1 day
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      issuer: 'accubooks-test'
    }
  );
};

// Global test setup
beforeAll(async () => {
  console.log('Global test setup');
  
  // Initialize test server if not already initialized
  if (!global.testServer) {
    global.testServer = createTestServer();
  }
  
  // Clean up any existing data
  try {
    await cleanupDatabase();
  } catch (error) {
    console.error('Error during initial cleanup:', error);
    throw error;
  }
  
  console.log('Test database cleaned up');
  
  try {
    // Create test users with unique emails
    const timestamp = Date.now();
    
    // Create a test user with MANAGER role for report operations
    global.testUser = await prisma.user.upsert({
      where: { 
        email: `testmanager-${timestamp}@example.com`
      },
      update: {},
      create: {
        email: `testmanager-${timestamp}@example.com`,
        name: 'Test Manager',
        password: await bcrypt.hash('test123', 10),
        role: 'MANAGER',
        isActive: true
      }
    });

    // Create an admin user
    global.testAdmin = await prisma.user.upsert({
      where: { 
        email: `testadmin-${timestamp}@example.com`
      },
      update: {},
      create: {
        email: `testadmin-${timestamp}@example.com`,
        name: 'Test Admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        isActive: true
      }
    });
    
    // Generate tokens for the test users
    global.testUserToken = generateAuthToken(global.testUser);
    global.testAdminToken = generateAuthToken(global.testAdmin);

    console.log('Test users created:', {
      testUser: { id: global.testUser.id, email: global.testUser.email },
      testAdmin: { id: global.testAdmin.id, email: global.testAdmin.email }
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('Global test teardown');
  
  try {
    // Clean up database
    await cleanupDatabase();
    
    // Close the test server if it exists
    if (global.testServer && typeof global.testServer.close === 'function') {
      await global.testServer.close();
      delete global.testServer;
    }
    
    // Disconnect Prisma
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Clean up global variables
    delete global.testAdmin;
    delete global.testUser;
    delete global.app;
  }
});

// Helper to get the test app instance
function getTestApp() {
  if (!global.testServer) {
    global.testServer = createTestServer();
  }
  return global.testServer.app;
}

/**
 * Creates a test server instance
 * @returns {{app: import('express').Application, server: import('http').Server, close: Function}}
 */
const createTestServer = () => {
  const app = express();
  
  // Apply middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  // Logging middleware for tests
  app.use(morgan('dev'));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: 'test' });
  });
  
  // Mock authentication middleware for testing
  app.use(async (req, res, next) => {
    try {
      // Skip auth for public paths
      if (req.path === '/health' || req.path.startsWith('/api/auth')) {
        return next();
      }
      
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      // Verify token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
        // For testing, we'll use the decoded token directly
        // In a real scenario, you might want to fetch the user from the database
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          isActive: true
        };
        next();
      } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  
  // Import routes
  const authRoutes = require('../../src/routes/auth.routes');
  const userRoutes = require('../../src/routes/user.routes');
  const reportRoutes = require('../../src/routes/report.routes');

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/reports', reportRoutes);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  // Start the server
  const server = app.listen(0);
  
  return {
    app,
    server,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

/**
 * Creates a test user with unique email to avoid conflicts
 * @param {Object} [userData] - User data to override defaults
 * @returns {Promise<import('@prisma/client').User>}
 */
async function createTestUser(userData = {}) {
  const timestamp = Date.now();
  const email = userData.email || `test-${timestamp}@example.com`;
  const name = userData.name || `Test User ${timestamp}`;
  const password = userData.password || 'test123';
  const role = userData.role || 'USER';
  const isActive = userData.isActive !== undefined ? userData.isActive : true;
  
  try {
    // Use upsert to handle potential race conditions
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: await bcrypt.hash(password, 10),
        role,
        isActive,
      },
    });
    
    // Return user with plain password for testing
    return {
      ...user,
      plainPassword: password
    };
  } catch (error) {
    console.error('Error creating/updating test user:', {
      email,
      name,
      error: error.message
    });
    throw error;
  }
}

/**
 * Creates a test admin user
 * @param {Object} [userData] - Admin user data to override defaults
 * @returns {Promise<import('@prisma/client').User>}
 */
async function createTestAdmin(userData = {}) {
  return createTestUser({
    ...TEST_CONFIG.TEST_ADMIN,
    ...userData
  });
}

/**
 * Generates a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateAuthToken(user) {
  if (!user) {
    throw new Error('User object is required to generate auth token');
  }

  // Ensure we have a valid user object with required fields
  const payload = {
    id: user.id || 1,
    email: user.email || `test-${Date.now()}@example.com`,
    role: user.role || 'USER',
    isActive: user.isActive !== undefined ? user.isActive : true,
  };

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret-key';
  }

  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      issuer: 'accubooks-test'
    });
  } catch (error) {
    console.error('Error generating auth token:', error);
    throw new Error('Failed to generate auth token');
  }
}

/**
 * Creates an authenticated request with JWT token
 * @param {Object} options - Request options
 * @param {string} [options.method='get'] - HTTP method
 * @param {string} options.url - Request URL
 * @param {string} [options.token] - JWT token (optional)
 * @param {Object} [options.data] - Request body (optional)
 * @returns {import('supertest').Test}
 */
function createAuthRequest({ method = 'get', url, token, data }) {
  if (!global.app) {
    throw new Error('Test server not initialized. Make sure to call createTestServer() first.');
  }
  
  const req = request(global.app)[method](url);
  
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  
  if (data) {
    req.send(data);
  }
  
  return req;
}

module.exports = {
  prisma,
  createTestServer,
  cleanupDatabase,
  createTestUser,
  createTestAdmin,
  createTestUsers, // Export the new function
  generateAuthToken,
  createAuthRequest,
  TEST_CONFIG
};
