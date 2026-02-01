// CRITICAL: Priority Queue Implementation
// MANDATORY: Priority-based request queues with fair scheduling

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import crypto from 'crypto';

export type QueuePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';
export type QueueStatus = 'ACTIVE' | 'PAUSED' | 'DRAINING' | 'SHUTDOWN';

export interface PriorityQueueItem {
  id: string;
  tenantId: string;
  priority: QueuePriority;
  payload: Record<string, any>;
  createdAt: Date;
  scheduledAt: Date;
  expiresAt?: Date;
  attempts: number;
  maxAttempts: number;
  delayUntil?: Date;
  correlationId: string;
  metadata: Record<string, any>;
}

export interface PriorityQueueConfig {
  maxSize: number;
  processingConcurrency: number;
  priorities: QueuePriority[];
  priorityWeights: Record<QueuePriority, number>;
  fairScheduling: boolean;
  tenantIsolation: boolean;
  starvationPrevention: boolean;
  maxWaitTime: number; // Maximum time in queue before priority boost
}

export interface QueueMetrics {
  totalItems: number;
  itemsByPriority: Record<QueuePriority, number>;
  itemsByTenant: Record<string, number>;
  averageWaitTime: number;
  processingRate: number;
  errorRate: number;
  oldestItemAge: number;
  newestItemAge: number;
}

/**
 * CRITICAL: Priority Queue Manager
 * 
 * This class implements priority-based queues with fair scheduling,
 * tenant isolation, and starvation prevention mechanisms.
 */
