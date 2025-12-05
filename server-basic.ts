import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AccuBooks API is healthy' });
});

// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AccuBooks API is running in basic mode',
    endpoints: [
      'GET /api/health - Health check endpoint',
      'GET / - This page',
      'API routes will be available here once the full server is running'
    ]
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Running in basic mode (minimal setup)');
});
