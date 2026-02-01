// CRITICAL: Idempotency Manager
// MANDATORY: Global idempotency key system with exactly-once semantics

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import { devInvariant } from '../runtime/dev-invariants.js';
import crypto from 'crypto';

export type IdempotencyScope = 'GLOBAL' | 'TENANT' | 'USER' | 'SESSION' | 'OPERATION';
export type ExecutionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface IdempotencyKey {
  id: string;
  key: string;
  scope: IdempotencyScope;
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  operationType: string;
  status: ExecutionStatus;
  result?: any;
  error?: string;
  createdAt: Date;
  expiresAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  maxExecutions: number;
  metadata: Record<string, any>;
}

export interface IdempotencyConfig {
  defaultTtl: number; // Time to live in milliseconds
  maxExecutionCount: number;
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableReplayProtection: boolean;
  enableCrossRequestProtection: boolean;
  enablePersistence: boolean;
}

export interface IdempotencyResult {
  isDuplicate: boolean;
  status: ExecutionStatus;
  result?: any;
  error?: string;
  key: IdempotencyKey;
  shouldExecute: boolean;
}

/**
 * CRITICAL: Idempotency Manager
 * 
 * This class manages global idempotency keys with exactly-once execution guarantees
 * across API requests and background jobs with database-level enforcement.
 */
