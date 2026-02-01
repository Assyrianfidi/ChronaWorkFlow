// CRITICAL: Queue Boundaries & Decoupling
// MANDATORY: Queue-based decoupling for critical workflows with blast radius control

import { logger } from '../utils/structured-logger.js';
import { metrics } from '../utils/metrics.js';
import crypto from 'crypto';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export type QueuePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';
export type QueueStatus = 'ACTIVE' | 'DEGRADED' | 'ISOLATED' | 'CIRCUIT_BROKEN';

export interface QueueMessage {
  id: string;
  tenantId: string;
  queueName: string;
  priority: QueuePriority;
  payload: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  delayUntil?: Date;
  createdAt: Date;
  scheduledAt: Date;
  expiresAt: Date;
  correlationId: string;
  metadata: Record<string, any>;
}

export interface QueueConfig {
  maxSize: number;
  processingConcurrency: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
  };
  deadLetterQueue: boolean;
  priorityQueues: boolean;
  tenantIsolation: boolean;
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

export interface QueueMetrics {
  totalMessages: number;
  pendingMessages: number;
  processingMessages: number;
  completedMessages: number;
  failedMessages: number;
  deadLetterMessages: number;
  averageProcessingTime: number;
  throughputPerSecond: number;
  errorRate: number;
  tenantBacklog: Record<string, number>;
  priorityBacklog: Record<QueuePriority, number>;
}

export interface QueueBoundary {
  queueName: string;
  status: QueueStatus;
  config: QueueConfig;
  metrics: QueueMetrics;
  lastActivity: Date;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  tenantQuarantines: Set<string>;
  rateLimits: Map<string, { count: number; resetTime: Date }>;
}

/**
 * CRITICAL: Queue Boundary Manager
 * 
 * This class manages queue boundaries with tenant isolation, priority processing,
 * and circuit breaker protection to prevent cascade failures.
 */
