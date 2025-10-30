import { Request, Response } from 'express';
import { jobService } from '../jobs/service';
import { JOB_QUEUES } from '../jobs/config';

// Job management routes
export async function getJobQueues(req: Request, res: Response) {
  try {
    const stats = await jobService.getJobStats();
    const workerStats = await jobService.getWorkerStats();
    const health = await jobService.healthCheck();

    res.json({
      health,
      stats,
      workerStats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job queue information' });
  }
}

export async function getQueueJobs(req: Request, res: Response) {
  try {
    const { queueName } = req.params;
    const { status, limit = 10 } = req.query;

    if (!Object.values(JOB_QUEUES).includes(queueName as any)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    const jobs = await jobService.getQueueJobs(queueName, status as string, parseInt(limit as string));
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get queue jobs' });
  }
}

export async function pauseQueue(req: Request, res: Response) {
  try {
    const { queueName } = req.params;

    if (!Object.values(JOB_QUEUES).includes(queueName as any)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    await jobService.pauseQueue(queueName);
    res.json({ message: `Queue ${queueName} paused` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pause queue' });
  }
}

export async function resumeQueue(req: Request, res: Response) {
  try {
    const { queueName } = req.params;

    if (!Object.values(JOB_QUEUES).includes(queueName as any)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    await jobService.resumeQueue(queueName);
    res.json({ message: `Queue ${queueName} resumed` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resume queue' });
  }
}

export async function cleanQueue(req: Request, res: Response) {
  try {
    const { queueName } = req.params;

    if (!Object.values(JOB_QUEUES).includes(queueName as any)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    await jobService.cleanQueue(queueName);
    res.json({ message: `Queue ${queueName} cleaned` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clean queue' });
  }
}

export async function removeJob(req: Request, res: Response) {
  try {
    const { queueName, jobId } = req.params;

    if (!Object.values(JOB_QUEUES).includes(queueName as any)) {
      return res.status(400).json({ error: 'Invalid queue name' });
    }

    await jobService.removeJob(queueName, jobId);
    res.json({ message: `Job ${jobId} removed from queue ${queueName}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove job' });
  }
}

// Job scheduling routes
export async function scheduleRecurringInvoice(req: Request, res: Response) {
  try {
    const { companyId, customerId, invoiceId, scheduleId, delay = 0 } = req.body;

    const job = await jobService.addRecurringInvoiceJob({
      companyId,
      customerId,
      invoiceId,
      scheduleId,
    }, delay);

    res.json({
      message: 'Recurring invoice job scheduled',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule recurring invoice job' });
  }
}

export async function schedulePayrollProcessing(req: Request, res: Response) {
  try {
    const { companyId, payrollPeriodId, payRunId, delay = 0 } = req.body;

    const job = await jobService.addPayrollProcessingJob({
      companyId,
      payrollPeriodId,
      payRunId,
    }, delay);

    res.json({
      message: 'Payroll processing job scheduled',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule payroll processing job' });
  }
}

export async function scheduleReportGeneration(req: Request, res: Response) {
  try {
    const { companyId, reportType, dateRange, format, recipientEmail, delay = 0 } = req.body;

    const job = await jobService.addReportGenerationJob({
      companyId,
      reportType,
      dateRange,
      format,
      recipientEmail,
    }, delay);

    res.json({
      message: 'Report generation job scheduled',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule report generation job' });
  }
}

export async function scheduleBackup(req: Request, res: Response) {
  try {
    const { companyId, backupType, includeFiles, delay = 0 } = req.body;

    const job = await jobService.addBackupJob({
      companyId,
      backupType,
      includeFiles,
    }, delay);

    res.json({
      message: 'Backup job scheduled',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule backup job' });
  }
}

export async function scheduleNotification(req: Request, res: Response) {
  try {
    const { companyId, userId, type, template, data, scheduledFor, delay = 0 } = req.body;

    const job = await jobService.addNotificationJob({
      companyId,
      userId,
      type,
      template,
      data,
      scheduledFor,
    }, delay);

    res.json({
      message: 'Notification job scheduled',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule notification job' });
  }
}
