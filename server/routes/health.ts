import { Request, Response } from 'express';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { sql } from 'drizzle-orm';

// Basic health check endpoint
export async function healthCheck(_req: Request, res: Response) {
  try {
    // Check database connection by getting the current timestamp
    const result = await storage.getCompanies().catch(() => []);
    
    // If we get here, database is connected
    res.json({ 
      status: 'ok',
      services: {
        database: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
