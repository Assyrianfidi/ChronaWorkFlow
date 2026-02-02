// Database connection setup using javascript_database blueprint
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "../shared/schema";
import { getDatabaseConfig } from "./config/env-validation";
import { getDatabasePoolConfig } from "./config/database-pool";

let connectionString: string | null = null;
let _pool: NeonPool | PgPool | null = null;
let _db: any = null;
let _dbInitialized = false;
let _dbAvailable = false;

function isNeonConnectionString(url: string): boolean {
  // Neon typically uses hosts like: ep-xxx-yyy.us-east-2.aws.neon.tech
  // Keep this conservative so local/dev postgres uses the standard pg driver.
  return /(^|\.)neon\.tech\b/i.test(url) || /pooler\./i.test(url);
}

/**
 * Initialize database connection lazily.
 * This allows the server to start even if DB is temporarily unavailable.
 */
export async function initializeDatabase(): Promise<{ success: boolean; error?: string }> {
  if (_dbInitialized) {
    return { success: _dbAvailable };
  }

  try {
    connectionString = getDatabaseConfig();
    
    const poolConfig = {
      connectionString,
      ...getDatabasePoolConfig(),
    };

    if (isNeonConnectionString(connectionString)) {
      neonConfig.webSocketConstructor = ws;
      _pool = new NeonPool(poolConfig);
      _db = drizzleNeon({ client: _pool as any, schema });
    } else {
      _pool = new PgPool(poolConfig);
      _db = drizzlePg({ client: _pool as any, schema });
    }

    // Test connection with timeout
    const testQuery = _pool.query('SELECT 1 as test');
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );

    await Promise.race([testQuery, timeout]);
    
    _dbAvailable = true;
    _dbInitialized = true;
    console.log('✅ Database connection established');
    return { success: true };
  } catch (error) {
    _dbInitialized = true;
    _dbAvailable = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('⚠️  Database connection failed:', errorMsg);
    console.warn('⚠️  Server will start in degraded mode. Database-dependent routes will return 503.');
    return { success: false, error: errorMsg };
  }
}

/**
 * Get database pool. Throws if not initialized or unavailable.
 */
export const pool = new Proxy({} as NeonPool | PgPool, {
  get(_target, prop) {
    if (!_dbInitialized) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    if (!_dbAvailable || !_pool) {
      throw new Error('Database unavailable. Server running in degraded mode.');
    }
    return (_pool as any)[prop];
  }
});

/**
 * Get drizzle database instance. Throws if not initialized or unavailable.
 */
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (!_dbInitialized) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    if (!_dbAvailable || !_db) {
      throw new Error('Database unavailable. Server running in degraded mode.');
    }
    return _db[prop];
  }
});

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  return _dbInitialized && _dbAvailable;
}

/**
 * Get database status for health checks
 */
export function getDatabaseStatus(): { initialized: boolean; available: boolean } {
  return {
    initialized: _dbInitialized,
    available: _dbAvailable
  };
}
