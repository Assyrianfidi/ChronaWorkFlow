import { TrialManager, Trial } from './trial-manager';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';

export interface AbuseDetectionRule {
  id: string;
  name: string;
  description: string;
  category: 'TRIAL_ABUSE' | 'PAYMENT_FRAUD' | 'API_ABUSE' | 'DATA_SCRAPING' | 'ACCOUNT_TAKEOVER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  conditions: AbuseCondition[];
  actions: AbuseAction[];
  cooldownPeriod: number; // in hours
  falsePositiveThreshold: number;
  lastTriggered?: Date;
  triggerCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface AbuseCondition {
  type: 'IP_FREQUENCY' | 'EMAIL_FREQUENCY' | 'DOMAIN_FREQUENCY' | 'USAGE_PATTERN' | 'BEHAVIORAL' | 'TECHNICAL';
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'CONTAINS' | 'REGEX';
  field: string;
  value: any;
  timeWindow?: number; // in hours
  weight: number;
}

export interface AbuseAction {
  type: 'ALERT' | 'BLOCK' | 'SUSPEND' | 'TERMINATE' | 'RATE_LIMIT' | 'REQUIRE_VERIFICATION';
  parameters: { [key: string]: any };
  delay?: number; // in minutes
  conditions?: string[];
}

export interface AbuseAlert {
  id: string;
  ruleId: string;
  tenantId?: string;
  trialId?: string;
  userId?: string;
  severity: AbuseDetectionRule['severity'];
  category: AbuseDetectionRule['category'];
  title: string;
  description: string;
  evidence: AbuseEvidence[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  actions: AbuseAlertAction[];
}

export interface AbuseEvidence {
  type: 'LOG_ENTRY' | 'METRIC' | 'USER_ACTION' | 'SYSTEM_EVENT' | 'EXTERNAL_DATA';
  description: string;
  value: any;
  timestamp: Date;
  source: string;
  confidence: number;
}

export interface AbuseAlertAction {
  type: 'NOTIFICATION_SENT' | 'ACCOUNT_SUSPENDED' | 'RATE_LIMITED' | 'VERIFICATION_REQUIRED' | 'ESCALATED';
  description: string;
  timestamp: Date;
  performedBy: string;
  result: 'SUCCESS' | 'FAILED' | 'PARTIAL';
}

export interface AbuseMetrics {
  totalAlerts: number;
  alertsBySeverity: { [key: string]: number };
  alertsByCategory: { [key: string]: number };
  alertsByStatus: { [key: string]: number };
  truePositiveRate: number;
  falsePositiveRate: number;
  averageResolutionTime: number;
  blockedAttempts: number;
  preventedLoss: number;
  topTriggeredRules: { ruleId: string; name: string; triggers: number }[];
  riskTrends: { date: string; riskScore: number; alertCount: number }[];
  periodStart: Date;
  periodEnd: Date;
}

export interface AbusePattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  category: AbuseDetectionRule['category'];
  indicators: string[];
  confidence: number;
  severity: AbuseDetectionRule['severity'];
  mitigation: string;
  detectedAt?: Date;
  detectionCount: number;
  isActive: boolean;
}

export interface RiskScore {
  tenantId?: string;
  trialId?: string;
  userId?: string;
  ipAddress?: string;
  email?: string;
  domain?: string;
  overallScore: number;
  factors: RiskFactor[];
  category: 'TRIAL_ABUSE' | 'PAYMENT_FRAUD' | 'API_ABUSE' | 'DATA_SCRAPING' | 'ACCOUNT_TAKEOVER';
  timestamp: Date;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  recommendation: string;
}

export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
  threshold: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export class AbuseDetectionEngine {
  private static instance: AbuseDetectionEngine;
  private auditLog: ImmutableAuditLogger;
  private trialManager: TrialManager;
  private rules: Map<string, AbuseDetectionRule> = new Map();
  private alerts: Map<string, AbuseAlert> = new Map();
  private patterns: Map<string, AbusePattern> = new Map();
  private riskScores: Map<string, RiskScore> = new Map();
  private ipReputation: Map<string, IPReputation> = new Map();
  private domainReputation: Map<string, DomainReputation> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.trialManager = TrialManager.getInstance();
    this.initializeDefaultRules();
    this.initializePatterns();
  }

