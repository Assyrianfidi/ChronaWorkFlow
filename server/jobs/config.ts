import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// Redis connection for BullMQ
if (!isTestEnv) {
  console.log('Connecting to Redis at:', process.env.REDIS_HOST || 'localhost', 'port:', process.env.REDIS_PORT || '6379');
}

export const redis: any = isTestEnv
  ? ({
      status: 'end',
      connect: async () => undefined,
      on: () => undefined,
      quit: async () => undefined,
      disconnect: () => undefined,
    } as any)
  : (new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      connectTimeout: 5000, // 5 seconds (reduced from 10)
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times: number) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          console.warn('⚠️  Redis connection failed after 3 attempts. Job queues will be disabled.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000); // Exponential backoff
      },
    } as any) as any);

// Track Redis connection status
let redisConnected = false;

// Handle Redis connection events
if (!isTestEnv) {
  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
    redisConnected = true;
  });

  redis.on('error', (err: any) => {
    // Suppress timeout errors to avoid log spam
    if (err.code !== 'ETIMEDOUT' && err.code !== 'EAI_AGAIN') {
      console.error('Redis connection error:', err.message);
    }
  });

  redis.on('close', () => {
    redisConnected = false;
  });

  // Connect to Redis with graceful failure
  redis.connect().catch((err: any) => {
    console.warn('⚠️  Redis unavailable:', err.message);
    console.warn('⚠️  Job queues will be disabled. Backend will continue without background jobs.');
  });
}

// Export connection status checker
export const isRedisConnected = () => redisConnected;

// Job queue configurations
export const JOB_QUEUES = {
  RECURRING_INVOICES: 'recurring-invoices',
  PAYROLL_PROCESSING: 'payroll-processing',
  REPORT_GENERATION: 'report-generation',
  BACKUP: 'backup',
  NOTIFICATIONS: 'notifications',
  WORKFLOW_TIMERS: 'workflow-timers',
} as const;

// Queue configurations
export const QUEUE_CONFIGS = {
  [JOB_QUEUES.RECURRING_INVOICES]: {
    concurrency: 5,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  [JOB_QUEUES.PAYROLL_PROCESSING]: {
    concurrency: 3,
    removeOnComplete: 50,
    removeOnFail: 25,
  },
  [JOB_QUEUES.REPORT_GENERATION]: {
    concurrency: 2,
    removeOnComplete: 20,
    removeOnFail: 10,
  },
  [JOB_QUEUES.BACKUP]: {
    concurrency: 1,
    removeOnComplete: 10,
    removeOnFail: 5,
  },
  [JOB_QUEUES.NOTIFICATIONS]: {
    concurrency: 10,
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
  [JOB_QUEUES.WORKFLOW_TIMERS]: {
    concurrency: 5,
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
} as const;

// Create queues
export const queues = isTestEnv
  ? ([] as Queue[])
  : Object.values(JOB_QUEUES).map(queueName => {
      const config = QUEUE_CONFIGS[queueName as keyof typeof QUEUE_CONFIGS];
      return new Queue(queueName, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: config.removeOnComplete,
          removeOnFail: config.removeOnFail,
        },
      });
    });

// Job data types
export interface RecurringInvoiceJobData {
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceId: string;
  scheduleId: string;
}

export interface PayrollProcessingJobData {
  tenantId: string;
  companyId: string;
  payrollPeriodId: string;
  payRunId?: string;
}

export interface ReportGenerationJobData {
  tenantId: string;
  companyId: string;
  reportType: 'balance-sheet' | 'profit-loss' | 'cash-flow' | 'aged-receivables' | 'aged-payables';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  format: 'pdf' | 'excel' | 'csv';
  recipientEmail?: string;
}

export interface BackupJobData {
  tenantId: string;
  companyId: string;
  backupType: 'full' | 'incremental';
  includeFiles: boolean;
}

export interface NotificationJobData {
  tenantId: string;
  companyId: string;
  userId: string;
  type: 'email' | 'in-app' | 'both';
  template: string;
  data: Record<string, any>;
  scheduledFor?: Date;
}

export interface WorkflowTimerJobData {
  tenantId: string;
  companyId: string;
  workflowTimerId: string;
  workflowInstanceId: string;
}

// Job result types
export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration: number;
    attempts: number;
    companyId: string;
  };
}

// Job status types
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

// Job monitoring interface
export interface JobStats {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface WorkerStats {
  workerId: string;
  queueName: string;
  status: 'active' | 'idle';
  processed: number;
  failed: number;
  uptime: number;
}

// Global job registry for worker creation
export const jobProcessors = new Map<string, (job: Job) => Promise<any>>();

// Register job processors
import { processRecurringInvoice, processPayroll, generateReport, createBackup, sendNotification, processWorkflowTimer } from './processors';

jobProcessors.set(`${JOB_QUEUES.RECURRING_INVOICES}:process-recurring-invoice`, processRecurringInvoice);
jobProcessors.set(`${JOB_QUEUES.PAYROLL_PROCESSING}:process-payroll`, processPayroll);
jobProcessors.set(`${JOB_QUEUES.REPORT_GENERATION}:generate-report`, generateReport);
jobProcessors.set(`${JOB_QUEUES.BACKUP}:create-backup`, createBackup);
jobProcessors.set(`${JOB_QUEUES.NOTIFICATIONS}:send-notification`, sendNotification);
jobProcessors.set(`${JOB_QUEUES.WORKFLOW_TIMERS}:fire-workflow-timer`, processWorkflowTimer);