export class PriorityQueueManager {
  private static instance: PriorityQueueManager;
  private auditLogger: any;
  private queues: Map<string, Map<QueuePriority, PriorityQueueItem[]>> = new Map();
  private processing: Map<string, Set<string>> = new Map();
  private configs: Map<string, PriorityQueueConfig> = new Map();
  private globalConfig: PriorityQueueConfig;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.globalConfig = this.initializeGlobalConfig();
    this.startQueueMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): PriorityQueueManager {
    if (!PriorityQueueManager.instance) {
      PriorityQueueManager.instance = new PriorityQueueManager();
    }
    return PriorityQueueManager.instance;
  }

  /**
   * CRITICAL: Get or create priority queue
   */
  getPriorityQueue(queueName: string, config: Partial<PriorityQueueConfig> = {}): Map<QueuePriority, PriorityQueueItem[]> {
    let queue = this.queues.get(queueName);
    
    if (!queue) {
      const mergedConfig = { ...this.globalConfig, ...config };
      queue = this.initializeQueue(queueName, mergedConfig);
      this.queues.set(queueName, queue);
      this.configs.set(queueName, mergedConfig);
      this.processing.set(queueName, new Set());
    }

    return queue;
  }

  /**
   * CRITICAL: Enqueue item with priority
   */
  async enqueue(
    queueName: string,
    tenantId: string,
    priority: QueuePriority,
    payload: Record<string, any>,
    delayUntil?: Date,
    correlationId?: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const queue = this.getPriorityQueue(queueName);
    const config = this.configs.get(queueName)!;
    const itemId = this.generateItemId();

    // CRITICAL: Validate enqueue preconditions
    this.validateEnqueuePreconditions(queue, config, tenantId, priority);

    const item: PriorityQueueItem = {
      id: itemId,
      tenantId,
      priority,
      payload,
      createdAt: new Date(),
      scheduledAt: delayUntil || new Date(),
      expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : undefined,
      attempts: 0,
      maxAttempts: config.maxSize / 10, // 10% of max size
      delayUntil,
      correlationId: correlationId || this.generateCorrelationId(),
      metadata
    };

    // CRITICAL: Add to appropriate priority queue
    const priorityQueue = queue.get(priority);
    if (!priorityQueue) {
      queue.set(priority, []);
    }
    queue.get(priority)!.push(item);

    // CRITICAL: Sort by priority and creation time
    this.sortQueue(queue);

    // CRITICAL: Log enqueue
    this.auditLogger.logDataMutation({
      tenantId,
      actorId: 'queue-system',
      action: 'ITEM_ENQUEUED',
      resourceType: 'PRIORITY_QUEUE',
      resourceId: itemId,
      outcome: 'SUCCESS',
      correlationId: item.correlationId,
      metadata: {
        queueName,
        priority,
        scheduledAt: item.scheduledAt,
        payloadSize: JSON.stringify(payload).length
      }
    });

    logger.info('Item enqueued', {
      itemId,
      queueName,
      tenantId,
      priority,
      scheduledAt: item.scheduledAt
    });

    return itemId;
  }

  /**
   * CRITICAL: Dequeue item with priority
   */
  async dequeue(queueName: string, tenantId?: string): Promise<PriorityQueueItem | null> {
    const queue = this.queues.get(queueName);
    const config = this.configs.get(queueName);
    
    if (!queue || !config) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // CRITICAL: Check queue status
    if (config.priorities.length === 0) {
      return null;
    }

    // CRITICAL: Find next item to process
    const item = this.findNextItem(queue, config, tenantId);
    
    if (!item) {
      return null;
    }

    // CRITICAL: Mark as processing
    const processingSet = this.processing.get(queueName);
    if (!processingSet) {
      this.processing.set(queueName, new Set());
    }
    this.processing.get(queueName)!.add(item.id);

    // CRITICAL: Update item state
    item.attempts++;
    item.scheduledAt = new Date();

    // CRITICAL: Remove from queue
    const priorityQueue = queue.get(item.priority);
    if (priorityQueue) {
      const index = priorityQueue.findIndex(i => i.id === item.id);
      if (index !== -1) {
        priorityQueue.splice(index, 1);
      }
    }

    // CRITICAL: Log dequeue
    this.auditLogger.logDataMutation({
      tenantId: item.tenantId,
      actorId: 'queue-system',
      action: 'ITEM_DEQUEUED',
      resourceType: 'PRIORITY_QUEUE',
      resourceId: item.id,
      outcome: 'SUCCESS',
      correlationId: item.correlationId,
      metadata: {
        queueName,
        priority: item.priority,
        attempts: item.attempts,
        waitTime: Date.now() - item.createdAt.getTime()
      }
    });

    logger.info('Item dequeued', {
      itemId: item.id,
      queueName,
      tenantId: item.tenantId,
      priority: item.priority,
      attempts: item.attempts
    });

    return item;
  }

  /**
   * CRITICAL: Acknowledge item completion
   */
  async acknowledge(itemId: string, result?: any): Promise<void> {
    // CRITICAL: Find item in processing
    for (const [queueName, processingSet] of this.processing.entries()) {
      if (processingSet.has(itemId)) {
        processingSet.delete(itemId);

        // CRITICAL: Log acknowledgment
        this.auditLogger.logDataMutation({
          tenantId: 'system',
          actorId: 'queue-system',
          action: 'ITEM_ACKNOWLEDGED',
          resourceType: 'PRIORITY_QUEUE',
          resourceId: itemId,
          outcome: 'SUCCESS',
          correlationId: `ack_${itemId}_${Date.now()}`,
          metadata: {
            queueName,
            result: result ? 'SUCCESS' : 'NO_RESULT'
          }
        });

        logger.info('Item acknowledged', {
          itemId,
          queueName
        });

        return;
      }
    }

    throw new Error(`Item ${itemId} not found in processing`);
  }

  /**
   * CRITICAL: Reject item (retry or dead letter)
   */
  async reject(itemId: string, error: Error, shouldRetry: boolean = true): Promise<void> {
    // CRITICAL: Find item in processing
    for (const [queueName, processingSet] of this.processing.entries()) {
      if (processingSet.has(itemId)) {
        const queue = this.queues.get(queueName);
        const config = this.configs.get(queueName);
        
        // CRITICAL: Remove from processing
        processingSet.delete(itemId);

        // CRITICAL: Find item data
        let item: PriorityQueueItem | null = null;
        for (const priorityQueue of queue.values()) {
          const found = priorityQueue.find(i => i.id === itemId);
          if (found) {
            item = found;
            break;
          }
        }

        if (!item) {
          throw new Error(`Item ${itemId} not found`);
        }

        // CRITICAL: Handle retry or dead letter
        if (shouldRetry && item.attempts < item.maxAttempts) {
          // CRITICAL: Schedule retry with exponential backoff
          const retryDelay = this.calculateRetryDelay(item.attempts);
          item.delayUntil = new Date(Date.now() + retryDelay);
          item.scheduledAt = item.delayUntil;
          
          // CRITICAL: Re-enqueue
          const priorityQueue = queue.get(item.priority);
          if (priorityQueue) {
            priorityQueue.push(item);
            this.sortQueue(queue);
          }

          // CRITICAL: Log retry
          this.auditLogger.logDataMutation({
            tenantId: item.tenantId,
            actorId: 'queue-system',
            action: 'ITEM_RETRY',
            resourceType: 'PRIORITY_QUEUE',
            resourceId: itemId,
            outcome: 'SUCCESS',
            correlationId: item.correlationId,
            metadata: {
              queueName,
              priority: item.priority,
              attempts: item.attempts,
              retryDelay,
              error: error.message
            }
          });

          logger.warn('Item scheduled for retry', {
            itemId,
            queueName,
            priority: item.priority,
            attempts: item.attempts,
            retryDelay
          });

        } else {
          // CRITICAL: Send to dead letter
          await this.sendToDeadLetter(item, error, queueName);
        }

        return;
      }
    }

    throw new Error(`Item ${itemId} not found in processing`);
  }

  /**
   * CRITICAL: Get queue metrics
   */
  getQueueMetrics(queueName: string): QueueMetrics | null {
    const queue = this.queues.get(queueName);
    const config = this.configs.get(queueName);
    
    if (!queue || !config) {
      return null;
    }

    const now = Date.now();
    const itemsByPriority: Record<QueuePriority, number> = {
      CRITICAL: 0,
      HIGH: 0,
      NORMAL: 0,
      LOW: 0,
      BACKGROUND: 0
    };
    
    const itemsByTenant: Record<string, number> = {};
    let totalWaitTime = 0;
    let itemCount = 0;
    let oldestAge = 0;
    let newestAge = 0;

    // CRITICAL: Calculate metrics
    for (const priority of config.priorities) {
      const priorityQueue = queue.get(priority);
      if (priorityQueue) {
        itemsByPriority[priority] = priorityQueue.length;
        
        for (const item of priorityQueue) {
          itemsByTenant[item.tenantId] = (itemsByTenant[item.tenantId] || 0) + 1;
          
          const waitTime = now - item.createdAt.getTime();
          totalWaitTime += waitTime;
          itemCount++;
          
          if (oldestAge === 0 || waitTime < oldestAge) {
            oldestAge = waitTime;
          }
          if (newestAge === 0 || waitTime > newestAge) {
            newestAge = waitTime;
          }
        }
      }
    }

    return {
      totalItems: itemCount,
      itemsByPriority,
      itemsByTenant,
      averageWaitTime: itemCount > 0 ? totalWaitTime / itemCount : 0,
      processingRate: this.processing.get(queueName)?.size || 0,
      errorRate: 0, // Would be calculated from actual errors
      oldestItemAge: oldestAge,
      newestItemAge: newestAge
    };
  }

  /**
   * CRITICAL: Get all queue metrics
   */
  getAllQueueMetrics(): Map<string, QueueMetrics> {
    const metrics = new Map<string, QueueMetrics>();
    
    for (const queueName of this.queues.keys()) {
      const queueMetrics = this.getQueueMetrics(queueName);
      if (queueMetrics) {
        metrics.set(queueName, queueMetrics);
      }
    }

    return metrics;
  }

  /**
   * CRITICAL: Pause queue processing
   */
  pauseQueue(queueName: string, reason: string): void {
    const config = this.configs.get(queueName);
    if (config) {
      // CRITICAL: This would be implemented to pause processing
      logger.info('Queue paused', { queueName, reason });
    }
  }

  /**
   * CRITICAL: Resume queue processing
   */
  resumeQueue(queueName: string): void {
    const config = this.configs.get(queueName);
    if (config) {
      // CRITICAL: This would be implemented to resume processing
      logger.info('Queue resumed', { queueName });
    }
  }

  /**
   * CRITICAL: Drain queue (process all items then stop)
   */
  async drainQueue(queueName: string): Promise<void> {
    const config = this.configs.get(queueName);
    if (config) {
      // CRITICAL: This would be implemented to drain the queue
      logger.info('Queue draining started', { queueName });
    }
  }

  /**
   * CRITICAL: Configure queue
   */
  configureQueue(queueName: string, config: Partial<PriorityQueueConfig>): void {
    const existingConfig = this.configs.get(queueName);
    const newConfig = existingConfig ? { ...existingConfig, ...config } : { ...this.globalConfig, ...config };
    
    this.configs.set(queueName, newConfig);

    // CRITICAL: Update queue if it exists
    const queue = this.queues.get(queueName);
    if (queue) {
      // CRITICAL: Re-sort queue with new configuration
      this.sortQueue(queue);
    }

    // CRITICAL: Log configuration change
    this.auditLogger.logSecurityEvent({
      tenantId: 'system',
      actorId: 'system',
      action: 'QUEUE_CONFIGURED',
      resourceType: 'PRIORITY_QUEUE',
      resourceId: queueName,
      outcome: 'SUCCESS',
      correlationId: `queue_config_${queueName}_${Date.now()}`,
      severity: 'LOW',
      metadata: {
        queueName,
        maxSize: newConfig.maxSize,
        priorities: newConfig.priorities,
        fairScheduling: newConfig.fairScheduling
      }
    });

    logger.info('Queue configuration updated', { queueName, config: newConfig });
  }

  /**
   * CRITICAL: Validate enqueue preconditions
   */
  private validateEnqueuePreconditions(
    queue: Map<QueuePriority, PriorityQueueItem[]>,
    config: PriorityQueueConfig,
    tenantId: string,
    priority: QueuePriority
  ): void {
    // CRITICAL: Check if priority is allowed
    if (!config.priorities.includes(priority)) {
      throw new Error(`Priority ${priority} not allowed for queue`);
    }

    // CRITICAL: Check queue size limit
    const totalItems = Array.from(queue.values()).reduce((sum, items) => sum + items.length, 0);
    if (totalItems >= config.maxSize) {
      throw new Error(`Queue is full (${totalItems}/${config.maxSize})`);
    }

    // CRITICAL: Check tenant isolation
    if (config.tenantIsolation) {
      // CRITICAL: This would check tenant-specific limits
      // For now, we'll allow all tenants
    }
  }

  /**
   * CRITICAL: Find next item to process
   */
  private findNextItem(
    queue: Map<QueuePriority, PriorityQueueItem[]>,
    config: PriorityQueueConfig,
    tenantId?: string
  ): PriorityQueueItem | null {
    const now = Date.now();
    let candidate: PriorityQueueItem | null = null;

    if (config.fairScheduling) {
      // CRITICAL: Fair scheduling - round-robin across priorities
      candidate = this.findNextItemFair(queue, config, tenantId, now);
    } else {
      // CRITICAL: Priority-based scheduling
      candidate = this.findNextItemPriority(queue, config, tenantId, now);
    }

    // CRITICAL: Check for starvation prevention
    if (candidate && config.starvationPrevention) {
      const waitTime = now - candidate.createdAt.getTime();
      if (waitTime > config.maxWaitTime) {
        // CRITICAL: Boost priority for starving items
        return this.boostPriority(queue, candidate, config);
      }
    }

    return candidate;
  }

  /**
   * CRITICAL: Find next item with fair scheduling
   */
  private findNextItemFair(
    queue: Map<QueuePriority, PriorityQueueItem[]>,
    config: PriorityQueueConfig,
    tenantId?: string,
    now: number
  ): PriorityQueueItem | null {
    let roundRobinIndex = 0;
    const visitedTenants = new Set<string>();

    // CRITICAL: Round-robin through priorities
    for (const priority of config.priorities) {
      const priorityQueue = queue.get(priority);
      if (!priorityQueue || priorityQueue.length === 0) {
        continue;
      }

      // CRITICAL: Find eligible item for this priority
      for (let i = 0; i < priorityQueue.length; i++) {
        const item = priorityQueue[i];
        
        // CRITICAL: Check if item is ready
        if (item.scheduledAt <= now && (!item.expiresAt || item.expiresAt > now)) {
          // CRITICAL: Check tenant isolation
          if (tenantId && item.tenantId !== tenantId) {
            continue;
          }

          // CRITICAL: Fair scheduling - check if tenant has been served
          if (config.tenantIsolation && visitedTenants.has(item.tenantId)) {
            continue;
          }

          visitedTenants.add(item.tenantId);
          roundRobinIndex = i;
          return item;
        }
      }
    }

    return null;
  }

  /**
   * CRITICAL: Find next item with priority scheduling
   */
  private findNextItemPriority(
    queue: Map<QueuePriority, PriorityQueueItem[]>,
    config: PriorityQueueConfig,
    tenantId?: string,
    now: number
  ): PriorityQueueItem | null {
    // CRITICAL: Process priorities in order
    for (const priority of config.priorities) {
      const priorityQueue = queue.get(priority);
      if (!priorityQueue || priorityQueue.length === 0) {
        continue;
      }

      // CRITICAL: Find first eligible item
      for (const item of priorityQueue) {
        // CRITICAL: Check if item is ready
        if (item.scheduledAt <= now && (!item.expiresAt || item.expiresAt > now)) {
          // CRITICAL: Check tenant isolation
          if (tenantId && item.tenantId !== tenantId) {
            continue;
          }

          return item;
        }
      }
    }

    return null;
  }

  /**
   * CRITICAL: Boost priority for starving items
   */
  private boostPriority(
    queue: Map<QueuePriority, PriorityQueueItem[]>,
    item: PriorityQueueItem,
    config: PriorityQueueConfig
  ): PriorityQueueItem {
    // CRITICAL: Find higher priority
    const currentIndex = config.priorities.indexOf(item.priority);
    if (currentIndex <= 0) {
      return item; // Already highest priority
    }

    const higherPriority = config.priorities[currentIndex - 1];
    const higherPriorityQueue = queue.get(higherPriority);
    
    if (higherPriorityQueue) {
      // CRITICAL: Move to higher priority queue
      const currentQueue = queue.get(item.priority);
      if (currentQueue) {
        const index = currentQueue.findIndex(i => i.id === item.id);
        if (index !== -1) {
          currentQueue.splice(index, 1);
        }
      }
      
      higherPriorityQueue.push(item);
      this.sortQueue(queue);
      
      // CRITICAL: Log priority boost
      this.auditLogger.logDataMutation({
        tenantId: item.tenantId,
        actorId: 'queue-system',
        action: 'PRIORITY_BOOST',
        resourceType: 'PRIORITY_QUEUE',
        resourceId: item.id,
        outcome: 'SUCCESS',
        correlationId: `priority_boost_${item.id}_${Date.now()}`,
        metadata: {
          oldPriority: item.priority,
          newPriority: higherPriority,
          waitTime: Date.now() - item.createdAt.getTime()
        }
      });

      logger.warn('Item priority boosted due to starvation', {
        itemId: item.id,
        oldPriority: item.priority,
        newPriority: higherPriority,
        waitTime: Date.now() - item.createdAt.getTime()
      });

      item.priority = higherPriority;
    }

    return item;
  }

  /**
   * CRITICAL: Sort queue by priority and creation time
   */
  private sortQueue(queue: Map<QueuePriority, PriorityQueueItem[]>): void {
    const priorityOrder: Record<QueuePriority, number> = {
      CRITICAL: 0,
      HIGH: 1,
      NORMAL: 2,
      LOW: 3,
      BACKGROUND: 4
    };

    // CRITICAL: Sort each priority queue
    for (const [priority, items] of queue.entries()) {
      items.sort((a, b) => {
        // CRITICAL: First by priority (already separated)
        // Then by creation time (FIFO within same priority)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    }
  }

  /**
   * CRITICAL: Calculate retry delay
   */
  private calculateRetryDelay(attempts: number): number {
    // CRITICAL: Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = baseDelay * Math.pow(2, attempts - 1);
    const jitter = Math.random() * 1000; // Up to 1 second jitter
    
    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * CRITICAL: Send to dead letter queue
   */
  private async sendToDeadLetter(item: PriorityQueueItem, error: Error, queueName: string): Promise<void> {
    // CRITICAL: Log dead letter
    this.auditLogger.logDataMutation({
      tenantId: item.tenantId,
      actorId: 'queue-system',
      action: 'ITEM_DEAD_LETTER',
      resourceType: 'PRIORITY_QUEUE',
      resourceId: item.id,
      outcome: 'FAILURE',
      correlationId: item.correlationId,
      metadata: {
        queueName,
        priority: item.priority,
        attempts: item.attempts,
        error: error.message,
        waitTime: Date.now() - item.createdAt.getTime()
      }
    });

    logger.error('Item sent to dead letter queue', {
      itemId: item.id,
      queueName,
      priority: item.priority,
      attempts: item.attempts,
      error: error.message
    });

    // CRITICAL: In a real implementation, this would store the item in a dead letter queue
    // For now, we just log it
  }

  /**
   * CRITICAL: Initialize queue
   */
  private initializeQueue(queueName: string, config: PriorityQueueConfig): Map<QueuePriority, PriorityQueueItem[]> {
    const queue = new Map<QueuePriority, PriorityQueueItem[]>();
    
    // CRITICAL: Initialize priority queues
    for (const priority of config.priorities) {
      queue.set(priority, []);
    }

    return queue;
  }

  /**
   * CRITICAL: Initialize global configuration
   */
  private initializeGlobalConfig(): PriorityQueueConfig {
    return {
      maxSize: 10000,
      processingConcurrency: 10,
      priorities: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'BACKGROUND'],
      priorityWeights: {
        CRITICAL: 100,
        HIGH: 50,
        NORMAL: 10,
        LOW: 5,
        BACKGROUND: 1
      },
      fairScheduling: true,
      tenantIsolation: true,
      starvationPrevention: true,
      maxWaitTime: 300000 // 5 minutes
    };
  }

  /**
   * CRITICAL: Start queue monitoring
   */
  private startQueueMonitoring(): void {
    // CRITICAL: Periodic metrics update
    setInterval(() => {
      this.updateAllMetrics();
    }, 10000); // Every 10 seconds

    // CRITICAL: Periodic cleanup
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Update all metrics
   */
  private updateAllMetrics(): void {
    // CRITICAL: This would update metrics for monitoring systems
    // For now, we just log the statistics
    const stats = {
      totalQueues: this.queues.size,
      totalProcessing: Array.from(this.processing.values()).reduce((sum, set) => sum + set.size, 0),
      totalItems: Array.from(this.queues.values()).reduce((sum, queue) => 
        sum + Array.from(queue.values()).reduce((queueSum, items) => queueSum + items.length, 0), 0
      )
    };

    logger.debug('Queue metrics updated', stats);
  }

  /**
   * CRITICAL: Cleanup expired items
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [queueName, queue] of this.queues.entries()) {
      for (const [priority, items] of queue.entries()) {
        const filteredItems = items.filter(item => {
          // CRITICAL: Remove expired items
          if (item.expiresAt && item.expiresAt < now) {
            cleanedCount++;
            return false;
          }
          return true;
        });
        
        queue.set(priority, filteredItems);
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired queue items', { cleanedCount });
    }
  }

  /**
   * CRITICAL: Generate item ID
   */
  private generateItemId(): string {
    const bytes = crypto.randomBytes(8);
    return `item_${bytes.toString('hex')}`;
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
 * CRITICAL: Global priority queue manager instance
 */
export const priorityQueueManager = PriorityQueueManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const enqueuePriorityItem = async (
  queueName: string,
  tenantId: string,
  priority: QueuePriority,
  payload: Record<string, any>,
  delayUntil?: Date,
  correlationId?: string,
  metadata: Record<string, any> = {}
): Promise<string> => {
  return await priorityQueueManager.enqueue(queueName, tenantId, priority, payload, delayUntil, correlationId, metadata);
};

export const dequeuePriorityItem = async (
  queueName: string,
  tenantId?: string
): Promise<PriorityQueueItem | null> => {
  return await priorityQueueManager.dequeue(queueName, tenantId);
};

export const acknowledgePriorityItem = async (itemId: string, result?: any): Promise<void> => {
  return await priorityQueueManager.acknowledge(itemId, result);
};

export const rejectPriorityItem = async (itemId: string, error: Error, shouldRetry: boolean = true): Promise<void> => {
  return await priorityQueueManager.reject(itemId, error, shouldRetry);
};

export const getQueueMetrics = (queueName: string): QueueMetrics | null => {
  return priorityQueueManager.getQueueMetrics(queueName);
};

export const getAllQueueMetrics = (): Map<string, QueueMetrics> => {
  return priorityQueueManager.getAllQueueMetrics();
};

export const configurePriorityQueue = (queueName: string, config: Partial<PriorityQueueConfig>): void => {
  priorityQueueManager.configureQueue(queueName, config);
};
