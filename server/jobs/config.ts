import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection for BullMQ
export const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// Job queue configurations
export const JOB_QUEUES = {
  RECURRING_INVOICES: 'recurring-invoices',
  PAYROLL_PROCESSING: 'payroll-processing',
  REPORT_GENERATION: 'report-generation',
  BACKUP: 'backup',
  NOTIFICATIONS: 'notifications',
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
} as const;

// Create queues
export const queues = Object.values(JOB_QUEUES).map(queueName => {
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
  companyId: string;
  customerId: string;
  invoiceId: string;
  scheduleId: string;
}

export interface PayrollProcessingJobData {
  companyId: string;
  payrollPeriodId: string;
  payRunId?: string;
}

export interface ReportGenerationJobData {
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
  companyId: string;
  backupType: 'full' | 'incremental';
  includeFiles: boolean;
}

export interface NotificationJobData {
  companyId: string;
  userId: string;
  type: 'email' | 'in-app' | 'both';
  template: string;
  data: Record<string, any>;
  scheduledFor?: Date;
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
import { processRecurringInvoice, processPayroll, generateReport, createBackup, sendNotification } from './processors';

jobProcessors.set(`${JOB_QUEUES.RECURRING_INVOICES}:process-recurring-invoice`, processRecurringInvoice);
jobProcessors.set(`${JOB_QUEUES.PAYROLL_PROCESSING}:process-payroll`, processPayroll);
jobProcessors.set(`${JOB_QUEUES.REPORT_GENERATION}:generate-report`, generateReport);
jobProcessors.set(`${JOB_QUEUES.BACKUP}:create-backup`, createBackup);
jobProcessors.set(`${JOB_QUEUES.NOTIFICATIONS}:send-notification`, sendNotification);
