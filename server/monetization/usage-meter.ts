import { ProductTier } from './product-tiers';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';
import { GovernanceModelManager } from '../governance/governance-model';

export interface UsageMetric {
  id: string;
  tenantId: string;
  metricType: 'TRANSACTIONS' | 'API_CALLS' | 'STORAGE' | 'USERS' | 'COMPANIES' | 'REPORTS' | 'INTEGRATIONS';
  currentValue: number;
  limit: number;
  periodStart: Date;
  periodEnd: Date;
  resetFrequency: 'DAILY' | 'MONTHLY' | 'ANNUALLY' | 'NEVER';
  lastUpdated: Date;
}

export interface UsageEvent {
  id: string;
  tenantId: string;
  metricType: UsageMetric['metricType'];
  value: number;
  timestamp: Date;
  description: string;
  source: string;
  userId?: string;
  sessionId?: string;
}

export interface UsageAlert {
  id: string;
  tenantId: string;
  metricType: UsageMetric['metricType'];
  alertType: 'WARNING' | 'CRITICAL' | 'LIMIT_REACHED' | 'OVERAGE';
  currentUsage: number;
  limit: number;
  percentage: number;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface UsageReport {
  id: string;
  tenantId: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  metrics: UsageMetricSummary[];
  totalUsage: number;
  totalLimit: number;
  utilizationPercentage: number;
  overageCharges: number;
  generatedAt: Date;
}

export interface UsageMetricSummary {
  metricType: UsageMetric['metricType'];
  currentUsage: number;
  limit: number;
  utilizationPercentage: number;
  overageAmount: number;
  overageCharges: number;
}

export interface UsageThreshold {
  metricType: UsageMetric['metricType'];
  warningThreshold: number; // percentage (e.g., 80 for 80%)
  criticalThreshold: number; // percentage (e.g., 95 for 95%)
  overageRate: number; // cost per unit over limit
  hardLimit: boolean; // whether to block when limit reached
}

export class UsageMeter {
  private static instance: UsageMeter;
  private auditLog: ImmutableAuditLogger;
  private governanceManager: GovernanceModelManager;
  private usageMetrics: Map<string, UsageMetric> = new Map();
  private usageEvents: Map<string, UsageEvent[]> = new Map();
  private usageAlerts: Map<string, UsageAlert[]> = new Map();
  private thresholds: Map<string, UsageThreshold> = new Map();

  private constructor() {
    this.auditLog = ImmutableAuditLogger.getInstance();
    this.governanceManager = GovernanceModelManager.getInstance();
    this.initializeDefaultThresholds();
  }

  public static getInstance(): UsageMeter {
    if (!UsageMeter.instance) {
      UsageMeter.instance = new UsageMeter();
    }
    return UsageMeter.instance;
  }

