import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { redis, queues, JOB_QUEUES, jobProcessors, JobResult, JobStats, WorkerStats, type WorkflowTimerJobData } from './config';
import { logger } from '../utils/logger';
import { runAsSystem, runWithCompanyContext } from '../runtime/request-context';

export class JobService {
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private jobStats: Map<string, JobStats> = new Map();
  private workerStats: Map<string, WorkerStats> = new Map();
  private initialized: boolean = false;
  private redisAvailable: boolean = false;

  constructor() {
    // Delay initialization to allow Redis connection to be established
    this.initializeAsync().catch(err => {
      logger.warn('Job service initialization failed:', err.message);
      logger.warn('Job queues will be disabled. Backend will continue without background jobs.');
    });
  }

  private async initializeAsync() {
    // Wait for Redis connection to be ready or fail
    await this.waitForRedis(5000); // 5 second timeout
    
    if (!this.redisAvailable) {
      logger.warn('Redis not available. Skipping job queue initialization.');
      return;
    }

    this.initializeQueues();
    this.startWorkers();
    this.setupQueueEvents();
    this.initialized = true;
  }

  private async waitForRedis(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (redis.status === 'ready' || redis.status === 'connect') {
        this.redisAvailable = true;
        logger.info('Redis connection confirmed. Initializing job queues.');
        return;
      }
      
      if (redis.status === 'end' || redis.status === 'close') {
        this.redisAvailable = false;
        logger.warn('Redis connection closed. Job queues disabled.');
        return;
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Timeout reached
    this.redisAvailable = false;
    logger.warn('Redis connection timeout. Job queues disabled.');
  }

  async initialize(): Promise<void> {
    // Initialization is done in constructor, but we provide this method for compatibility
    logger.info('Job service initialized');
  }

  private initializeQueues() {
    logger.info('Initializing job queues...');
    queues.forEach(queue => {
      logger.info(`Queue ${queue.name} initialized`);
    });
  }

  private startWorkers() {
    if (!this.redisAvailable) {
      logger.warn('Redis not available. Skipping worker initialization.');
      return;
    }

    logger.info('Starting job workers...');

    Object.values(JOB_QUEUES).forEach(queueName => {
      try {
        const worker = new Worker(queueName, this.createJobProcessor(queueName), {
          connection: redis,
          concurrency: 1, // We'll handle concurrency in the processor
        });

        worker.on('completed', (job: Job) => {
          logger.info(`Job ${job.id} completed in queue ${queueName}`);
          this.updateJobStats(queueName, 'completed');
          this.updateWorkerStats(worker, 'processed');
        });

        worker.on('failed', (job: Job | undefined, err: Error) => {
          if (job) {
            logger.error(`Job ${job.id} failed in queue ${queueName}:`, err);
          } else {
            logger.error(`Job failed in queue ${queueName}:`, err);
          }
          this.updateJobStats(queueName, 'failed');
          this.updateWorkerStats(worker, 'failed');
        });

        worker.on('error', (err: Error) => {
          // Suppress Redis connection errors after initialization
          if (!err.message.includes('ECONNREFUSED') && !err.message.includes('Connection is closed')) {
            logger.error(`Worker error in queue ${queueName}:`, err);
          }
        });

        this.workers.set(queueName, worker);
        this.workerStats.set(queueName, {
          workerId: worker.id,
          queueName,
          status: 'idle',
          processed: 0,
          failed: 0,
          uptime: Date.now(),
        });
      } catch (error) {
        logger.warn(`Failed to start worker for queue ${queueName}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  private createJobProcessor(queueName: string) {
    return async (job: Job): Promise<any> => {
      logger.info(`Processing job ${job.id} in queue ${queueName}`);

      const startTime = Date.now();
      const processor = jobProcessors.get(`${queueName}:${job.name}`);

      if (!processor) {
        throw new Error(`No processor found for job type: ${job.name}`);
      }

      try {
        const companyId = typeof (job as any)?.data?.companyId === 'string' ? String((job as any).data.companyId) : '';
        const runner = companyId ? () => runWithCompanyContext(companyId, () => processor(job)) : () => runAsSystem(() => processor(job));
        const result = await runner();
        const duration = Date.now() - startTime;

        return {
          success: true,
          data: result,
          metadata: {
            duration,
            attempts: job.attemptsMade,
            companyId: job.data.companyId || 'unknown',
          },
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Job ${job.id} failed:`, error);

        throw {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            duration,
            attempts: job.attemptsMade,
            companyId: job.data.companyId || 'unknown',
          },
        };
      }
    };
  }

  private setupQueueEvents() {
    if (!this.redisAvailable) {
      logger.warn('Redis not available. Skipping queue events setup.');
      return;
    }

    Object.values(JOB_QUEUES).forEach(queueName => {
      try {
        const queueEvents = new QueueEvents(queueName, { connection: redis });

        queueEvents.on('waiting', () => {
          this.updateJobStats(queueName, 'waiting');
        });

        queueEvents.on('active', () => {
          this.updateJobStats(queueName, 'active');
        });

        queueEvents.on('completed', () => {
          this.updateJobStats(queueName, 'completed');
        });

        queueEvents.on('failed', () => {
          this.updateJobStats(queueName, 'failed');
        });

        queueEvents.on('delayed', () => {
          this.updateJobStats(queueName, 'delayed');
        });

        queueEvents.on('paused', () => {
          this.updateJobStats(queueName, 'paused');
        });

        this.queueEvents.set(queueName, queueEvents);
      } catch (error) {
        logger.warn(`Failed to setup queue events for ${queueName}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  private updateJobStats(queueName: string, status: keyof JobStats) {
    const currentStats = this.jobStats.get(queueName) || {
      queueName,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
    };

    currentStats[status]++;

    // Reset other statuses when updating one
    Object.keys(currentStats).forEach(key => {
      if (key !== 'queueName' && key !== status) {
        if (key !== 'queueName') {
          currentStats[key as keyof Omit<JobStats, 'queueName'>] = 0;
        }
      }
    });

    this.jobStats.set(queueName, currentStats);
  }

  private updateWorkerStats(worker: Worker, action: 'processed' | 'failed') {
    const stats = this.workerStats.get(worker.name);
    if (stats) {
      if (action === 'processed') {
        stats.processed++;
      } else {
        stats.failed++;
      }
      stats.status = 'active';
    }
  }

  // Job scheduling methods
  async addRecurringInvoiceJob(data: any, delay = 0) {
    return this.addJob(JOB_QUEUES.RECURRING_INVOICES, 'process-recurring-invoice', data, delay);
  }

  async addPayrollProcessingJob(data: any, delay = 0) {
    return this.addJob(JOB_QUEUES.PAYROLL_PROCESSING, 'process-payroll', data, delay);
  }

  async addReportGenerationJob(data: any, delay = 0) {
    return this.addJob(JOB_QUEUES.REPORT_GENERATION, 'generate-report', data, delay);
  }

  async addBackupJob(data: any, delay = 0) {
    return this.addJob(JOB_QUEUES.BACKUP, 'create-backup', data, delay);
  }

  async addNotificationJob(data: any, delay = 0) {
    return this.addJob(JOB_QUEUES.NOTIFICATIONS, 'send-notification', data, delay);
  }

  async addWorkflowTimerJob(data: WorkflowTimerJobData, delay = 0) {
    return this.addJob(JOB_QUEUES.WORKFLOW_TIMERS, 'fire-workflow-timer', data, delay);
  }

  private async addJob(queueName: string, jobName: string, data: any, delay = 0) {
    if (!this.initialized || !this.redisAvailable) {
      logger.warn(`Cannot add job to queue ${queueName}: Job service not initialized or Redis unavailable`);
      throw new Error('Job service not available');
    }

    const queue = queues.find(q => q.name === queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobName, data, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info(`Job ${job.id} added to queue ${queueName}`);
    return job;
  }

  // Job management methods
  async pauseQueue(queueName: string) {
    const queue = queues.find(q => q.name === queueName);
    if (queue) {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    }
  }

  async resumeQueue(queueName: string) {
    const queue = queues.find(q => q.name === queueName);
    if (queue) {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    }
  }

  async getJobStats(): Promise<JobStats[]> {
    return Array.from(this.jobStats.values());
  }

  async getWorkerStats(): Promise<WorkerStats[]> {
    return Array.from(this.workerStats.values());
  }

  async getQueueJobs(queueName: string, status?: string, limit = 10) {
    const queue = queues.find(q => q.name === queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    if (status) {
      return await queue.getJobs([status as any], 0, limit);
    }

    return await queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, limit);
  }

  async removeJob(queueName: string, jobId: string) {
    const queue = queues.find(q => q.name === queueName);
    if (queue) {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`Job ${jobId} removed from queue ${queueName}`);
      }
    }
  }

  async cleanQueue(queueName: string, grace = 5000) {
    const queue = queues.find(q => q.name === queueName);
    if (queue) {
      await queue.clean(grace, 1000);
      logger.info(`Queue ${queueName} cleaned`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; redis: boolean; queues: Record<string, boolean>; initialized: boolean }> {
    const redisConnected = redis.status === 'ready';
    const queueHealth: Record<string, boolean> = {};

    if (this.initialized && this.redisAvailable) {
      for (const queue of queues) {
        try {
          await queue.getWaiting();
          queueHealth[queue.name] = true;
        } catch (error) {
          queueHealth[queue.name] = false;
        }
      }
    }

    return {
      status: this.initialized && redisConnected && Object.values(queueHealth).every(h => h) ? 'healthy' : 'degraded',
      redis: redisConnected,
      queues: queueHealth,
      initialized: this.initialized,
    };
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down job service...');

    // Close all workers
    for (const [queueName, worker] of Array.from(this.workers.entries())) {
      await worker.close();
      logger.info(`Worker for queue ${queueName} closed`);
    }

    // Close all queue events
    for (const [queueName, events] of Array.from(this.queueEvents.entries())) {
      await events.close();
      logger.info(`Queue events for ${queueName} closed`);
    }

    // Close all queues
    for (const queue of queues) {
      await queue.close();
      logger.info(`Queue ${queue.name} closed`);
    }

    // Close Redis connection
    await redis.quit();
    logger.info('Job service shutdown complete');
  }
}

// Export singleton instance
export const jobService = new JobService();