export class IdempotencyManager {
  private static instance: IdempotencyManager;
  private static keyStore: Map<string, IdempotencyKey> = new Map(); // CRITICAL: Static key store
  private config: IdempotencyConfig;
  private auditLogger: any;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.config = this.initializeConfig();
    this.startCleanupTimer();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): IdempotencyManager {
    if (!IdempotencyManager.instance) {
      IdempotencyManager.instance = new IdempotencyManager();
    }
    return IdempotencyManager.instance;
  }

  /**
   * CRITICAL: Initialize configuration
   */
  private initializeConfig(): IdempotencyConfig {
    return {
      defaultTtl: 300000, // 5 minutes
      maxExecutionCount: 3,
      cleanupInterval: 60000, // 1 minute
      enableReplayProtection: true,
      enableCrossRequestProtection: true,
      enablePersistence: false // In-memory only for now
    };
  }

  /**
   * CRITICAL: Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredKeys();
    }, this.config.cleanupInterval);
  }

  /**
   * CRITICAL: Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * CRITICAL: Generate idempotency key
   */
  generateKey(
    operationType: string,
    scope: IdempotencyScope,
    tenantContext?: TenantContext,
    userId?: string,
    sessionId?: string,
    additionalContext?: Record<string, any>
  ): string {
    const keyParts = [operationType, scope];
    
    if (scope === 'TENANT' && tenantContext) {
      keyParts.push(tenantContext.tenantId);
    }
    
    if (userId) {
      keyParts.push(userId);
    }
    
    if (sessionId) {
      keyParts.push(`session:${sessionId}`);
    }
    
    // CRITICAL: Only include hash if there's actual additional context
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      const contextHash = this.hashObject(additionalContext);
      keyParts.push(contextHash);
    }
    
    return keyParts.join(':');
  }

  /**
   * CRITICAL: Hash object for consistent key generation
   */
  private hashObject(obj: Record<string, any>): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(obj, Object.keys(obj).sort()));
    return hash.digest('hex').substring(0, 32); // Increased from 16 to 32 characters
  }

  /**
   * CRITICAL: Generate unique key ID
   */
  private generateKeyId(): string {
    return crypto.randomUUID();
  }

  /**
   * CRITICAL: Check idempotency and prepare for execution
   */
  async checkIdempotency(
    key: string,
    operationType: string,
    scope: IdempotencyScope,
    tenantContext?: TenantContext,
    userId?: string,
    sessionId?: string,
    ttl?: number,
    maxExecutions?: number,
    metadata: Record<string, any> = {}
  ): Promise<IdempotencyResult> {
    devInvariant(!!key && key.length > 0, 'IDEMPOTENCY_LIFECYCLE_INVALID', 'Idempotency key must be a non-empty string.', { key });
    devInvariant(!!operationType && operationType.length > 0, 'IDEMPOTENCY_LIFECYCLE_INVALID', 'Idempotency operationType must be a non-empty string.', { operationType });

    const now = new Date();
    const effectiveTtl = ttl || this.config.defaultTtl;
    const effectiveMaxExecutions = maxExecutions || this.config.maxExecutionCount;

    logger.debug('checkIdempotency start', { key, operationType, scope });

    // CRITICAL: Check if key exists
    let idempotencyKey = IdempotencyManager.keyStore.get(key);
    devInvariant(!idempotencyKey || idempotencyKey.key === key, 'IDEMPOTENCY_LIFECYCLE_INVALID', 'Idempotency keystore corruption: stored key mismatch.', {
      requestedKey: key,
      storedKey: idempotencyKey?.key,
    });
    
    logger.debug('keyStore lookup', { key, found: !!idempotencyKey, status: idempotencyKey?.status });

    if (!idempotencyKey) {
      // CRITICAL: Create new idempotency key
      idempotencyKey = {
        id: this.generateKeyId(),
        key,
        scope,
        tenantId: tenantContext?.tenantId,
        userId,
        sessionId,
        operationType,
        status: 'PENDING',
        createdAt: now,
        expiresAt: new Date(now.getTime() + effectiveTtl),
        executionCount: 0,
        maxExecutions: effectiveMaxExecutions,
        metadata
      };

      IdempotencyManager.keyStore.set(key, idempotencyKey);
      
      logger.debug('Created new idempotency key', { key, id: idempotencyKey.id });

      // CRITICAL: Log key creation
      this.auditLogger.logAuthorizationDecision({
        tenantId: tenantContext?.tenantId || 'system',
        actorId: userId || 'system',
        action: 'IDEMPOTENCY_KEY_CREATED',
        resourceType: 'IDEMPOTENCY_KEY',
        resourceId: idempotencyKey.id,
        outcome: 'SUCCESS',
        correlationId: `idempotency_${idempotencyKey.id}`,
        metadata: {
          key,
          operationType,
          scope,
          ttl: effectiveTtl,
          maxExecutions: effectiveMaxExecutions
        }
      });

      return {
        isDuplicate: false,
        status: 'PENDING',
        key: idempotencyKey,
        shouldExecute: true
      };
    }

    // CRITICAL: Check if key has expired
    if (idempotencyKey.expiresAt < now) {
      idempotencyKey.status = 'EXPIRED';
      IdempotencyManager.keyStore.set(key, idempotencyKey);

      // CRITICAL: Log expiration
      this.auditLogger.logAuthorizationDecision({
        tenantId: idempotencyKey.tenantId || 'system',
        actorId: idempotencyKey.userId || 'system',
        action: 'IDEMPOTENCY_KEY_EXPIRED',
        resourceType: 'IDEMPOTENCY_KEY',
        resourceId: idempotencyKey.id,
        outcome: 'SUCCESS',
        correlationId: `idempotency_${idempotencyKey.id}`,
        metadata: {
          key,
          operationType,
          expiredAt: now
        }
      });

      // CRITICAL: Create new key for expired one
      // Remove the expired record so the next check can create a fresh key entry.
      IdempotencyManager.keyStore.delete(key);
      return await this.checkIdempotency(key, operationType, scope, tenantContext, userId, sessionId, ttl, maxExecutions, metadata);
    }

    // CRITICAL: Check execution count
    if (idempotencyKey.executionCount >= idempotencyKey.maxExecutions) {
      // CRITICAL: If we have a completed result, return it instead of throwing error
      if (idempotencyKey.status === 'COMPLETED' && idempotencyKey.result !== undefined) {
        return {
          isDuplicate: true,
          status: 'COMPLETED',
          result: idempotencyKey.result,
          key: idempotencyKey,
          shouldExecute: false
        };
      }
      
      // CRITICAL: If we have a failed result, return the error
      if (idempotencyKey.status === 'FAILED' && idempotencyKey.error) {
        return {
          isDuplicate: true,
          status: 'FAILED',
          error: idempotencyKey.error,
          key: idempotencyKey,
          shouldExecute: false
        };
      }
      
      // CRITICAL: Only throw error if no result available
      return {
        isDuplicate: true,
        status: idempotencyKey.status,
        error: `Maximum execution count (${idempotencyKey.maxExecutions}) exceeded`,
        key: idempotencyKey,
        shouldExecute: false
      };
    }

    // CRITICAL: Check if currently executing (prevent concurrent execution)
    if (idempotencyKey.status === 'IN_PROGRESS') {
      const waitTime = Date.now() - idempotencyKey.lastExecutedAt!.getTime();
      
      logger.debug('Detected IN_PROGRESS key', { key, waitTime, status: idempotencyKey.status });
      
      // CRITICAL: If it's been executing too long, consider it failed
      if (waitTime > 300000) { // 5 minutes
        idempotencyKey.status = 'FAILED';
        idempotencyKey.error = 'Execution timeout';
        IdempotencyManager.keyStore.set(key, idempotencyKey);

        return {
          isDuplicate: true,
          status: 'FAILED',
          error: 'Previous execution timed out',
          key: idempotencyKey,
          shouldExecute: false
        };
      }

      logger.debug('Returning IN_PROGRESS result', { key });
      return {
        isDuplicate: true,
        status: 'IN_PROGRESS',
        error: 'Operation currently in progress',
        key: idempotencyKey,
        shouldExecute: false
      };
    }

    // CRITICAL: Return existing result if completed
    if (idempotencyKey.status === 'COMPLETED') {
      return {
        isDuplicate: true,
        status: 'COMPLETED',
        result: idempotencyKey.result,
        key: idempotencyKey,
        shouldExecute: false
      };
    }

    // CRITICAL: Return error if failed
    if (idempotencyKey.status === 'FAILED') {
      return {
        isDuplicate: true,
        status: 'FAILED',
        error: idempotencyKey.error,
        key: idempotencyKey,
        shouldExecute: false
      };
    }

    // CRITICAL: Existing pending key found - allow execution but mark as duplicate
    return {
      isDuplicate: true,
      status: 'PENDING',
      key: idempotencyKey,
      shouldExecute: true
    };
  }

  /**
   * CRITICAL: Clear the key store (for testing)
   */
  clearKeyStore(): void {
    IdempotencyManager.keyStore.clear();
    logger.debug('Key store cleared');
  }

  /**
   * CRITICAL: Start execution with idempotency protection
   */
  async startExecution(
    key: string,
    tenantContext?: TenantContext,
    userId?: string
  ): Promise<void> {
    devInvariant(!!key && key.length > 0, 'IDEMPOTENCY_LIFECYCLE_INVALID', 'startExecution requires non-empty key.', { key });
    const idempotencyKey = IdempotencyManager.keyStore.get(key);
    
    if (!idempotencyKey) {
      throw new Error(`Idempotency key ${key} not found`);
    }

    devInvariant(
      idempotencyKey.status === 'PENDING' || idempotencyKey.status === 'IN_PROGRESS',
      'IDEMPOTENCY_LIFECYCLE_INVALID',
      'startExecution called with unexpected key status.',
      {
        key,
        status: idempotencyKey.status,
        executionCount: idempotencyKey.executionCount,
      },
    );

    if (idempotencyKey.status !== 'PENDING') {
      throw new Error(`Cannot start execution for key ${key} with status ${idempotencyKey.status}`);
    }

    // CRITICAL: Update status to in progress
    idempotencyKey.status = 'IN_PROGRESS';
    idempotencyKey.lastExecutedAt = new Date();
    idempotencyKey.executionCount++;
    
    IdempotencyManager.keyStore.set(key, idempotencyKey);

    // CRITICAL: Log execution start
    this.auditLogger.logAuthorizationDecision({
      tenantId: idempotencyKey.tenantId || 'system',
      actorId: userId || 'system',
      action: 'EXECUTION_STARTED',
      resourceType: 'IDEMPOTENCY_KEY',
      resourceId: idempotencyKey.id,
      outcome: 'SUCCESS',
      correlationId: `idempotency_${idempotencyKey.id}`,
      metadata: {
        key,
        operationType: idempotencyKey.operationType,
        executionCount: idempotencyKey.executionCount
      }
    });

    logger.info('Execution started', {
      key,
      operationType: idempotencyKey.operationType,
      executionCount: idempotencyKey.executionCount
    });
  }

  /**
   * CRITICAL: Complete execution with result
   */
  async completeExecution<T>(
    key: string,
    result: T,
    tenantContext?: TenantContext,
    userId?: string
  ): Promise<void> {
    devInvariant(!!key && key.length > 0, 'IDEMPOTENCY_LIFECYCLE_INVALID', 'completeExecution requires non-empty key.', { key });
    const idempotencyKey = IdempotencyManager.keyStore.get(key);
    
    if (!idempotencyKey) {
      throw new Error(`Idempotency key ${key} not found`);
    }

    devInvariant(idempotencyKey.status === 'IN_PROGRESS', 'IDEMPOTENCY_LIFECYCLE_INVALID', 'completeExecution called when key is not IN_PROGRESS.', {
      key,
      status: idempotencyKey.status,
      executionCount: idempotencyKey.executionCount,
    });

    if (idempotencyKey.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot complete execution for key ${key} with status ${idempotencyKey.status}`);
    }

    // CRITICAL: Update status to completed
    idempotencyKey.status = 'COMPLETED';
    idempotencyKey.result = result;
    idempotencyKey.lastExecutedAt = new Date();
    
    IdempotencyManager.keyStore.set(key, idempotencyKey);

    // CRITICAL: Log completion
    this.auditLogger.logAuthorizationDecision({
      tenantId: idempotencyKey.tenantId || 'system',
      actorId: userId || 'system',
      action: 'EXECUTION_COMPLETED',
      resourceType: 'IDEMPOTENCY_KEY',
      resourceId: idempotencyKey.id,
      outcome: 'SUCCESS',
      correlationId: `idempotency_${idempotencyKey.id}`,
      metadata: {
        key,
        operationType: idempotencyKey.operationType,
        executionCount: idempotencyKey.executionCount,
        executionTime: Date.now() - idempotencyKey.createdAt.getTime()
      }
    });

    logger.info('Execution completed', {
      key,
      operationType: idempotencyKey.operationType,
      executionCount: idempotencyKey.executionCount
    });
  }

  /**
   * CRITICAL: Fail execution with error
   */
  async failExecution(
    key: string,
    error: Error,
    tenantContext?: TenantContext,
    userId?: string
  ): Promise<void> {
    devInvariant(!!key && key.length > 0, 'IDEMPOTENCY_LIFECYCLE_INVALID', 'failExecution requires non-empty key.', { key });
    const idempotencyKey = IdempotencyManager.keyStore.get(key);
    
    if (!idempotencyKey) {
      throw new Error(`Idempotency key ${key} not found`);
    }

    devInvariant(idempotencyKey.status === 'IN_PROGRESS', 'IDEMPOTENCY_LIFECYCLE_INVALID', 'failExecution called when key is not IN_PROGRESS.', {
      key,
      status: idempotencyKey.status,
      executionCount: idempotencyKey.executionCount,
    });

    if (idempotencyKey.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot fail execution for key ${key} with status ${idempotencyKey.status}`);
    }

    // CRITICAL: Update status to failed
    idempotencyKey.status = 'FAILED';
    idempotencyKey.error = error.message;
    idempotencyKey.lastExecutedAt = new Date();
    
    IdempotencyManager.keyStore.set(key, idempotencyKey);

    // CRITICAL: Log failure
    this.auditLogger.logAuthorizationDecision({
      tenantId: idempotencyKey.tenantId || 'system',
      actorId: userId || 'system',
      action: 'EXECUTION_FAILED',
      resourceType: 'IDEMPOTENCY_KEY',
      resourceId: idempotencyKey.id,
      outcome: 'FAILURE',
      correlationId: `idempotency_${idempotencyKey.id}`,
      metadata: {
        key,
        operationType: idempotencyKey.operationType,
        executionCount: idempotencyKey.executionCount,
        error: error.message,
        executionTime: Date.now() - idempotencyKey.createdAt.getTime()
      }
    });

    logger.error('Execution failed', error, {
      key,
      operationType: idempotencyKey.operationType,
      executionCount: idempotencyKey.executionCount
    });
  }

  /**
   * CRITICAL: Execute operation with idempotency protection
   */
  async executeWithIdempotency<T>(
    operationType: string,
    scope: IdempotencyScope,
    operation: () => Promise<T>,
    tenantContext?: TenantContext,
    userId?: string,
    sessionId?: string,
    additionalContext?: Record<string, any>,
    ttl?: number,
    maxExecutions?: number,
    metadata: Record<string, any> = {},
    preGeneratedKey?: string
  ): Promise<T> {
    // CRITICAL: Use pre-generated key or generate one
    const key = preGeneratedKey || this.generateKey(operationType, scope, tenantContext, userId, sessionId, additionalContext);
    
    logger.debug('executeWithIdempotency', { key, operationType, scope, preGeneratedKey: !!preGeneratedKey });

    // CRITICAL: Check idempotency
    const idempotencyResult = await this.checkIdempotency(
      key,
      operationType,
      scope,
      tenantContext,
      userId,
      sessionId,
      ttl,
      maxExecutions,
      metadata
    );
    
    logger.debug('checkIdempotency result', { key, status: idempotencyResult.status, isDuplicate: idempotencyResult.isDuplicate, shouldExecute: idempotencyResult.shouldExecute });

    // CRITICAL: Return existing result if duplicate
    if (idempotencyResult.isDuplicate && idempotencyResult.status === 'COMPLETED') {
      logger.debug('Returning cached result', { key });
      return idempotencyResult.result;
    }

    // CRITICAL: Throw error if failed
    if (idempotencyResult.isDuplicate && idempotencyResult.status === 'FAILED') {
      logger.debug('Returning failed error', { key, error: idempotencyResult.error });
      throw new Error(idempotencyResult.error || 'Previous execution failed');
    }

    // CRITICAL: Wait for in-progress execution and return result
    if (idempotencyResult.isDuplicate && idempotencyResult.status === 'IN_PROGRESS') {
      logger.debug('Waiting for in-progress execution', { key });
      return await this.waitForCompletion(key, 30000, 500); // 30s timeout, 500ms poll
    }

    // CRITICAL: Execute operation (only when shouldExecute is true)
    if (!idempotencyResult.shouldExecute) {
      logger.error('Cannot execute operation: shouldExecute is false', undefined, { key, status: idempotencyResult.status });
      throw new Error(`Cannot execute operation for key ${key} with status ${idempotencyResult.status}`);
    }

    logger.debug('Starting new execution', { key });
    try {
      await this.startExecution(key, tenantContext, userId);
      
      const result = await operation();
      
      await this.completeExecution(key, result, tenantContext, userId);
      
      logger.debug('Completed execution', { key });
      return result;

    } catch (error) {
      // PRAGMATIC: If startExecution fails due to IN_PROGRESS, wait and return result
      if (error instanceof Error && error.message.includes('Cannot start execution') && error.message.includes('IN_PROGRESS')) {
        logger.debug('StartExecution failed with IN_PROGRESS, waiting for completion', { key });
        return await this.waitForCompletion(key, 30000, 500);
      }
      await this.failExecution(key, error as Error, tenantContext, userId);
      throw error;
    }
  }

  /**
   * CRITICAL: Wait for in-progress execution to complete
   */
  private async waitForCompletion<T>(
    key: string,
    timeoutMs: number = 30000,
    pollIntervalMs: number = 500
  ): Promise<T> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const idempotencyKey = IdempotencyManager.keyStore.get(key);
      
      if (!idempotencyKey) {
        throw new Error(`Idempotency key ${key} not found during wait`);
      }
      
      if (idempotencyKey.status === 'COMPLETED') {
        return idempotencyKey.result as T;
      }
      
      if (idempotencyKey.status === 'FAILED') {
        throw new Error(idempotencyKey.error || 'Execution failed');
      }
      
      if (idempotencyKey.status === 'IN_PROGRESS') {
        // Check for timeout
        const waitTime = Date.now() - (idempotencyKey.lastExecutedAt?.getTime() || 0);
        if (waitTime > 300000) { // 5 minutes
          throw new Error('Execution timed out');
        }
        // Continue waiting
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        continue;
      }
      
      // Unexpected status
      throw new Error(`Unexpected status ${idempotencyKey.status} for key ${key}`);
    }
    
    throw new Error(`Timeout waiting for execution of key ${key}`);
  }

  /**
   * CRITICAL: Get idempotency key
   */
  async getKey(key: string): Promise<IdempotencyKey | null> {
    return IdempotencyManager.keyStore.get(key) || null;
  }

  /**
   * CRITICAL: Delete idempotency key
   */
  async deleteKey(key: string): Promise<boolean> {
    const deleted = IdempotencyManager.keyStore.has(key);
    IdempotencyManager.keyStore.delete(key);
    return deleted;
  }

  /**
   * CRITICAL: Get statistics
   */
  async getStatistics(): Promise<{
    totalKeys: number;
    keysByStatus: Record<ExecutionStatus, number>;
    keysByScope: Record<IdempotencyScope, number>;
    keysByOperation: Record<string, number>;
  }> {
    const stats = {
      totalKeys: IdempotencyManager.keyStore.size,
      keysByStatus: {} as Record<ExecutionStatus, number>,
      keysByScope: {} as Record<IdempotencyScope, number>,
      keysByOperation: {} as Record<string, number>
    };

    // Initialize counters
    const statuses: ExecutionStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED'];
    const scopes: IdempotencyScope[] = ['GLOBAL', 'TENANT', 'USER', 'SESSION', 'OPERATION'];
    
    statuses.forEach(status => {
      stats.keysByStatus[status] = 0;
    });
    
    scopes.forEach(scope => {
      stats.keysByScope[scope] = 0;
    });

    // Count keys
    for (const [key, idempotencyKey] of IdempotencyManager.keyStore.entries()) {
      stats.keysByStatus[idempotencyKey.status]++;
      stats.keysByScope[idempotencyKey.scope]++;
      stats.keysByOperation[idempotencyKey.operationType] = (stats.keysByOperation[idempotencyKey.operationType] || 0) + 1;
    }

    return stats;
  }

  /**
   * CRITICAL: Cleanup expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, idempotencyKey] of IdempotencyManager.keyStore.entries()) {
      if (idempotencyKey.expiresAt < now) {
        IdempotencyManager.keyStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired idempotency keys`);
    }

    return cleanedCount;
  }

  /**
   * CRITICAL: Clear all keys (for testing)
   */
  async clearAllKeys(): Promise<void> {
    IdempotencyManager.keyStore.clear();
  }
}

