import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import auth router
import authRouter from './routes/auth-unified';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://chronaworkflow-frontend.onrender.com',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ChronaWorkFlow Auth API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount auth router
app.use('/api/auth', authRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Auth server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handling
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Minimal Auth Server running on port ${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`   POST http://localhost:${PORT}/api/auth/logout`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔧 Frontend URL: ${process.env.FRONTEND_URL}`);
});
