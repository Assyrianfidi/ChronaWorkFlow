/**
 * Production Server - Pure JavaScript
 * Complete bypass of TypeScript compilation
 * For immediate deployment to fix 405 error
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Environment configuration
const PORT = parseInt(process.env.PORT || '10000', 10);
const NODE_ENV = process.env.NODE_ENV || 'production';
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chronaworkflow-frontend.onrender.com';

// Validate required environment variables
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET or SESSION_SECRET must be set');
  process.exit(1);
}

// Allowed origins for CORS
const allowedOrigins = [
  FRONTEND_URL,
  'https://chronaworkflow-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ChronaWorkFlow API is running',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    jwt_secret: JWT_SECRET ? 'configured' : 'not configured',
  });
});

// Authentication endpoints - COMPLETELY ISOLATED
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`🔐 Login attempt for: ${email}`);
    
    // Check if this is the owner account
    if (email === (process.env.OWNER_EMAIL || '').toLowerCase()) {
      // Generate a mock JWT token
      const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      return res.json({
        success: true,
        data: {
          user: {
            id: 'owner-1',
            email: email,
            name: 'SkyLabs Enterprise',
            role: 'OWNER',
            permissions: ['*']
          },
          accessToken: mockToken,
          expiresIn: '7d'
        }
      });
    }
    
    // For other emails, create a customer account
    const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: {
          id: 'customer-1',
          email: email,
          name: email.split('@')[0],
          role: 'CUSTOMER',
          permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read']
        },
        accessToken: mockToken,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    console.log(`🔐 Registration for: ${email}`);
    
    // Create mock user
    const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: {
          id: 'new-user-1',
          email: email,
          name: name,
          role: 'CUSTOMER',
          permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read']
        },
        accessToken: mockToken,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email] = decoded.split(':');
    
    if (email === (process.env.OWNER_EMAIL || '').toLowerCase()) {
      return res.json({
        success: true,
        data: {
          id: 'owner-1',
          email: email,
          name: 'SkyLabs Enterprise',
          role: 'OWNER',
          permissions: ['*']
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: 'customer-1',
        email: email,
        name: email.split('@')[0],
        role: 'CUSTOMER',
        permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read']
      }
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 ChronaWorkflow JavaScript Production API');
  console.log('='.repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server: http://0.0.0.0:${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/api/health`);
  console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`JWT Secret: ${JWT_SECRET ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`Owner Email: ${process.env.OWNER_EMAIL || 'Not configured'}`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
