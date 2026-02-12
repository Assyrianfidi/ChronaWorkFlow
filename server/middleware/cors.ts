import cors from 'cors';
import { Request } from 'express';

/**
 * Production-grade CORS configuration for AccuBooks API
 * Allows frontend to communicate with backend across different domains
 */

const allowedOrigins = [
  'https://chronaworkflow.onrender.com',
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
];

// Add environment-specific origins
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
  maxAge: 86400, // 24 hours
});

/**
 * Log CORS configuration on startup
 */
export function logCorsConfig() {
  console.log('🔒 CORS Configuration:');
  console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Credentials: enabled`);
  console.log(`   Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`);
}