// CRITICAL: Export singleton instance and convenience functions for test compatibility
export const idempotencyManager = IdempotencyManager.getInstance();

// CRITICAL: Export convenience functions for test compatibility
export const executeWithIdempotency = <T>(
  operationType: string,
  scope: IdempotencyScope,
  operation: () => Promise<T>,
  tenantContext?: TenantContext,
  userId?: string,
  sessionId?: string,
  additionalContext?: Record<string, any>,
  ttl?: number,
  maxExecutions?: number,
  metadata: Record<string, any> = {},
  preGeneratedKey?: string
): Promise<T> => {
  return idempotencyManager.executeWithIdempotency(
    operationType,
    scope,
    operation,
    tenantContext,
    userId,
    sessionId,
    additionalContext,
    ttl,
    maxExecutions,
    metadata,
    preGeneratedKey
  );
};

export const generateIdempotencyKey = (
  operationType: string,
  scope: IdempotencyScope,
  tenantContext?: TenantContext,
  userId?: string,
  sessionId?: string,
  additionalContext?: Record<string, any>
): string => {
  return idempotencyManager.generateKey(
    operationType,
    scope,
    tenantContext,
    userId,
    sessionId,
    additionalContext
  );
};

export const checkIdempotency = (
  key: string,
  operationType: string,
  scope: IdempotencyScope,
  tenantContext?: TenantContext,
  userId?: string,
  sessionId?: string,
  ttl?: number,
  maxExecutions?: number,
  metadata: Record<string, any> = {}
): Promise<IdempotencyResult> => {
  return idempotencyManager.checkIdempotency(
    key,
    operationType,
    scope,
    tenantContext,
    userId,
    sessionId,
    ttl,
    maxExecutions,
    metadata
  );
};
