/**
 * Security Orchestrator Service
 * Coordinates all security automation services and scheduling
 */

import { CronJob } from 'cron';
import { logger } from '../utils/structured-logger';
import { metrics } from '../utils/metrics';
import { continuousSecurityHardening } from './continuous-security-hardening.service';
import { liveAuditCompliance } from './live-audit-compliance.service';
import { automatedPatchManagement } from './automated-patch-management.service';
import { penetrationTestingAutomation } from './penetration-testing-automation.service';
import { realtimeIntrusionDetection } from './realtime-intrusion-detection.service';
import { securityReportingAlerting } from './security-reporting-alerting.service';

export interface SecurityOrchestrationStatus {
  isRunning: boolean;
  scheduledJobs: ScheduledJob[];
  lastExecutions: Record<string, string>;
  nextExecutions: Record<string, string>;
  failSafeMode: boolean;
  blockedEndpoints: string[];
}

export interface ScheduledJob {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'failed';
}

export class SecurityOrchestratorService {
  private static instance: SecurityOrchestratorService;
  private jobs: Map<string, CronJob> = new Map();
  private isRunning = false;
  private failSafeMode = false;
  private lastExecutions: Map<string, Date> = new Map();

  private constructor() {}

  static getInstance(): SecurityOrchestratorService {
    if (!SecurityOrchestratorService.instance) {
      SecurityOrchestratorService.instance = new SecurityOrchestratorService();
    }
    return SecurityOrchestratorService.instance;
  }

