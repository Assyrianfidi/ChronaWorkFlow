import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '../utils/logger';
import { getDatabaseConfig } from '../config/env-validation';

// Database connection using validated environment variable
const connectionString = getDatabaseConfig();

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

export { db, client };

// Initialize database connection
export async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...');

    // Test the connection
    await client`SELECT 1`;
    logger.info('Database connection established successfully');

    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}