  private initializeDefaultThresholds(): void {
    const defaultThresholds: UsageThreshold[] = [
      {
        metricType: 'TRANSACTIONS',
        warningThreshold: 80,
        criticalThreshold: 95,
        overageRate: 0.10, // $0.10 per transaction over limit
        hardLimit: false
      },
      {
        metricType: 'API_CALLS',
        warningThreshold: 80,
        criticalThreshold: 95,
        overageRate: 0.001, // $0.001 per API call over limit
        hardLimit: true
      },
      {
        metricType: 'STORAGE',
        warningThreshold: 85,
        criticalThreshold: 98,
        overageRate: 0.50, // $0.50 per GB over limit
        hardLimit: false
      },
      {
        metricType: 'USERS',
        warningThreshold: 90,
        criticalThreshold: 100,
        overageRate: 10.00, // $10.00 per user over limit
        hardLimit: true
      },
      {
        metricType: 'COMPANIES',
        warningThreshold: 90,
        criticalThreshold: 100,
        overageRate: 25.00, // $25.00 per company over limit
        hardLimit: true
      },
      {
        metricType: 'REPORTS',
        warningThreshold: 80,
        criticalThreshold: 95,
        overageRate: 2.00, // $2.00 per report over limit
        hardLimit: false
      },
      {
        metricType: 'INTEGRATIONS',
        warningThreshold: 80,
        criticalThreshold: 95,
        overageRate: 5.00, // $5.00 per integration over limit
        hardLimit: false
      }
    ];

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metricType, threshold);
    });
  }

  public async initializeTenantUsage(
    tenantId: string,
    tier: ProductTier,
    limits: { [key in UsageMetric['metricType']]?: number }
  ): Promise<void> {
    try {
      const metricTypes: UsageMetric['metricType'][] = [
        'TRANSACTIONS', 'API_CALLS', 'STORAGE', 'USERS', 'COMPANIES', 'REPORTS', 'INTEGRATIONS'
      ];

      for (const metricType of metricTypes) {
        const limit = limits[metricType] || this.getDefaultLimit(metricType, tier);
        const metricId = `${tenantId}_${metricType}`;

        const usageMetric: UsageMetric = {
          id: metricId,
          tenantId,
          metricType,
          currentValue: 0,
          limit,
          periodStart: new Date(),
          periodEnd: this.calculatePeriodEnd(metricType),
          resetFrequency: this.getResetFrequency(metricType),
          lastUpdated: new Date()
        };

        this.usageMetrics.set(metricId, usageMetric);
      }

      // Initialize usage events array for tenant
      this.usageEvents.set(tenantId, []);

      // Initialize usage alerts array for tenant
      this.usageAlerts.set(tenantId, []);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'INITIALIZE_TENANT_USAGE',
        details: {
          tier,
          limits
        },
        ipAddress: 'SYSTEM',
        userAgent: 'USAGE_METER',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'INITIALIZE_TENANT_USAGE_ERROR',
        details: {
          error: (error as Error).message,
          tier
        },
        ipAddress: 'SYSTEM',
        userAgent: 'USAGE_METER',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async recordUsage(
    tenantId: string,
    metricType: UsageMetric['metricType'],
    value: number,
    description: string,
    source: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    try {
      const metricId = `${tenantId}_${metricType}`;
      const usageMetric = this.usageMetrics.get(metricId);

      if (!usageMetric) {
        throw new Error(`Usage metric not found for tenant ${tenantId} and metric ${metricType}`);
      }

      // Check if metric needs reset
      if (new Date() > usageMetric.periodEnd) {
        await this.resetUsageMetric(tenantId, metricType);
      }

      // Get threshold for this metric type
      const threshold = this.thresholds.get(metricType);
      if (!threshold) {
        throw new Error(`Threshold not configured for metric type ${metricType}`);
      }

      // Check hard limit
      if (threshold.hardLimit && usageMetric.currentValue + value > usageMetric.limit) {
        await this.createUsageAlert(
          tenantId,
          metricType,
          'LIMIT_REACHED',
          usageMetric.currentValue + value,
          usageMetric.limit,
          `Hard limit reached for ${metricType}. Operation blocked.`
        );

        // Log the blocked operation
        await this.auditLog.logOperation({
          tenantId,
          userId: userId || 'SYSTEM',
          action: 'USAGE_LIMIT_BLOCKED',
          details: {
            metricType,
            attemptedValue: value,
            currentUsage: usageMetric.currentValue,
            limit: usageMetric.limit
          },
          ipAddress: 'SYSTEM',
          userAgent: source,
          timestamp: new Date(),
          category: 'BILLING',
          severity: 'WARNING'
        });

        return false;
      }

      // Update usage metric
      usageMetric.currentValue += value;
      usageMetric.lastUpdated = new Date();

      // Record usage event
      const usageEvent: UsageEvent = {
        id: this.generateUsageId(),
        tenantId,
        metricType,
        value,
        timestamp: new Date(),
        description,
        source,
        userId,
        sessionId
      };

      const tenantEvents = this.usageEvents.get(tenantId) || [];
      tenantEvents.push(usageEvent);
      this.usageEvents.set(tenantId, tenantEvents);

      // Check thresholds and create alerts if necessary
      await this.checkUsageThresholds(tenantId, metricType, usageMetric);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: userId || 'SYSTEM',
        action: 'RECORD_USAGE',
        details: {
          metricType,
          value,
          newTotal: usageMetric.currentValue,
          limit: usageMetric.limit
        },
        ipAddress: 'SYSTEM',
        userAgent: source,
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });

      return true;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: userId || 'SYSTEM',
        action: 'RECORD_USAGE_ERROR',
        details: {
          error: (error as Error).message,
          metricType,
          value
        },
        ipAddress: 'SYSTEM',
        userAgent: source,
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async checkUsageThresholds(
    tenantId: string,
    metricType: UsageMetric['metricType'],
    usageMetric: UsageMetric
  ): Promise<void> {
    const threshold = this.thresholds.get(metricType);
    if (!threshold) return;

    const percentage = (usageMetric.currentValue / usageMetric.limit) * 100;

    // Check critical threshold
    if (percentage >= threshold.criticalThreshold) {
      await this.createUsageAlert(
        tenantId,
        metricType,
        'CRITICAL',
        usageMetric.currentValue,
        usageMetric.limit,
        `Critical usage threshold reached for ${metricType}: ${percentage.toFixed(1)}%`
      );
    }
    // Check warning threshold
    else if (percentage >= threshold.warningThreshold) {
      await this.createUsageAlert(
        tenantId,
        metricType,
        'WARNING',
        usageMetric.currentValue,
        usageMetric.limit,
        `Warning threshold reached for ${metricType}: ${percentage.toFixed(1)}%`
      );
    }
  }

  private async createUsageAlert(
    tenantId: string,
    metricType: UsageMetric['metricType'],
    alertType: UsageAlert['alertType'],
    currentUsage: number,
    limit: number,
    message: string
  ): Promise<void> {
    const alert: UsageAlert = {
      id: this.generateUsageId(),
      tenantId,
      metricType,
      alertType,
      currentUsage,
      limit,
      percentage: (currentUsage / limit) * 100,
      message,
      createdAt: new Date(),
      acknowledged: false
    };

    const tenantAlerts = this.usageAlerts.get(tenantId) || [];
    tenantAlerts.push(alert);
    this.usageAlerts.set(tenantId, tenantAlerts);
  }

  private async resetUsageMetric(tenantId: string, metricType: UsageMetric['metricType']): Promise<void> {
    const metricId = `${tenantId}_${metricType}`;
    const usageMetric = this.usageMetrics.get(metricId);

    if (!usageMetric) return;

    usageMetric.currentValue = 0;
    usageMetric.periodStart = new Date();
    usageMetric.periodEnd = this.calculatePeriodEnd(metricType);
    usageMetric.lastUpdated = new Date();

    // Log the reset
    await this.auditLog.logOperation({
      tenantId,
      userId: 'SYSTEM',
      action: 'RESET_USAGE_METRIC',
      details: {
        metricType,
        newPeriodStart: usageMetric.periodStart,
        newPeriodEnd: usageMetric.periodEnd
      },
      ipAddress: 'SYSTEM',
      userAgent: 'USAGE_METER',
      timestamp: new Date(),
      category: 'BILLING',
      severity: 'INFO'
    });
  }

  public async getUsageMetric(
    tenantId: string,
    metricType: UsageMetric['metricType']
  ): Promise<UsageMetric | null> {
    const metricId = `${tenantId}_${metricType}`;
    return this.usageMetrics.get(metricId) || null;
  }

  public async getAllUsageMetrics(tenantId: string): Promise<UsageMetric[]> {
    const metrics: UsageMetric[] = [];
    const metricTypes: UsageMetric['metricType'][] = [
      'TRANSACTIONS', 'API_CALLS', 'STORAGE', 'USERS', 'COMPANIES', 'REPORTS', 'INTEGRATIONS'
    ];

    for (const metricType of metricTypes) {
      const metric = await this.getUsageMetric(tenantId, metricType);
      if (metric) {
        metrics.push(metric);
      }
    }

    return metrics;
  }

  public async getUsageEvents(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    metricType?: UsageMetric['metricType']
  ): Promise<UsageEvent[]> {
    const events = this.usageEvents.get(tenantId) || [];

    return events.filter(event => {
      if (startDate && event.timestamp < startDate) return false;
      if (endDate && event.timestamp > endDate) return false;
      if (metricType && event.metricType !== metricType) return false;
      return true;
    });
  }

  public async getUsageAlerts(
    tenantId: string,
    acknowledged?: boolean,
    alertType?: UsageAlert['alertType']
  ): Promise<UsageAlert[]> {
    const alerts = this.usageAlerts.get(tenantId) || [];

    return alerts.filter(alert => {
      if (acknowledged !== undefined && alert.acknowledged !== acknowledged) return false;
      if (alertType && alert.alertType !== alertType) return false;
      return true;
    });
  }

  public async acknowledgeAlert(
    tenantId: string,
    alertId: string,
    acknowledgedBy: string
  ): Promise<void> {
    const alerts = this.usageAlerts.get(tenantId) || [];
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
      throw new Error(`Alert ${alertId} not found for tenant ${tenantId}`);
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    // Log the acknowledgment
    await this.auditLog.logOperation({
      tenantId,
      userId: acknowledgedBy,
      action: 'ACKNOWLEDGE_USAGE_ALERT',
      details: {
        alertId,
        alertType: alert.alertType,
        metricType: alert.metricType
      },
      ipAddress: 'SYSTEM',
      userAgent: 'USAGE_METER',
      timestamp: new Date(),
      category: 'BILLING',
      severity: 'INFO'
    });
  }

  public async generateUsageReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageReport> {
    try {
      const metrics = await this.getAllUsageMetrics(tenantId);
      const events = await this.getUsageEvents(tenantId, startDate, endDate);

      const metricSummaries: UsageMetricSummary[] = [];
      let totalUsage = 0;
      let totalLimit = 0;
      let totalOverageCharges = 0;

      for (const metric of metrics) {
        const threshold = this.thresholds.get(metric.metricType);
        if (!threshold) continue;

        const overageAmount = Math.max(0, metric.currentValue - metric.limit);
        const overageCharges = overageAmount * threshold.overageRate;

        const summary: UsageMetricSummary = {
          metricType: metric.metricType,
          currentUsage: metric.currentValue,
          limit: metric.limit,
          utilizationPercentage: (metric.currentValue / metric.limit) * 100,
          overageAmount,
          overageCharges
        };

        metricSummaries.push(summary);
        totalUsage += metric.currentValue;
        totalLimit += metric.limit;
        totalOverageCharges += overageCharges;
      }

      const utilizationPercentage = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

      const report: UsageReport = {
        id: this.generateUsageId(),
        tenantId,
        reportPeriod: { startDate, endDate },
        metrics: metricSummaries,
        totalUsage,
        totalLimit,
        utilizationPercentage,
        overageCharges: totalOverageCharges,
        generatedAt: new Date()
      };

      // Log the report generation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'GENERATE_USAGE_REPORT',
        details: {
          reportId: report.id,
          startDate,
          endDate,
          totalOverageCharges
        },
        ipAddress: 'SYSTEM',
        userAgent: 'USAGE_METER',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });

      return report;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'GENERATE_USAGE_REPORT_ERROR',
        details: {
          error: (error as Error).message,
          startDate,
          endDate
        },
        ipAddress: 'SYSTEM',
        userAgent: 'USAGE_METER',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private getDefaultLimit(metricType: UsageMetric['metricType'], tier: ProductTier): number {
    const limits: { [key in ProductTier]: { [key in UsageMetric['metricType']]: number } } = {
      'FREE': {
        'TRANSACTIONS': 50,
        'API_CALLS': 100,
        'STORAGE': 1, // GB
        'USERS': 1,
        'COMPANIES': 1,
        'REPORTS': 5,
        'INTEGRATIONS': 0
      },
      'STARTER': {
        'TRANSACTIONS': 500,
        'API_CALLS': 1000,
        'STORAGE': 10, // GB
        'USERS': 3,
        'COMPANIES': 2,
        'REPORTS': 10,
        'INTEGRATIONS': 2
      },
      'PRO': {
        'TRANSACTIONS': 5000,
        'API_CALLS': 10000,
        'STORAGE': 100, // GB
        'USERS': 10,
        'COMPANIES': 5,
        'REPORTS': 25,
        'INTEGRATIONS': 15
      },
      'ENTERPRISE': {
        'TRANSACTIONS': -1, // Unlimited
        'API_CALLS': -1, // Unlimited
        'STORAGE': -1, // Unlimited
        'USERS': -1, // Unlimited
        'COMPANIES': -1, // Unlimited
        'REPORTS': -1, // Unlimited
        'INTEGRATIONS': -1 // Unlimited
      }
    };

    return limits[tier][metricType];
  }

  private getResetFrequency(metricType: UsageMetric['metricType']): UsageMetric['resetFrequency'] {
    switch (metricType) {
      case 'API_CALLS':
        return 'DAILY';
      case 'TRANSACTIONS':
      case 'REPORTS':
        return 'MONTHLY';
      case 'STORAGE':
      case 'USERS':
      case 'COMPANIES':
      case 'INTEGRATIONS':
        return 'NEVER';
      default:
        return 'MONTHLY';
    }
  }

  private calculatePeriodEnd(metricType: UsageMetric['metricType']): Date {
    const now = new Date();
    const resetFrequency = this.getResetFrequency(metricType);

    switch (resetFrequency) {
      case 'DAILY':
        {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return tomorrow;
        }
      case 'MONTHLY':
        {
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          nextMonth.setHours(23, 59, 59, 999);
          return nextMonth;
        }
      case 'ANNUALLY':
        {
          const nextYear = new Date(now.getFullYear() + 1, 0, 0);
          nextYear.setHours(23, 59, 59, 999);
          return nextYear;
        }
      case 'NEVER':
        {
          const farFuture = new Date(now.getFullYear() + 100, 0, 0);
          return farFuture;
        }
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
  }

  private generateUsageId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `USAGE${timestamp}${random}`;
  }

  public async updateUsageThreshold(
    metricType: UsageMetric['metricType'],
    threshold: Partial<UsageThreshold>
  ): Promise<void> {
    const existingThreshold = this.thresholds.get(metricType);
    if (!existingThreshold) {
      throw new Error(`Threshold not found for metric type ${metricType}`);
    }

    const updatedThreshold = { ...existingThreshold, ...threshold };
    this.thresholds.set(metricType, updatedThreshold);

    // Log the update
    await this.auditLog.logOperation({
      tenantId: 'SYSTEM',
      userId: 'SYSTEM',
      action: 'UPDATE_USAGE_THRESHOLD',
      details: {
        metricType,
        oldThreshold: existingThreshold,
        newThreshold: updatedThreshold
      },
      ipAddress: 'SYSTEM',
      userAgent: 'USAGE_METER',
      timestamp: new Date(),
      category: 'BILLING',
      severity: 'INFO'
    });
  }

  public async checkUsageLimit(
    tenantId: string,
    metricType: UsageMetric['metricType'],
    requiredValue: number
  ): Promise<{ allowed: boolean; currentUsage: number; limit: number; percentage: number }> {
    const metric = await this.getUsageMetric(tenantId, metricType);
    if (!metric) {
      throw new Error(`Usage metric not found for tenant ${tenantId} and metric ${metricType}`);
    }

    const percentage = (metric.currentValue / metric.limit) * 100;
    const threshold = this.thresholds.get(metricType);
    const hardLimit = threshold?.hardLimit || false;

    const allowed = !hardLimit || (metric.currentValue + requiredValue <= metric.limit);

    return {
      allowed,
      currentUsage: metric.currentValue,
      limit: metric.limit,
      percentage
    };
  }
}