  /**
   * Start security orchestration
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Security orchestration already running');
      return;
    }

    try {
      logger.info('Starting security orchestration');

      // Schedule security hardening checks (every 15 minutes)
      this.scheduleJob(
        'security-hardening',
        '*/15 * * * *',
        async () => {
          try {
            await continuousSecurityHardening.runSecurityHardeningChecks();
            this.lastExecutions.set('security-hardening', new Date());
          } catch (error) {
            logger.error('Security hardening check failed', error as Error);
            await this.handleJobFailure('security-hardening', error as Error);
          }
        }
      );

      // Schedule audit & compliance checks (every 1 hour)
      this.scheduleJob(
        'audit-compliance',
        '0 * * * *',
        async () => {
          try {
            await liveAuditCompliance.runLiveAuditChecks('full');
            this.lastExecutions.set('audit-compliance', new Date());
          } catch (error) {
            logger.error('Audit compliance check failed', error as Error);
            await this.handleJobFailure('audit-compliance', error as Error);
          }
        }
      );

      // Schedule patch management (daily at 2 AM)
      this.scheduleJob(
        'patch-management',
        '0 2 * * *',
        async () => {
          try {
            await automatedPatchManagement.runPatchManagement(false); // Manual approval for now
            this.lastExecutions.set('patch-management', new Date());
          } catch (error) {
            logger.error('Patch management failed', error as Error);
            await this.handleJobFailure('patch-management', error as Error);
          }
        }
      );

      // Schedule penetration testing (weekly on Sunday at 3 AM)
      this.scheduleJob(
        'penetration-testing',
        '0 3 * * 0',
        async () => {
          try {
            await penetrationTestingAutomation.runPenetrationTests('full');
            this.lastExecutions.set('penetration-testing', new Date());
          } catch (error) {
            logger.error('Penetration testing failed', error as Error);
            await this.handleJobFailure('penetration-testing', error as Error);
          }
        }
      );

      // Schedule intrusion detection analysis (every 5 minutes)
      this.scheduleJob(
        'intrusion-detection',
        '*/5 * * * *',
        async () => {
          try {
            await realtimeIntrusionDetection.runIntrusionDetection();
            this.lastExecutions.set('intrusion-detection', new Date());
          } catch (error) {
            logger.error('Intrusion detection failed', error as Error);
            await this.handleJobFailure('intrusion-detection', error as Error);
          }
        }
      );

      // Schedule daily security reports (daily at 8 AM)
      this.scheduleJob(
        'daily-report',
        '0 8 * * *',
        async () => {
          try {
            await securityReportingAlerting.generateSecurityReport('daily');
            this.lastExecutions.set('daily-report', new Date());
          } catch (error) {
            logger.error('Daily report generation failed', error as Error);
            await this.handleJobFailure('daily-report', error as Error);
          }
        }
      );

      // Schedule weekly security reports (Monday at 9 AM)
      this.scheduleJob(
        'weekly-report',
        '0 9 * * 1',
        async () => {
          try {
            await securityReportingAlerting.generateSecurityReport('weekly');
            this.lastExecutions.set('weekly-report', new Date());
          } catch (error) {
            logger.error('Weekly report generation failed', error as Error);
            await this.handleJobFailure('weekly-report', error as Error);
          }
        }
      );

      // Schedule monthly security reports (1st of month at 10 AM)
      this.scheduleJob(
        'monthly-report',
        '0 10 1 * *',
        async () => {
          try {
            await securityReportingAlerting.generateSecurityReport('monthly');
            this.lastExecutions.set('monthly-report', new Date());
          } catch (error) {
            logger.error('Monthly report generation failed', error as Error);
            await this.handleJobFailure('monthly-report', error as Error);
          }
        }
      );

      this.isRunning = true;

      logger.info('Security orchestration started', {
        jobsScheduled: this.jobs.size
      });

      metrics.incrementCounter('security_orchestration_started', 1);
    } catch (error) {
      logger.error('Failed to start security orchestration', error as Error);
      throw error;
    }
  }

  /**
   * Stop security orchestration
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Security orchestration not running');
      return;
    }

    try {
      logger.info('Stopping security orchestration');

      // Stop all cron jobs
      for (const [name, job] of this.jobs.entries()) {
        job.stop();
        logger.info(`Stopped job: ${name}`);
      }

      this.jobs.clear();
      this.isRunning = false;

      logger.info('Security orchestration stopped');

      metrics.incrementCounter('security_orchestration_stopped', 1);
    } catch (error) {
      logger.error('Failed to stop security orchestration', error as Error);
      throw error;
    }
  }

  /**
   * Schedule a job
   */
  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    try {
      const job = new CronJob(
        schedule,
        async () => {
          logger.info(`Running scheduled job: ${name}`);
          await task();
        },
        null,
        true,
        'America/Los_Angeles'
      );

      this.jobs.set(name, job);

      logger.info(`Scheduled job: ${name}`, { schedule });
    } catch (error) {
      logger.error(`Failed to schedule job: ${name}`, error as Error);
    }
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(jobName: string, error: Error): Promise<void> {
    logger.error(`Job failed: ${jobName}`, error);

    // Send alert for critical job failures
    const criticalJobs = ['security-hardening', 'audit-compliance', 'intrusion-detection'];
    
    if (criticalJobs.includes(jobName)) {
      await securityReportingAlerting.sendAlert({
        severity: 'high',
        type: 'job_failure',
        message: `Critical security job failed: ${jobName}`,
        details: {
          jobName,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        recipients: ['OWNER', 'ADMIN'],
        channels: ['email', 'slack']
      });

      // Consider entering fail-safe mode
      if (this.shouldEnterFailSafeMode(jobName)) {
        await this.enterFailSafeMode(jobName, error);
      }
    }

    metrics.incrementCounter('security_job_failures', 1, { jobName });
  }

  /**
   * Determine if should enter fail-safe mode
   */
  private shouldEnterFailSafeMode(jobName: string): boolean {
    // Enter fail-safe mode if critical security checks fail
    return jobName === 'security-hardening' || jobName === 'audit-compliance';
  }

  /**
   * Enter fail-safe mode
   */
  private async enterFailSafeMode(reason: string, error: Error): Promise<void> {
    if (this.failSafeMode) {
      return; // Already in fail-safe mode
    }

    this.failSafeMode = true;

    logger.error('ENTERING FAIL-SAFE MODE', {
      reason,
      error: error.message
    });

    // Send critical alert
    await securityReportingAlerting.sendAlert({
      severity: 'critical',
      type: 'fail_safe_mode',
      message: `System entered fail-safe mode due to: ${reason}`,
      details: {
        reason,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      recipients: ['OWNER', 'ADMIN'],
      channels: ['email', 'sms', 'slack']
    });

    // In production, this would:
    // 1. Block affected endpoints temporarily
    // 2. Increase logging verbosity
    // 3. Trigger incident response procedures
    // 4. Notify on-call engineers

    metrics.incrementCounter('fail_safe_mode_entered', 1);
  }

  /**
   * Exit fail-safe mode
   */
  async exitFailSafeMode(): Promise<void> {
    if (!this.failSafeMode) {
      return;
    }

    logger.info('Exiting fail-safe mode');

    this.failSafeMode = false;

    await securityReportingAlerting.sendAlert({
      severity: 'medium',
      type: 'fail_safe_mode_exit',
      message: 'System exited fail-safe mode',
      details: {
        timestamp: new Date().toISOString()
      },
      recipients: ['OWNER', 'ADMIN'],
      channels: ['email', 'slack']
    });

    metrics.incrementCounter('fail_safe_mode_exited', 1);
  }

  /**
   * Get orchestration status
   */
  getStatus(): SecurityOrchestrationStatus {
    const scheduledJobs: ScheduledJob[] = [];

    for (const [name, job] of this.jobs.entries()) {
      const lastRun = this.lastExecutions.get(name);
      
      scheduledJobs.push({
        name,
        schedule: (job as any).cronTime?.source || 'unknown',
        enabled: (job as any).running || false,
        lastRun: lastRun?.toISOString(),
        nextRun: job.nextDate()?.toISOString(),
        status: 'idle'
      });
    }

    const lastExecutions: Record<string, string> = {};
    const nextExecutions: Record<string, string> = {};

    for (const [name, date] of this.lastExecutions.entries()) {
      lastExecutions[name] = date.toISOString();
    }

    for (const [name, job] of this.jobs.entries()) {
      const nextDate = job.nextDate();
      if (nextDate) {
        nextExecutions[name] = nextDate.toISOString();
      }
    }

    return {
      isRunning: this.isRunning,
      scheduledJobs,
      lastExecutions,
      nextExecutions,
      failSafeMode: this.failSafeMode,
      blockedEndpoints: penetrationTestingAutomation.getBlockedEndpoints()
    };
  }

  /**
   * Run job manually
   */
  async runJobManually(jobName: string): Promise<void> {
    logger.info(`Running job manually: ${jobName}`);

    switch (jobName) {
      case 'security-hardening':
        await continuousSecurityHardening.runSecurityHardeningChecks();
        break;
      case 'audit-compliance':
        await liveAuditCompliance.runLiveAuditChecks('full');
        break;
      case 'patch-management':
        await automatedPatchManagement.runPatchManagement(false);
        break;
      case 'penetration-testing':
        await penetrationTestingAutomation.runPenetrationTests('full');
        break;
      case 'intrusion-detection':
        await realtimeIntrusionDetection.runIntrusionDetection();
        break;
      case 'daily-report':
        await securityReportingAlerting.generateSecurityReport('daily');
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }

    this.lastExecutions.set(jobName, new Date());
  }

  /**
   * Check if orchestration is running
   */
  isOrchestrationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if in fail-safe mode
   */
  isInFailSafeMode(): boolean {
    return this.failSafeMode;
  }
}

export const securityOrchestrator = SecurityOrchestratorService.getInstance();
