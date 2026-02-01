// Database connection pool configuration
// Phase 1: Database Pool Scaling Implementation
// Date: February 1, 2026
// Change: max 50 → 200, min 10 → 20

export const getDatabasePoolConfig = () => ({
  max: parseInt(process.env.DB_POOL_MAX || '200', 10),
  min: parseInt(process.env.DB_POOL_MIN || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
});
