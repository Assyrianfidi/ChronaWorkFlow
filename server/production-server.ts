/**
 * Production-Ready Backend Server for ChronaWorkflow
 * Minimal, focused implementation for Render deployment
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Environment configuration
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chronaworkflow.onrender.com';

// Allowed origins for CORS
const allowedOrigins = [
  FRONTEND_URL,
  'https://chronaworkflow.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'ChronaWorkflow API is running',
    version: '1.0.0',
    environment: NODE_ENV,
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    database: DATABASE_URL ? 'configured' : 'not configured',
  });
});

// Auth endpoints (simplified for initial deployment)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // TODO: Implement actual authentication logic
    // For now, return a mock response to test the connection
    console.log(`Login attempt for: ${email}`);
    
    res.json({
      message: 'Authentication endpoint is working',
      note: 'Full authentication implementation pending database connection',
      email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'All fields are required',
      });
    }

    console.log(`Registration attempt for: ${email}`);
    
    res.json({
      message: 'Registration endpoint is working',
      note: 'Full registration implementation pending database connection',
      email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 ChronaWorkflow Backend API');
  console.log('='.repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server: http://0.0.0.0:${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/api/health`);
  console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`Database: ${DATABASE_URL ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`JWT Secret: ${JWT_SECRET ? '✅ Configured' : '⚠️  Not configured'}`);
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

export default app;