export class QueueBoundaryManager {
  private static instance: QueueBoundaryManager;
  private auditLogger: any;
  private boundaries: Map<string, QueueBoundary> = new Map();
  private messageStore: Map<string, QueueMessage> = new Map();
  private processors: Map<string, NodeJS.Timeout> = new Map();
  private defaultConfig: QueueConfig;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.defaultConfig = this.initializeDefaultConfig();
    this.startQueueMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): QueueBoundaryManager {
    if (!QueueBoundaryManager.instance) {
      QueueBoundaryManager.instance = new QueueBoundaryManager();
    }
    return QueueBoundaryManager.instance;
  }

  /**
   * CRITICAL: Create or get queue boundary
   */
  getQueueBoundary(queueName: string, config: Partial<QueueConfig> = {}): QueueBoundary {
    let boundary = this.boundaries.get(queueName);
    
    if (!boundary) {
      const mergedConfig = { ...this.defaultConfig, ...config };
      boundary = this.initializeBoundary(queueName, mergedConfig);
      this.boundaries.set(queueName, boundary);
      this.startQueueProcessor(queueName);
    }

    return boundary;
  }

  /**
   * CRITICAL: Enqueue message with boundary protection
   */
  async enqueue(
    queueName: string,
    tenantId: string,
    payload: Record<string, any>,
    priority: QueuePriority = 'NORMAL',
    delayUntil?: Date,
    correlationId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const boundary = this.getQueueBoundary(queueName);
    const messageId = this.generateMessageId();

    // CRITICAL: Validate enqueue preconditions
    this.validateEnqueuePreconditions(boundary, tenantId, priority);

    const message: QueueMessage = {
      id: messageId,
      tenantId,
      queueName,
      priority,
      payload,
      attempts: 0,
      maxAttempts: boundary.config.retryPolicy.maxAttempts,
      delayUntil,
      createdAt: new Date(),
      scheduledAt: delayUntil || new Date(),
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
      correlationId: correlationId || this.generateCorrelationId(),
      metadata
    };

    // CRITICAL: Store message
    this.messageStore.set(messageId, message);

    // CRITICAL: Update metrics
    this.updateBoundaryMetrics(boundary, 'ENQUEUE', message);

    // CRITICAL: Log enqueue
    this.auditLogger.logDataMutation({
      tenantId,
      actorId: 'queue-system',
      action: 'MESSAGE_ENQUEUED',
      resourceType: 'QUEUE_MESSAGE',
      resourceId: messageId,
      outcome: 'SUCCESS',
      correlationId: message.correlationId,
      metadata: {
        queueName,
        priority,
        scheduledAt: message.scheduledAt,
        payloadSize: JSON.stringify(payload).length
      }
    });

    logger.info('Message enqueued', {
      messageId,
      queueName,
      tenantId,
      priority,
      scheduledAt: message.scheduledAt
    });

    return messageId;
  }

  /**
   * CRITICAL: Dequeue message with boundary protection
   */
  async dequeue(queueName: string, tenantId?: string): Promise<QueueMessage | null> {
    const boundary = this.getQueueBoundary(queueName);

    // CRITICAL: Check boundary status
    if (boundary.status === 'CIRCUIT_BROKEN') {
      throw new Error(`Queue ${queueName} is circuit broken`);
    }

    if (boundary.status === 'ISOLATED') {
      throw new Error(`Queue ${queueName} is isolated`);
    }

    // CRITICAL: Find next message
    const message = this.findNextMessage(boundary, tenantId);
    
    if (!message) {
      return null;
    }

    // CRITICAL: Update message state
    message.attempts++;
    this.messageStore.set(message.id, message);

    // CRITICAL: Update metrics
    this.updateBoundaryMetrics(boundary, 'DEQUEUE', message);

    // CRITICAL: Log dequeue
    this.auditLogger.logDataMutation({
      tenantId: message.tenantId,
      actorId: 'queue-system',
      action: 'MESSAGE_DEQUEUED',
      resourceType: 'QUEUE_MESSAGE',
      resourceId: message.id,
      outcome: 'SUCCESS',
      correlationId: message.correlationId,
      metadata: {
        queueName,
        attempts: message.attempts,
        processingTime: Date.now() - message.createdAt.getTime()
      }
    });

    return message;
  }

  /**
   * CRITICAL: Acknowledge message completion
   */
  async acknowledge(messageId: string, result?: any): Promise<void> {
    const message = this.messageStore.get(messageId);
    
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    const boundary = this.getQueueBoundary(message.queueName);

    // CRITICAL: Remove message from store
    this.messageStore.delete(messageId);

    // CRITICAL: Update metrics
    this.updateBoundaryMetrics(boundary, 'ACKNOWLEDGE', message);

    // CRITICAL: Log acknowledgment
    this.auditLogger.logDataMutation({
      tenantId: message.tenantId,
      actorId: 'queue-system',
      action: 'MESSAGE_ACKNOWLEDGED',
      resourceType: 'QUEUE_MESSAGE',
      resourceId: messageId,
      outcome: 'SUCCESS',
      correlationId: message.correlationId,
      metadata: {
        queueName: message.queueName,
        attempts: message.attempts,
        processingTime: Date.now() - message.createdAt.getTime(),
        result: result ? 'SUCCESS' : 'NO_RESULT'
      }
    });

    logger.info('Message acknowledged', {
      messageId,
      queueName: message.queueName,
      tenantId: message.tenantId,
      attempts: message.attempts
    });
  }

  /**
   * CRITICAL: Reject message (retry or dead letter)
   */
  async reject(messageId: string, error: Error, shouldRetry: boolean = true): Promise<void> {
    const message = this.messageStore.get(messageId);
    
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    const boundary = this.getQueueBoundary(message.queueName);

    // CRITICAL: Check if should retry
    if (shouldRetry && message.attempts < message.maxAttempts) {
      // CRITICAL: Schedule retry with exponential backoff
      const retryDelay = this.calculateRetryDelay(message.attempts, boundary.config.retryPolicy);
      message.delayUntil = new Date(Date.now() + retryDelay);
      message.scheduledAt = message.delayUntil;
      
      this.messageStore.set(messageId, message);

      // CRITICAL: Update metrics
      this.updateBoundaryMetrics(boundary, 'RETRY', message);

      // CRITICAL: Log retry
      this.auditLogger.logDataMutation({
        tenantId: message.tenantId,
        actorId: 'queue-system',
        action: 'MESSAGE_RETRY',
        resourceType: 'QUEUE_MESSAGE',
        resourceId: messageId,
        outcome: 'SUCCESS',
        correlationId: message.correlationId,
        metadata: {
          queueName: message.queueName,
          attempts: message.attempts,
          retryDelay,
          error: error.message
        }
      });

      logger.warn('Message scheduled for retry', {
        messageId,
        queueName: message.queueName,
        tenantId: message.tenantId,
        attempts: message.attempts,
        retryDelay
      });

    } else {
      // CRITICAL: Send to dead letter queue
      await this.sendToDeadLetterQueue(message, error);
    }
  }

  /**
   * CRITICAL: Get queue boundary metrics
   */
  getBoundaryMetrics(queueName: string): QueueMetrics | null {
    const boundary = this.boundaries.get(queueName);
    return boundary ? { ...boundary.metrics } : null;
  }

  /**
   * CRITICAL: Get all boundary metrics
   */
  getAllBoundaryMetrics(): Map<string, QueueMetrics> {
    const metrics = new Map<string, QueueMetrics>();
    
    for (const [queueName, boundary] of this.boundaries.entries()) {
      metrics.set(queueName, { ...boundary.metrics });
    }

    return metrics;
  }

  /**
   * CRITICAL: Quarantine tenant from queue
   */
  quarantineTenant(queueName: string, tenantId: string, reason: string): void {
    const boundary = this.getQueueBoundary(queueName);
    
    boundary.tenantQuarantines.add(tenantId);

    // CRITICAL: Log quarantine
    this.auditLogger.logSecurityEvent({
      tenantId,
      actorId: 'queue-system',
      action: 'TENANT_QUARANTINED',
      resourceType: 'QUEUE_BOUNDARY',
      resourceId: queueName,
      outcome: 'SUCCESS',
      correlationId: `quarantine_${tenantId}_${Date.now()}`,
      severity: 'HIGH',
      metadata: {
        queueName,
        reason,
        quarantinedAt: new Date()
      }
    });

    logger.warn('Tenant quarantined from queue', {
      queueName,
      tenantId,
      reason
    });
  }

  /**
   * CRITICAL: Remove tenant quarantine
   */
  removeTenantQuarantine(queueName: string, tenantId: string): void {
    const boundary = this.getQueueBoundary(queueName);
    
    if (boundary.tenantQuarantines.delete(tenantId)) {
      // CRITICAL: Log quarantine removal
      this.auditLogger.logSecurityEvent({
        tenantId,
        actorId: 'queue-system',
        action: 'TENANT_QUARANTINE_REMOVED',
        resourceType: 'QUEUE_BOUNDARY',
        resourceId: queueName,
        outcome: 'SUCCESS',
        correlationId: `unquarantine_${tenantId}_${Date.now()}`,
        severity: 'LOW',
        metadata: {
          queueName,
          removedAt: new Date()
        }
      });

      logger.info('Tenant quarantine removed', {
        queueName,
        tenantId
      });
    }
  }

  /**
   * CRITICAL: Isolate queue boundary
   */
  isolateBoundary(queueName: string, reason: string): void {
    const boundary = this.getQueueBoundary(queueName);
    
    boundary.status = 'ISOLATED';

    // CRITICAL: Log isolation
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'queue-system',
      action: 'QUEUE_ISOLATED',
      resourceType: 'QUEUE_BOUNDARY',
      resourceId: queueName,
      outcome: 'SUCCESS',
      correlationId: `isolate_${queueName}_${Date.now()}`,
      severity: 'HIGH',
      metadata: {
        queueName,
        reason,
        isolatedAt: new Date()
      }
    });

    logger.error('Queue boundary isolated', {
      queueName,
      reason
    });
  }

  /**
   * CRITICAL: Restore queue boundary
   */
  restoreBoundary(queueName: string): void {
    const boundary = this.getQueueBoundary(queueName);
    
    boundary.status = 'ACTIVE';
    boundary.circuitBreakerState = 'CLOSED';

    // CRITICAL: Log restoration
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'queue-system',
      action: 'QUEUE_RESTORED',
      resourceType: 'QUEUE_BOUNDARY',
      resourceId: queueName,
      outcome: 'SUCCESS',
      correlationId: `restore_${queueName}_${Date.now()}`,
      severity: 'LOW',
      metadata: {
        queueName,
        restoredAt: new Date()
      }
    });

    logger.info('Queue boundary restored', {
      queueName
    });
  }

  /**
   * CRITICAL: Validate enqueue preconditions
   */
  private validateEnqueuePreconditions(boundary: QueueBoundary, tenantId: string, priority: QueuePriority): void {
    // CRITICAL: Check boundary status
    if (boundary.status === 'CIRCUIT_BROKEN') {
      throw new Error(`Queue ${boundary.queueName} is circuit broken`);
    }

    if (boundary.status === 'ISOLATED') {
      throw new Error(`Queue ${boundary.queueName} is isolated`);
    }

    // CRITICAL: Check tenant quarantine
    if (boundary.tenantQuarantines.has(tenantId)) {
      throw new Error(`Tenant ${tenantId} is quarantined from queue ${boundary.queueName}`);
    }

    // CRITICAL: Check queue size limit
    if (boundary.metrics.pendingMessages >= boundary.config.maxSize) {
      throw new Error(`Queue ${boundary.queueName} is full (${boundary.metrics.pendingMessages}/${boundary.config.maxSize})`);
    }

    // CRITICAL: Check rate limits
    this.checkRateLimits(boundary, tenantId);
  }

  /**
   * CRITICAL: Check rate limits
   */
  private checkRateLimits(boundary: QueueBoundary, tenantId: string): void {
    const now = new Date();
    const rateLimit = boundary.rateLimits.get(tenantId);

    if (rateLimit && rateLimit.resetTime > now) {
      if (rateLimit.count >= 100) { // 100 messages per minute per tenant
        throw new Error(`Rate limit exceeded for tenant ${tenantId} in queue ${boundary.queueName}`);
      }
    } else {
      // CRITICAL: Reset or create rate limit
      boundary.rateLimits.set(tenantId, {
        count: 0,
        resetTime: new Date(now.getTime() + 60000) // 1 minute
      });
    }

    // CRITICAL: Increment count
    const currentRateLimit = boundary.rateLimits.get(tenantId)!;
    currentRateLimit.count++;
  }

  /**
   * CRITICAL: Find next message to process
   */
  private findNextMessage(boundary: QueueBoundary, tenantId?: string): QueueMessage | null {
    const now = new Date();
    const candidates: QueueMessage[] = [];

    // CRITICAL: Filter messages by criteria
    for (const message of this.messageStore.values()) {
      if (message.queueName !== boundary.queueName) continue;
      if (message.scheduledAt > now) continue;
      if (message.expiresAt < now) continue;
      if (tenantId && message.tenantId !== tenantId) continue;
      if (boundary.tenantQuarantines.has(message.tenantId)) continue;

      candidates.push(message);
    }

    // CRITICAL: Sort by priority and creation time
    candidates.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3, BACKGROUND: 4 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * CRITICAL: Calculate retry delay
   */
  private calculateRetryDelay(attempt: number, retryPolicy: QueueConfig['retryPolicy']): number {
    const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt - 1);
    return Math.min(delay, retryPolicy.maxDelay);
  }

  /**
   * CRITICAL: Send to dead letter queue
   */
  private async sendToDeadLetterQueue(message: QueueMessage, error: Error): Promise<void> {
    // CRITICAL: Remove from active store
    this.messageStore.delete(message.id);

    // CRITICAL: Update metrics
    const boundary = this.getBoundaryMessage(message.id);
    if (boundary) {
      this.updateBoundaryMetrics(boundary, 'DEAD_LETTER', message);
    }

    // CRITICAL: Log dead letter
    this.auditLogger.logDataMutation({
      tenantId: message.tenantId,
      actorId: 'queue-system',
      action: 'MESSAGE_DEAD_LETTER',
      resourceType: 'QUEUE_MESSAGE',
      resourceId: message.id,
      outcome: 'FAILURE',
      correlationId: message.correlationId,
      metadata: {
        queueName: message.queueName,
        attempts: message.attempts,
        error: error.message,
        processingTime: Date.now() - message.createdAt.getTime()
      }
    });

    logger.error('Message sent to dead letter queue', {
      messageId: message.id,
      queueName: message.queueName,
      tenantId: message.tenantId,
      attempts: message.attempts,
      error: error.message
    });

    // CRITICAL: In a real implementation, this would store the message in a dead letter queue
    // For now, we just log and remove it
  }

  /**
   * CRITICAL: Get boundary for message
   */
  private getBoundaryMessage(messageId: string): QueueBoundary | null {
    const message = this.messageStore.get(messageId);
    return message ? this.boundaries.get(message.queueName) : null;
  }

  /**
   * CRITICAL: Update boundary metrics
   */
  private updateBoundaryMetrics(boundary: QueueBoundary, action: string, message?: QueueMessage): void {
    const now = new Date();
    boundary.lastActivity = now;

    // CRITICAL: Recalculate metrics from message store
    const messages = Array.from(this.messageStore.values())
      .filter(msg => msg.queueName === boundary.queueName);

    boundary.metrics.totalMessages = messages.length;
    boundary.metrics.pendingMessages = messages.filter(msg => msg.scheduledAt <= now && msg.expiresAt > now).length;
    boundary.metrics.processingMessages = messages.filter(msg => msg.attempts > 0).length;
    
    // CRITICAL: Calculate tenant backlog
    boundary.metrics.tenantBacklog = {};
    for (const msg of messages) {
      boundary.metrics.tenantBacklog[msg.tenantId] = (boundary.metrics.tenantBacklog[msg.tenantId] || 0) + 1;
    }

    // CRITICAL: Calculate priority backlog
    boundary.metrics.priorityBacklog = {
      CRITICAL: 0,
      HIGH: 0,
      NORMAL: 0,
      LOW: 0,
      BACKGROUND: 0
    };
    
    for (const msg of messages) {
      boundary.metrics.priorityBacklog[msg.priority]++;
    }

    // CRITICAL: Update circuit breaker state based on failures
    this.updateCircuitBreakerState(boundary);
  }

  /**
   * CRITICAL: Update circuit breaker state
   */
  private updateCircuitBreakerState(boundary: QueueBoundary): void {
    const recentMessages = Array.from(this.messageStore.values())
      .filter(msg => msg.queueName === boundary.queueName)
      .filter(msg => Date.now() - msg.createdAt.getTime() < 300000); // Last 5 minutes

    const failureRate = recentMessages.length > 0 
      ? (recentMessages.filter(msg => msg.attempts >= msg.maxAttempts).length / recentMessages.length) * 100
      : 0;

    if (boundary.circuitBreakerState === 'CLOSED' && failureRate > 50) {
      boundary.circuitBreakerState = 'OPEN';
      boundary.status = 'CIRCUIT_BROKEN';
      
      logger.error('Queue circuit breaker tripped', {
        queueName: boundary.queueName,
        failureRate,
        recentFailures: recentMessages.filter(msg => msg.attempts >= msg.maxAttempts).length
      });
    } else if (boundary.circuitBreakerState === 'OPEN' && failureRate < 20) {
      boundary.circuitBreakerState = 'HALF_OPEN';
      
      logger.info('Queue circuit breaker entering half-open state', {
        queueName: boundary.queueName,
        failureRate
      });
    } else if (boundary.circuitBreakerState === 'HALF_OPEN' && failureRate < 10) {
      boundary.circuitBreakerState = 'CLOSED';
      boundary.status = 'ACTIVE';
      
      logger.info('Queue circuit breaker reset', {
        queueName: boundary.queueName,
        failureRate
      });
    }
  }

  /**
   * CRITICAL: Initialize boundary
   */
  private initializeBoundary(queueName: string, config: QueueConfig): QueueBoundary {
    return {
      queueName,
      status: 'ACTIVE',
      config,
      metrics: this.initializeMetrics(),
      lastActivity: new Date(),
      circuitBreakerState: 'CLOSED',
      tenantQuarantines: new Set(),
      rateLimits: new Map()
    };
  }

  /**
   * CRITICAL: Initialize metrics
   */
  private initializeMetrics(): QueueMetrics {
    return {
      totalMessages: 0,
      pendingMessages: 0,
      processingMessages: 0,
      completedMessages: 0,
      failedMessages: 0,
      deadLetterMessages: 0,
      averageProcessingTime: 0,
      throughputPerSecond: 0,
      errorRate: 0,
      tenantBacklog: {},
      priorityBacklog: {
        CRITICAL: 0,
        HIGH: 0,
        NORMAL: 0,
        LOW: 0,
        BACKGROUND: 0
      }
    };
  }

  /**
   * CRITICAL: Initialize default config
   */
  private initializeDefaultConfig(): QueueConfig {
    return {
      maxSize: 10000,
      processingConcurrency: 10,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000, // 1 second
        maxDelay: 300000 // 5 minutes
      },
      deadLetterQueue: true,
      priorityQueues: true,
      tenantIsolation: true,
      circuitBreaker: {
        failureThreshold: 10,
        resetTimeout: 60000 // 1 minute
      }
    };
  }

  /**
   * CRITICAL: Start queue processor
   */
  private startQueueProcessor(queueName: string): void {
    const processor = setInterval(() => {
      this.processQueue(queueName);
    }, 1000); // Process every second

    this.processors.set(queueName, processor);
  }

  /**
   * CRITICAL: Process queue
   */
  private async processQueue(queueName: string): Promise<void> {
    try {
      const boundary = this.getQueueBoundary(queueName);
      
      if (boundary.status !== 'ACTIVE') {
        return;
      }

      // CRITICAL: Process up to concurrency limit
      const processingCount = Math.min(boundary.config.processingConcurrency, boundary.metrics.pendingMessages);
      
      for (let i = 0; i < processingCount; i++) {
        const message = await this.dequeue(queueName);
        
        if (message) {
          // CRITICAL: In a real implementation, this would call the actual message handler
          // For now, we'll just acknowledge the message
          await this.acknowledge(message.id, { processed: true });
        }
      }

    } catch (error) {
      logger.error('Queue processor error', error as Error, { queueName });
    }
  }

  /**
   * CRITICAL: Start queue monitoring
   */
  private startQueueMonitoring(): void {
    // CRITICAL: Periodic metrics update
    setInterval(() => {
      for (const boundary of this.boundaries.values()) {
        this.updateBoundaryMetrics(boundary, 'MONITOR');
      }
    }, 10000); // Every 10 seconds

    // CRITICAL: Periodic cleanup
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Cleanup expired messages
   */
  private cleanupExpiredMessages(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [messageId, message] of this.messageStore.entries()) {
      if (message.expiresAt < now) {
        this.messageStore.delete(messageId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired messages', { cleanedCount });
    }
  }

  /**
   * CRITICAL: Generate message ID
   */
  private generateMessageId(): string {
    const bytes = crypto.randomBytes(8);
    return `msg_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate correlation ID
   */
  private generateCorrelationId(): string {
    const bytes = crypto.randomBytes(8);
    return `corr_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Global queue boundary manager instance
 */
export const queueBoundaryManager = QueueBoundaryManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const enqueueMessage = async (
  queueName: string,
  tenantId: string,
  payload: Record<string, any>,
  priority: QueuePriority = 'NORMAL',
  delayUntil?: Date,
  correlationId?: string,
  metadata: Record<string, any> = {}
): Promise<string> => {
  return await queueBoundaryManager.enqueue(queueName, tenantId, payload, priority, delayUntil, correlationId, metadata);
};

export const dequeueMessage = async (queueName: string, tenantId?: string): Promise<QueueMessage | null> => {
  return await queueBoundaryManager.dequeue(queueName, tenantId);
};

export const acknowledgeMessage = async (messageId: string, result?: any): Promise<void> => {
  return await queueBoundaryManager.acknowledge(messageId, result);
};

export const rejectMessage = async (messageId: string, error: Error, shouldRetry: boolean = true): Promise<void> => {
  return await queueBoundaryManager.reject(messageId, error, shouldRetry);
};

export const getQueueMetrics = (queueName: string): QueueMetrics | null => {
  return queueBoundaryManager.getBoundaryMetrics(queueName);
};

export const quarantineTenantFromQueue = (queueName: string, tenantId: string, reason: string): void => {
  queueBoundaryManager.quarantineTenant(queueName, tenantId, reason);
};

export const isolateQueue = (queueName: string, reason: string): void => {
  queueBoundaryManager.isolateBoundary(queueName, reason);
};

export const restoreQueue = (queueName: string): void => {
  queueBoundaryManager.restoreBoundary(queueName);
};