  public static getInstance(): AbuseDetectionEngine {
    if (!AbuseDetectionEngine.instance) {
      AbuseDetectionEngine.instance = new AbuseDetectionEngine();
    }
    return AbuseDetectionEngine.instance;
  }

  private initializeDefaultRules(): void {
    const rules: AbuseDetectionRule[] = [
      {
        id: 'MULTIPLE_TRIALS_SAME_EMAIL',
        name: 'Multiple Trials from Same Email',
        description: 'Detect when same email creates multiple trials',
        category: 'TRIAL_ABUSE',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            type: 'EMAIL_FREQUENCY',
            operator: 'GREATER_THAN',
            field: 'trial_count',
            value: 1,
            timeWindow: 24,
            weight: 1.0
          }
        ],
        actions: [
          {
            type: 'ALERT',
            parameters: { message: 'Multiple trials detected from same email' }
          },
          {
            type: 'REQUIRE_VERIFICATION',
            parameters: { method: 'EMAIL_VERIFICATION' }
          }
        ],
        cooldownPeriod: 24,
        falsePositiveThreshold: 0.1,
        triggerCount: 0,
        createdBy: 'SYSTEM',
        createdAt: new Date()
      },
      {
        id: 'RAPID_TRIAL_CREATION',
        name: 'Rapid Trial Creation',
        description: 'Detect rapid creation of trials from same IP',
        category: 'TRIAL_ABUSE',
        severity: 'MEDIUM',
        enabled: true,
        conditions: [
          {
            type: 'IP_FREQUENCY',
            operator: 'GREATER_THAN',
            field: 'trial_creation_count',
            value: 5,
            timeWindow: 1,
            weight: 0.8
          }
        ],
        actions: [
          {
            type: 'RATE_LIMIT',
            parameters: { limit: 1, window: 3600 }
          },
          {
            type: 'ALERT',
            parameters: { message: 'Rapid trial creation detected' }
          }
        ],
        cooldownPeriod: 1,
        falsePositiveThreshold: 0.2,
        triggerCount: 0,
        createdBy: 'SYSTEM',
        createdAt: new Date()
      },
      {
        id: 'SUSPICIOUS_USAGE_PATTERN',
        name: 'Suspicious Usage Pattern',
        description: 'Detect unusual usage patterns in trials',
        category: 'API_ABUSE',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            type: 'USAGE_PATTERN',
            operator: 'GREATER_THAN',
            field: 'api_calls_per_minute',
            value: 1000,
            timeWindow: 1,
            weight: 0.9
          }
        ],
        actions: [
          {
            type: 'RATE_LIMIT',
            parameters: { limit: 100, window: 60 }
          },
          {
            type: 'ALERT',
            parameters: { message: 'Suspicious API usage pattern detected' }
          }
        ],
        cooldownPeriod: 0.5,
        falsePositiveThreshold: 0.15,
        triggerCount: 0,
        createdBy: 'SYSTEM',
        createdAt: new Date()
      },
      {
        id: 'DATA_SCRAPING_DETECTION',
        name: 'Data Scraping Detection',
        description: 'Detect potential data scraping activities',
        category: 'DATA_SCRAPING',
        severity: 'CRITICAL',
        enabled: true,
        conditions: [
          {
            type: 'BEHAVIORAL',
            operator: 'GREATER_THAN',
            field: 'data_export_requests',
            value: 50,
            timeWindow: 1,
            weight: 1.0
          },
          {
            type: 'TECHNICAL',
            operator: 'CONTAINS',
            field: 'user_agent',
            value: 'bot|crawler|scraper',
            weight: 0.7
          }
        ],
        actions: [
          {
            type: 'SUSPEND',
            parameters: { reason: 'Data scraping detected', duration: 24 }
          },
          {
            type: 'ALERT',
            parameters: { message: 'Data scraping activity detected' }
          }
        ],
        cooldownPeriod: 2,
        falsePositiveThreshold: 0.05,
        triggerCount: 0,
        createdBy: 'SYSTEM',
        createdAt: new Date()
      },
      {
        id: 'ACCOUNT_TAKEOVER_ATTEMPT',
        name: 'Account Takeover Attempt',
        description: 'Detect potential account takeover attempts',
        category: 'ACCOUNT_TAKEOVER',
        severity: 'CRITICAL',
        enabled: true,
        conditions: [
          {
            type: 'BEHAVIORAL',
            operator: 'GREATER_THAN',
            field: 'failed_login_attempts',
            value: 10,
            timeWindow: 1,
            weight: 0.9
          },
          {
            type: 'IP_FREQUENCY',
            operator: 'GREATER_THAN',
            field: 'unique_ip_addresses',
            value: 5,
            timeWindow: 1,
            weight: 0.8
          }
        ],
        actions: [
          {
            type: 'BLOCK',
            parameters: { reason: 'Account takeover attempt detected' }
          },
          {
            type: 'ALERT',
            parameters: { message: 'Account takeover attempt detected' }
          }
        ],
        cooldownPeriod: 0.25,
        falsePositiveThreshold: 0.1,
        triggerCount: 0,
        createdBy: 'SYSTEM',
        createdAt: new Date()
      }
    ];

    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private initializePatterns(): void {
    const patterns: AbusePattern[] = [
      {
        id: 'TRIAL_ABUSE_PATTERN',
        name: 'Trial Abuse Pattern',
        description: 'Common pattern for trial abuse scenarios',
        pattern: 'multiple_trials + rapid_creation + suspicious_usage',
        category: 'TRIAL_ABUSE',
        indicators: ['multiple_trials_same_email', 'rapid_trial_creation', 'suspicious_usage_pattern'],
        confidence: 0.85,
        severity: 'HIGH',
        mitigation: 'Require verification and limit trial creation',
        detectionCount: 0,
        isActive: true
      },
      {
        id: 'API_ABUSE_PATTERN',
        name: 'API Abuse Pattern',
        description: 'Pattern for API abuse and automation',
        pattern: 'high_api_usage + automated_behavior + data_export',
        category: 'API_ABUSE',
        indicators: ['suspicious_usage_pattern', 'data_scraping_detection'],
        confidence: 0.9,
        severity: 'CRITICAL',
        mitigation: 'Rate limit and require CAPTCHA',
        detectionCount: 0,
        isActive: true
      }
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  public async analyzeActivity(
    activity: {
      type: string;
      tenantId?: string;
      trialId?: string;
      userId?: string;
      email?: string;
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
      metadata?: { [key: string]: any };
    }
  ): Promise<void> {
    try {
      // Check all enabled rules
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;

        // Check cooldown period
        if (rule.lastTriggered && 
            Date.now() - rule.lastTriggered.getTime() < rule.cooldownPeriod * 60 * 60 * 1000) {
          continue;
        }

        // Evaluate rule conditions
        const isTriggered = await this.evaluateRule(rule, activity);
        
        if (isTriggered) {
          await this.triggerRule(rule, activity);
        }
      }

      // Update risk scores
      await this.updateRiskScores(activity);

      // Check for patterns
      await this.checkPatterns(activity);

    } catch (error) {
      await this.auditLog.logOperation({
        tenantId: activity.tenantId || 'UNKNOWN',
        userId: activity.userId || 'SYSTEM',
        action: 'ANALYZE_ACTIVITY_ERROR',
        details: {
          error: (error as Error).message,
          activityType: activity.type,
          ipAddress: activity.ipAddress
        },
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        timestamp: new Date(),
        category: 'ABUSE_DETECTION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async evaluateRule(
    rule: AbuseDetectionRule,
    activity: any
  ): Promise<boolean> {
    let totalScore = 0;
    let metConditions = 0;

    for (const condition of rule.conditions) {
      const isMet = await this.evaluateCondition(condition, activity);
      if (isMet) {
        totalScore += condition.weight;
        metConditions++;
      }
    }

    // Rule is triggered if enough conditions are met with sufficient weight
    const threshold = 0.7; // 70% of total weight needed
    const totalWeight = rule.conditions.reduce((sum, c) => sum + c.weight, 0);
    const score = totalWeight > 0 ? totalScore / totalWeight : 0;

    return score >= threshold;
  }

  private async evaluateCondition(
    condition: AbuseCondition,
    activity: any
  ): Promise<boolean> {
    let value: any;

    switch (condition.type) {
      case 'IP_FREQUENCY':
        value = await this.getIPFrequency(condition.field, activity.ipAddress, condition.timeWindow);
        break;
      case 'EMAIL_FREQUENCY':
        value = await this.getEmailFrequency(condition.field, activity.email, condition.timeWindow);
        break;
      case 'DOMAIN_FREQUENCY':
        value = await this.getDomainFrequency(condition.field, activity.email, condition.timeWindow);
        break;
      case 'USAGE_PATTERN':
        value = await this.getUsageMetric(condition.field, activity.tenantId, condition.timeWindow);
        break;
      case 'BEHAVIORAL':
        value = await this.getBehavioralMetric(condition.field, activity, condition.timeWindow);
        break;
      case 'TECHNICAL':
        value = await this.getTechnicalMetric(condition.field, activity);
        break;
      default:
        return false;
    }

    return this.compareValues(value, condition.operator, condition.value);
  }

  private async getIPFrequency(
    field: string,
    ipAddress: string,
    timeWindow?: number
  ): Promise<number> {
    // Simplified implementation - would query actual data
    const reputation = this.ipReputation.get(ipAddress);
    if (reputation) {
      switch (field) {
        case 'trial_creation_count':
          return reputation.trialCreations || 0;
        case 'failed_login_attempts':
          return reputation.failedLogins || 0;
        default:
          return 0;
      }
    }
    return 0;
  }

  private async getEmailFrequency(
    field: string,
    email?: string,
    timeWindow?: number
  ): Promise<number> {
    if (!email) return 0;
    
    // Simplified implementation - would query actual data
    const trials = await this.trialManager.getTrialsByStatus('ACTIVE');
    return trials.filter(t => t.contactInfo.email === email).length;
  }

  private async getDomainFrequency(
    field: string,
    email?: string,
    timeWindow?: number
  ): Promise<number> {
    if (!email) return 0;
    
    const domain = email.split('@')[1];
    const reputation = this.domainReputation.get(domain);
    if (reputation) {
      return reputation.trialCount || 0;
    }
    return 0;
  }

  private async getUsageMetric(
    field: string,
    tenantId?: string,
    timeWindow?: number
  ): Promise<number> {
    // Simplified implementation - would query actual usage data
    switch (field) {
      case 'api_calls_per_minute':
        return Math.floor(Math.random() * 2000); // Placeholder
      case 'data_export_requests':
        return Math.floor(Math.random() * 100); // Placeholder
      default:
        return 0;
    }
  }

  private async getBehavioralMetric(
    field: string,
    activity: any,
    timeWindow?: number
  ): Promise<number> {
    // Simplified implementation - would query behavioral data
    switch (field) {
      case 'failed_login_attempts':
        return Math.floor(Math.random() * 20); // Placeholder
      case 'unique_ip_addresses':
        return Math.floor(Math.random() * 10); // Placeholder
      default:
        return 0;
    }
  }

  private async getTechnicalMetric(
    field: string,
    activity: any
  ): Promise<boolean> {
    switch (field) {
      case 'user_agent':
        if (!activity.userAgent) return false;
        {
          const regex = new RegExp(condition.value as string, 'i');
          return regex.test(activity.userAgent);
        }
      default:
        return false;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'EQUALS':
        return actual === expected;
      case 'GREATER_THAN':
        return Number(actual) > Number(expected);
      case 'LESS_THAN':
        return Number(actual) < Number(expected);
      case 'BETWEEN':
        {
          const [min, max] = expected;
          return Number(actual) >= Number(min) && Number(actual) <= Number(max);
        }
      case 'CONTAINS':
        return String(actual).includes(String(expected));
      case 'REGEX':
        {
          const regex = new RegExp(expected, 'i');
          return regex.test(String(actual));
        }
      default:
        return false;
    }
  }

  private async triggerRule(
    rule: AbuseDetectionRule,
    activity: any
  ): Promise<void> {
    // Update rule trigger info
    rule.lastTriggered = new Date();
    rule.triggerCount++;

    // Create alert
    const alert = await this.createAlert(rule, activity);

    // Execute actions
    for (const action of rule.actions) {
      await this.executeAction(action, alert, activity);
    }

    // Log the rule trigger
    await this.auditLog.logOperation({
      tenantId: activity.tenantId || 'UNKNOWN',
      userId: activity.userId || 'SYSTEM',
      action: 'ABUSE_RULE_TRIGGERED',
      details: {
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        alertId: alert.id
      },
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      timestamp: new Date(),
      category: 'ABUSE_DETECTION',
      severity: 'WARNING'
    });
  }

  private async createAlert(
    rule: AbuseDetectionRule,
    activity: any
  ): Promise<AbuseAlert> {
    const alertId = this.generateAlertId();

    const evidence: AbuseEvidence[] = [
      {
        type: 'USER_ACTION',
        description: 'Triggering activity',
        value: activity,
        timestamp: activity.timestamp,
        source: 'ABUSE_DETECTION',
        confidence: 0.9
      }
    ];

    const alert: AbuseAlert = {
      id: alertId,
      ruleId: rule.id,
      tenantId: activity.tenantId,
      trialId: activity.trialId,
      userId: activity.userId,
      severity: rule.severity,
      category: rule.category,
      title: rule.name,
      description: rule.description,
      evidence,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      timestamp: new Date(),
      status: 'OPEN',
      actions: []
    };

    this.alerts.set(alertId, alert);
    return alert;
  }

  private async executeAction(
    action: AbuseAction,
    alert: AbuseAlert,
    activity: any
  ): Promise<void> {
    // Apply delay if specified
    if (action.delay && action.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, action.delay * 60 * 1000));
    }

    let result: 'SUCCESS' | 'FAILED' | 'PARTIAL' = 'SUCCESS';
    let description = '';

    try {
      switch (action.type) {
        case 'ALERT':
          await this.sendAlert(alert, action.parameters);
          description = `Alert sent: ${action.parameters.message}`;
          break;
        case 'BLOCK':
          await this.blockAccess(activity, action.parameters);
          description = `Access blocked: ${action.parameters.reason}`;
          break;
        case 'SUSPEND':
          await this.suspendAccount(activity, action.parameters);
          description = `Account suspended: ${action.parameters.reason}`;
          break;
        case 'TERMINATE':
          await this.terminateAccount(activity, action.parameters);
          description = `Account terminated: ${action.parameters.reason}`;
          break;
        case 'RATE_LIMIT':
          await this.applyRateLimit(activity, action.parameters);
          description = `Rate limit applied: ${action.parameters.limit} per ${action.parameters.window}s`;
          break;
        case 'REQUIRE_VERIFICATION':
          await this.requireVerification(activity, action.parameters);
          description = `Verification required: ${action.parameters.method}`;
          break;
        default:
          result = 'FAILED';
          description = `Unknown action type: ${action.type}`;
      }
    } catch (error) {
      result = 'FAILED';
      description = `Action failed: ${(error as Error).message}`;
    }

    // Record action
    const alertAction: AbuseAlertAction = {
      type: action.type as any,
      description,
      timestamp: new Date(),
      performedBy: 'SYSTEM',
      result
    };
    alert.actions.push(alertAction);
  }

  private async sendAlert(alert: AbuseAlert, parameters: any): Promise<void> {
    // Send alert to security team
    // This would integrate with notification systems
    console.log(`ALERT: ${parameters.message} - ${alert.id}`);
  }

  private async blockAccess(activity: any, parameters: any): Promise<void> {
    // Block access from IP address or user
    // This would integrate with access control systems
    console.log(`BLOCKING access: ${parameters.reason}`);
  }

  private async suspendAccount(activity: any, parameters: any): Promise<void> {
    // Suspend trial or account
    if (activity.trialId) {
      await this.trialManager.suspendTrial(
        activity.trialId,
        'ABUSE_DETECTION',
        parameters.reason
      );
    }
  }

  private async terminateAccount(activity: any, parameters: any): Promise<void> {
    // Terminate trial or account
    if (activity.trialId) {
      await this.trialManager.cancelTrial(
        activity.trialId,
        'ABUSE_DETECTION',
        parameters.reason
      );
    }
  }

  private async applyRateLimit(activity: any, parameters: any): Promise<void> {
    // Apply rate limiting
    console.log(`RATE LIMIT: ${parameters.limit} per ${parameters.window}s`);
  }

  private async requireVerification(activity: any, parameters: any): Promise<void> {
    // Require additional verification
    console.log(`VERIFICATION REQUIRED: ${parameters.method}`);
  }

  private async updateRiskScores(activity: any): Promise<void> {
    // Update risk scores for various entities
    await this.updateIPRiskScore(activity.ipAddress, activity);
    if (activity.email) {
      await this.updateEmailRiskScore(activity.email, activity);
    }
    if (activity.tenantId) {
      await this.updateTenantRiskScore(activity.tenantId, activity);
    }
  }

  private async updateIPRiskScore(ipAddress: string, activity: any): Promise<void> {
    const existing = this.riskScores.get(ipAddress);
    const factors: RiskFactor[] = [
      {
        name: 'Recent Activity',
        value: 1,
        weight: 0.3,
        description: 'Recent activity from this IP',
        threshold: 5,
        status: 'NORMAL'
      }
    ];

    const score = this.calculateRiskScore(factors);
    const riskScore: RiskScore = {
      ipAddress,
      overallScore: score,
      factors,
      category: 'TRIAL_ABUSE',
      timestamp: new Date(),
      trend: existing ? this.calculateTrend(existing.overallScore, score) : 'STABLE',
      recommendation: score > 70 ? 'Monitor closely' : 'Normal activity'
    };

    this.riskScores.set(ipAddress, riskScore);
  }

  private async updateEmailRiskScore(email: string, activity: any): Promise<void> {
    const existing = this.riskScores.get(email);
    const factors: RiskFactor[] = [
      {
        name: 'Email Activity',
        value: 1,
        weight: 0.4,
        description: 'Recent activity from this email',
        threshold: 3,
        status: 'NORMAL'
      }
    ];

    const score = this.calculateRiskScore(factors);
    const riskScore: RiskScore = {
      email,
      overallScore: score,
      factors,
      category: 'TRIAL_ABUSE',
      timestamp: new Date(),
      trend: existing ? this.calculateTrend(existing.overallScore, score) : 'STABLE',
      recommendation: score > 60 ? 'Verify identity' : 'Normal activity'
    };

    this.riskScores.set(email, riskScore);
  }

  private async updateTenantRiskScore(tenantId: string, activity: any): Promise<void> {
    const existing = this.riskScores.get(tenantId);
    const factors: RiskFactor[] = [
      {
        name: 'Tenant Activity',
        value: 1,
        weight: 0.5,
        description: 'Recent activity in this tenant',
        threshold: 10,
        status: 'NORMAL'
      }
    ];

    const score = this.calculateRiskScore(factors);
    const riskScore: RiskScore = {
      tenantId,
      overallScore: score,
      factors,
      category: 'API_ABUSE',
      timestamp: new Date(),
      trend: existing ? this.calculateTrend(existing.overallScore, score) : 'STABLE',
      recommendation: score > 80 ? 'Investigate immediately' : 'Monitor'
    };

    this.riskScores.set(tenantId, riskScore);
  }

  private calculateRiskScore(factors: RiskFactor[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      totalScore += factor.value * factor.weight;
      totalWeight += factor.weight;
    }

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  private calculateTrend(oldScore: number, newScore: number): 'INCREASING' | 'DECREASING' | 'STABLE' {
    const diff = newScore - oldScore;
    if (diff > 10) return 'INCREASING';
    if (diff < -10) return 'DECREASING';
    return 'STABLE';
  }

  private async checkPatterns(activity: any): Promise<void> {
    // Check if activity matches known abuse patterns
    for (const pattern of this.patterns.values()) {
      if (!pattern.isActive) continue;

      const matches = await this.evaluatePattern(pattern, activity);
      if (matches) {
        pattern.detectionCount++;
        pattern.detectedAt = new Date();
        
        // Create high-priority alert for pattern match
        await this.createPatternAlert(pattern, activity);
      }
    }
  }

  private async evaluatePattern(pattern: AbusePattern, activity: any): Promise<boolean> {
    // Simplified pattern evaluation
    // In production, this would use more sophisticated pattern matching
    return Math.random() > 0.8; // Placeholder
  }

  private async createPatternAlert(pattern: AbusePattern, activity: any): Promise<void> {
    const alertId = this.generateAlertId();

    const evidence: AbuseEvidence[] = [
      {
        type: 'SYSTEM_EVENT',
        description: 'Pattern match detected',
        value: { patternId: pattern.id, patternName: pattern.name },
        timestamp: new Date(),
        source: 'PATTERN_DETECTION',
        confidence: pattern.confidence
      }
    ];

    const alert: AbuseAlert = {
      id: alertId,
      ruleId: pattern.id,
      tenantId: activity.tenantId,
      trialId: activity.trialId,
      userId: activity.userId,
      severity: pattern.severity,
      category: pattern.category,
      title: `Pattern Detected: ${pattern.name}`,
      description: pattern.description,
      evidence,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      timestamp: new Date(),
      status: 'OPEN',
      actions: []
    };

    this.alerts.set(alertId, alert);
  }

  public async getAlert(alertId: string): Promise<AbuseAlert | null> {
    return this.alerts.get(alertId) || null;
  }

  public async getAlertsByStatus(status: AbuseAlert['status']): Promise<AbuseAlert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.status === status);
  }

  public async getRiskScore(entityId: string): Promise<RiskScore | null> {
    return this.riskScores.get(entityId) || null;
  }

  public async getAbuseMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<AbuseMetrics> {
    const alerts = Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= startDate && alert.timestamp <= endDate);

    const alertsBySeverity: { [key: string]: number } = {};
    const alertsByCategory: { [key: string]: number } = {};
    const alertsByStatus: { [key: string]: number } = {};

    alerts.forEach(alert => {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      alertsByCategory[alert.category] = (alertsByCategory[alert.category] || 0) + 1;
      alertsByStatus[alert.status] = (alertsByStatus[alert.status] || 0) + 1;
    });

    const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');
    const falsePositives = alerts.filter(a => a.status === 'FALSE_POSITIVE');
    
    const truePositiveRate = alerts.length > 0 ? ((resolvedAlerts.length - falsePositives.length) / alerts.length) * 100 : 0;
    const falsePositiveRate = alerts.length > 0 ? (falsePositives.length / alerts.length) * 100 : 0;

    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, a) => {
          const time = a.resolvedAt ? a.resolvedAt.getTime() - a.timestamp.getTime() : 0;
          return sum + time;
        }, 0) / resolvedAlerts.length / (24 * 60 * 60 * 1000)
      : 0;

    return {
      totalAlerts: alerts.length,
      alertsBySeverity,
      alertsByCategory,
      alertsByStatus,
      truePositiveRate,
      falsePositiveRate,
      averageResolutionTime,
      blockedAttempts: 0, // Placeholder
      preventedLoss: 0, // Placeholder
      topTriggeredRules: [], // Placeholder
      riskTrends: [], // Placeholder
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  private generateAlertId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ALERT${timestamp}${random}`;
  }
}

interface IPReputation {
  ipAddress: string;
  trialCreations: number;
  failedLogins: number;
  suspiciousActivity: number;
  lastSeen: Date;
  reputation: 'GOOD' | 'SUSPICIOUS' | 'MALICIOUS';
}

interface DomainReputation {
  domain: string;
  trialCount: number;
  bounceRate: number;
  spamComplaints: number;
  lastSeen: Date;
  reputation: 'GOOD' | 'SUSPICIOUS' | 'MALICIOUS';
}
