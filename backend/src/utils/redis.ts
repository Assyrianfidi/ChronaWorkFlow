/**
 * ============================================================================
 * SINGLE REDIS CLIENT EXPORT
 * ============================================================================
 * 
 * This is the ONLY allowed Redis client export in the application.
 * 
 * RULES:
 * 1. All services MUST import from this file
 * 2. Direct ioredis imports are FORBIDDEN in services
 * 3. Only TenantRedisClient may be used (enforces tenant-scoped keys)
 * 
 * ENFORCEMENT:
 * - ESLint rule blocks direct ioredis imports
 * - CI script fails build if services use new Redis()
 * - Boot validation checks for violations
 * 
 * ============================================================================
 */

import { TenantRedisClient } from './redis-tenant-enforcer.js';

/**
 * Singleton Redis client instance
 */
let _redisClient: TenantRedisClient | null = null;

/**
 * Get the singleton tenant-safe Redis client
 * 
 * This is the ONLY way services should access Redis.
 * 
 * @returns TenantRedisClient instance with tenant-scoped key enforcement
 */
export function getRedisClient(): TenantRedisClient {
  if (!_redisClient) {
    _redisClient = new TenantRedisClient();
  }
  return _redisClient;
}

/**
 * Re-export TenantRedisClient class for type definitions
 */
export { TenantRedisClient } from './redis-tenant-enforcer.js';

/**
 * ❌ DO NOT EXPORT:
 * - Direct Redis client
 * - new Redis() instances
 * - Unscoped cache methods
 * 
 * ✅ ONLY EXPORT:
 * - getRedisClient() function
 * - TenantRedisClient class (for types)
 */
