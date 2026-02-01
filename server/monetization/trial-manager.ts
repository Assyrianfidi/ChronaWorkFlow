import { ProductTier } from './product-tiers';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';
import { GovernanceModelManager } from '../governance/governance-model';

export interface Trial {
  id: string;
  tenantId: string;
  trialType: 'FREE_TIER' | 'STARTER_TRIAL' | 'PRO_TRIAL' | 'ENTERPRISE_TRIAL' | 'CUSTOM_TRIAL';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
  trialNumber: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  targetTier: ProductTier;
  features: TrialFeature[];
  limits: TrialLimit[];
  usage: TrialUsage[];
  conversionSettings: ConversionSettings;
  abusePrevention: AbusePreventionSettings;
  contactInfo: TrialContactInfo;
  billingInfo: TrialBillingInfo;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  convertedAt?: Date;
  convertedToTier?: ProductTier;
  cancellationReason?: string;
  suspensionReason?: string;
  notes: TrialNote[];
  activities: TrialActivity[];
}

export interface TrialFeature {
  featureId: string;
  featureName: string;
  enabled: boolean;
  accessLevel: 'FULL' | 'LIMITED' | 'DEMO';
  restrictions?: string[];
  demoData?: boolean;
}

export interface TrialLimit {
  metric: string;
  limit: number;
  currentUsage: number;
  unit: string;
  hardLimit: boolean;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface TrialUsage {
  metric: string;
  value: number;
  timestamp: Date;
  source: string;
  description: string;
}

export interface ConversionSettings {
  autoConvert: boolean;
  conversionTier: ProductTier;
  conversionDiscount: number;
  gracePeriod: number; // days after trial end
  paymentMethodRequired: boolean;
  approvalRequired: boolean;
  conversionTriggers: ConversionTrigger[];
}

export interface ConversionTrigger {
  type: 'USAGE_THRESHOLD' | 'FEATURE_USAGE' | 'TIME_BASED' | 'MANUAL';
  condition: string;
  value: number;
  action: 'CONVERT' | 'NOTIFY' | 'EXTEND';
}

export interface AbusePreventionSettings {
  maxTrialsPerEmail: number;
  maxTrialsPerIP: number;
  maxTrialsPerDomain: number;
  trialCooldownPeriod: number; // days
  verificationRequired: boolean;
  monitoringLevel: 'BASIC' | 'ENHANCED' | 'STRICT';
  suspiciousActivityThresholds: SuspiciousActivityThreshold[];
}

export interface SuspiciousActivityThreshold {
  activity: string;
  threshold: number;
  timeWindow: number; // in hours
  action: 'WARN' | 'SUSPEND' | 'TERMINATE';
}

export interface TrialContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  companySize: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  jobTitle: string;
  country: string;
  state: string;
  useCase: string;
  referralSource: string;
}

export interface TrialBillingInfo {
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  paymentMethod?: {
    type: 'CREDIT_CARD' | 'BANK_TRANSFER';
    lastFour?: string;
    token?: string;
  };
  poNumber?: string;
}

export interface TrialNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  category: 'GENERAL' | 'SUPPORT' | 'ABUSE' | 'CONVERSION' | 'TECHNICAL';
  visibility: 'INTERNAL' | 'TEAM' | 'ALL';
}

export interface TrialActivity {
  id: string;
  type: 'LOGIN' | 'FEATURE_USE' | 'DATA_IMPORT' | 'EXPORT' | 'INVITE' | 'SUPPORT_REQUEST';
  description: string;
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: { [key: string]: any };
}

export interface TrialMetrics {
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedTrials: number;
  cancelledTrials: number;
  conversionRate: number;
  averageTrialDuration: number;
  trialToConversionTime: number;
  trialsByType: { [key: string]: number };
  trialsByIndustry: { [key: string]: number };
  trialsByCompanySize: { [key: string]: number };
  topConversionFeatures: { feature: string; conversionRate: number }[];
  abandonmentReasons: { reason: string; count: number }[];
  periodStart: Date;
  periodEnd: Date;
}

export interface TrialTemplate {
  id: string;
  name: string;
  description: string;
  trialType: Trial['trialType'];
  targetTier: ProductTier;
  duration: number;
  features: Omit<TrialFeature, 'featureId'>[];
  limits: Omit<TrialLimit, 'currentUsage'>[];
  conversionSettings: ConversionSettings;
  abusePrevention: AbusePreventionSettings;
  isActive: boolean;
  createdFor: string; // industry or segment
  createdBy: string;
  createdAt: Date;
}

export class TrialManager {
  private static instance: TrialManager;
  private auditLog: ImmutableAuditLogger;
  private governanceManager: GovernanceModelManager;
  private trials: Map<string, Trial> = new Map();
  private templates: Map<string, TrialTemplate> = new Map();
  private emailTrials: Map<string, number> = new Map();
  private ipTrials: Map<string, number> = new Map();
  private domainTrials: Map<string, number> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.governanceManager = new GovernanceModelManager();
    this.initializeDefaultTemplates();
  }

  public static getInstance(): TrialManager {
    if (!TrialManager.instance) {
      TrialManager.instance = new TrialManager();
    }
    return TrialManager.instance;
  }

  private initializeDefaultTemplates(): void {
    const templates: TrialTemplate[] = [
      {
        id: 'STARTER_TRIAL_TEMPLATE',
        name: 'Starter Trial',
        description: '14-day trial of Starter tier features',
        trialType: 'STARTER_TRIAL',
        targetTier: 'STARTER',
        duration: 14,
        features: [
          {
            featureName: 'Multi-User Access',
            enabled: true,
            accessLevel: 'LIMITED',
            restrictions: ['max_3_users'],
            demoData: false
          },
          {
            featureName: 'Basic Compliance',
            enabled: true,
            accessLevel: 'FULL',
            demoData: false
          },
          {
            featureName: 'API Access',
            enabled: true,
            accessLevel: 'LIMITED',
            restrictions: ['1000_calls_per_day'],
            demoData: false
          },
          {
            featureName: 'Email Support',
            enabled: true,
            accessLevel: 'FULL',
            demoData: false
          }
        ],
        limits: [
          {
            metric: 'users',
            limit: 3,
            unit: 'users',
            hardLimit: true,
            warningThreshold: 2,
            criticalThreshold: 3
          },
          {
            metric: 'transactions',
            limit: 100,
            unit: 'transactions',
            hardLimit: false,
            warningThreshold: 80,
            criticalThreshold: 95
          },
          {
            metric: 'api_calls',
            limit: 1000,
            unit: 'calls/day',
            hardLimit: true,
            warningThreshold: 800,
            criticalThreshold: 950
          }
        ],
        conversionSettings: {
          autoConvert: false,
          conversionTier: 'STARTER',
          conversionDiscount: 20,
          gracePeriod: 7,
          paymentMethodRequired: true,
          approvalRequired: false,
          conversionTriggers: [
            {
              type: 'USAGE_THRESHOLD',
              condition: 'transactions > 80',
              value: 80,
              action: 'NOTIFY'
            },
            {
              type: 'TIME_BASED',
              condition: 'trial_days_remaining <= 3',
              value: 3,
              action: 'NOTIFY'
            }
          ]
        },
        abusePrevention: {
          maxTrialsPerEmail: 1,
          maxTrialsPerIP: 3,
          maxTrialsPerDomain: 5,
          trialCooldownPeriod: 30,
          verificationRequired: true,
          monitoringLevel: 'ENHANCED',
          suspiciousActivityThresholds: [
            {
              activity: 'rapid_feature_usage',
              threshold: 100,
              timeWindow: 1,
              action: 'WARN'
            },
            {
              activity: 'multiple_logins',
              threshold: 10,
              timeWindow: 24,
              action: 'SUSPEND'
            }
          ]
        },
        isActive: true,
        createdFor: 'GENERAL',
        createdBy: 'SYSTEM',
        createdAt: new Date()
      },
      {
        id: 'PRO_TRIAL_TEMPLATE',
        name: 'Pro Trial',
        description: '21-day trial of Pro tier features',
        trialType: 'PRO_TRIAL',
        targetTier: 'PRO',
        duration: 21,
        features: [
          {
            featureName: 'Multi-User Access',
            enabled: true,
            accessLevel: 'LIMITED',
            restrictions: ['max_10_users'],
            demoData: false
          },
          {
            featureName: 'Advanced Compliance',
            enabled: true,
            accessLevel: 'FULL',
            demoData: false
          },
          {
            featureName: 'Custom Integrations',
            enabled: true,
            accessLevel: 'LIMITED',
            restrictions: ['max_5_integrations'],
            demoData: false
          },
          {
            featureName: 'Priority Support',
            enabled: true,
            accessLevel: 'FULL',
            demoData: false
          },
          {
            featureName: 'Advanced Analytics',
            enabled: true,
            accessLevel: 'FULL',
            demoData: true
          }
        ],
        limits: [
          {
            metric: 'users',
            limit: 10,
            unit: 'users',
            hardLimit: true,
            warningThreshold: 8,
            criticalThreshold: 10
          },
          {
            metric: 'transactions',
            limit: 1000,
            unit: 'transactions',
            hardLimit: false,
            warningThreshold: 800,
            criticalThreshold: 950
          },
          {
            metric: 'api_calls',
            limit: 10000,
            unit: 'calls/day',
            hardLimit: true,
            warningThreshold: 8000,
            criticalThreshold: 9500
          }
        ],
        conversionSettings: {
          autoConvert: false,
          conversionTier: 'PRO',
          conversionDiscount: 15,
          gracePeriod: 14,
          paymentMethodRequired: true,
          approvalRequired: false,
          conversionTriggers: [
            {
              type: 'USAGE_THRESHOLD',
              condition: 'transactions > 800',
              value: 800,
              action: 'NOTIFY'
            },
            {
              type: 'FEATURE_USAGE',
              condition: 'advanced_analytics_usage > 50',
              value: 50,
              action: 'NOTIFY'
            }
          ]
        },
        abusePrevention: {
          maxTrialsPerEmail: 1,
          maxTrialsPerIP: 2,
          maxTrialsPerDomain: 3,
          trialCooldownPeriod: 60,
          verificationRequired: true,
          monitoringLevel: 'STRICT',
          suspiciousActivityThresholds: [
            {
              activity: 'data_export_volume',
              threshold: 1000,
              timeWindow: 24,
              action: 'SUSPEND'
            },
            {
              activity: 'concurrent_sessions',
              threshold: 5,
              timeWindow: 1,
              action: 'WARN'
            }
          ]
        },
        isActive: true,
        createdFor: 'ENTERPRISE',
        createdBy: 'SYSTEM',
        createdAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  public async createTrial(
    templateId: string,
    contactInfo: TrialContactInfo,
    billingInfo?: TrialBillingInfo,
    createdBy: string
  ): Promise<Trial> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Check abuse prevention
      await this.checkAbusePrevention(contactInfo.email, template.abusePrevention);

      // Generate trial ID and number
      const trialId = this.generateTrialId();
      const trialNumber = this.generateTrialNumber();

      // Create trial
      const trial: Trial = {
        id: trialId,
        tenantId: trialId, // Use trial ID as tenant ID for isolation
        trialType: template.trialType,
        status: 'PENDING',
        trialNumber,
        startDate: new Date(),
        endDate: new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000),
        duration: template.duration,
        targetTier: template.targetTier,
        features: template.features.map((f, index) => ({
          ...f,
          featureId: `feature_${index}`
        })),
        limits: template.limits.map(limit => ({
          ...limit,
          currentUsage: 0
        })),
        usage: [],
        conversionSettings: template.conversionSettings,
        abusePrevention: template.abusePrevention,
        contactInfo,
        billingInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        notes: [],
        activities: []
      };

      // Store trial
      this.trials.set(trialId, trial);

      // Update abuse prevention counters
      this.updateAbusePreventionCounters(contactInfo.email, template.abusePrevention);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trialId,
        userId: createdBy,
        action: 'CREATE_TRIAL',
        details: {
          trialId,
          trialType: template.trialType,
          targetTier: template.targetTier,
          contactEmail: contactInfo.email
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'INFO'
      });

      return trial;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId: 'UNKNOWN',
        userId: createdBy,
        action: 'CREATE_TRIAL_ERROR',
        details: {
          error: (error as Error).message,
          templateId,
          contactEmail: contactInfo.email
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async checkAbusePrevention(
    email: string,
    settings: AbusePreventionSettings
  ): Promise<void> {
    const domain = email.split('@')[1];
    const now = new Date();

    // Check email trials
    const emailCount = this.emailTrials.get(email) || 0;
    if (emailCount >= settings.maxTrialsPerEmail) {
      throw new Error(`Maximum trials per email (${settings.maxTrialsPerEmail}) exceeded`);
    }

    // Check domain trials
    const domainCount = this.domainTrials.get(domain) || 0;
    if (domainCount >= settings.maxTrialsPerDomain) {
      throw new Error(`Maximum trials per domain (${settings.maxTrialsPerDomain}) exceeded`);
    }

    // Check cooldown period
    // This would require checking trial history - simplified for now
  }

  private updateAbusePreventionCounters(
    email: string,
    settings: AbusePreventionSettings
  ): void {
    const domain = email.split('@')[1];

    // Update counters
    this.emailTrials.set(email, (this.emailTrials.get(email) || 0) + 1);
    this.domainTrials.set(domain, (this.domainTrials.get(domain) || 0) + 1);
  }

  public async activateTrial(trialId: string, activatedBy: string): Promise<void> {
    try {
      const trial = this.trials.get(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      if (trial.status !== 'PENDING') {
        throw new Error(`Trial ${trialId} is not in PENDING status`);
      }

      // Activate trial
      trial.status = 'ACTIVE';
      trial.startDate = new Date();
      trial.endDate = new Date(Date.now() + trial.duration * 24 * 60 * 60 * 1000);
      trial.updatedAt = new Date();

      // Add activity
      const activity: TrialActivity = {
        id: this.generateActivityId(),
        type: 'LOGIN',
        description: 'Trial activated',
        timestamp: new Date(),
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER'
      };
      trial.activities.push(activity);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trialId,
        userId: activatedBy,
        action: 'ACTIVATE_TRIAL',
        details: {
          trialId,
          startDate: trial.startDate,
          endDate: trial.endDate
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'INFO'
      });
    } catch (error) {
      const trial = this.trials.get(trialId);
      await this.auditLog.logOperation({
        tenantId: trial?.tenantId || 'UNKNOWN',
        userId: activatedBy,
        action: 'ACTIVATE_TRIAL_ERROR',
        details: {
          error: (error as Error).message,
          trialId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async recordTrialUsage(
    trialId: string,
    metric: string,
    value: number,
    source: string,
    description: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      const trial = this.trials.get(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      if (trial.status !== 'ACTIVE') {
        return false;
      }

      // Check if trial has expired
      if (new Date() > trial.endDate) {
        await this.expireTrial(trialId, 'SYSTEM');
        return false;
      }

      // Find the limit for this metric
      const limit = trial.limits.find(l => l.metric === metric);
      if (limit) {
        const newUsage = limit.currentUsage + value;

        // Check hard limit
        if (limit.hardLimit && newUsage > limit.limit) {
          await this.suspendTrial(trialId, 'USAGE_LIMIT_EXCEEDED', `Hard limit exceeded for ${metric}`);
          return false;
        }

        // Update current usage
        limit.currentUsage = newUsage;

        // Check thresholds
        const percentage = (newUsage / limit.limit) * 100;
        if (percentage >= limit.criticalThreshold) {
          await this.createUsageAlert(trialId, metric, 'CRITICAL', newUsage, limit.limit);
        } else if (percentage >= limit.warningThreshold) {
          await this.createUsageAlert(trialId, metric, 'WARNING', newUsage, limit.limit);
        }
      }

      // Record usage
      const usage: TrialUsage = {
        metric,
        value,
        timestamp: new Date(),
        source,
        description
      };
      trial.usage.push(usage);

      // Add activity
      const activity: TrialActivity = {
        id: this.generateActivityId(),
        type: 'FEATURE_USE',
        description: `${metric}: ${value} ${limit?.unit || ''}`,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        metadata: { metric, value }
      };
      trial.activities.push(activity);

      // Check conversion triggers
      await this.checkConversionTriggers(trialId);

      // Check for suspicious activity
      await this.checkSuspiciousActivity(trialId, activity);

      return true;
    } catch (error) {
      const trial = this.trials.get(trialId);
      await this.auditLog.logOperation({
        tenantId: trial?.tenantId || 'UNKNOWN',
        userId: 'SYSTEM',
        action: 'RECORD_TRIAL_USAGE_ERROR',
        details: {
          error: (error as Error).message,
          trialId,
          metric,
          value
        },
        ipAddress,
        userAgent,
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async checkConversionTriggers(trialId: string): Promise<void> {
    const trial = this.trials.get(trialId);
    if (!trial) return;

    for (const trigger of trial.conversionSettings.conversionTriggers) {
      let conditionMet = false;

      switch (trigger.type) {
        case 'USAGE_THRESHOLD':
          {
            const limit = trial.limits.find(l => l.metric === 'transactions');
            if (limit && limit.currentUsage >= trigger.value) {
              conditionMet = true;
            }
            break;
          }
        case 'TIME_BASED':
          {
            const daysRemaining = Math.ceil((trial.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            if (daysRemaining <= trigger.value) {
              conditionMet = true;
            }
            break;
          }
        // Add other trigger types as needed
      }

      if (conditionMet) {
        if (trigger.action === 'CONVERT' && trial.conversionSettings.autoConvert) {
          await this.convertTrial(trialId, trial.conversionSettings.conversionTier, 'SYSTEM');
        } else if (trigger.action === 'NOTIFY') {
          await this.sendConversionNotification(trialId, trigger);
        }
      }
    }
  }

  private async checkSuspiciousActivity(trialId: string, activity: TrialActivity): Promise<void> {
    const trial = this.trials.get(trialId);
    if (!trial) return;

    for (const threshold of trial.abusePrevention.suspiciousActivityThresholds) {
      const recentActivities = trial.activities.filter(a => 
        a.type === activity.type &&
        a.timestamp >= new Date(Date.now() - threshold.timeWindow * 60 * 60 * 1000)
      );

      if (recentActivities.length >= threshold.threshold) {
        if (threshold.action === 'SUSPEND') {
          await this.suspendTrial(trialId, 'SUSPICIOUS_ACTIVITY', `Suspicious activity detected: ${threshold.activity}`);
        } else if (threshold.action === 'TERMINATE') {
          await this.cancelTrial(trialId, 'SUSPICIOUS_ACTIVITY', `Suspicious activity detected: ${threshold.activity}`);
        }
        break;
      }
    }
  }

  private async createUsageAlert(
    trialId: string,
    metric: string,
    level: 'WARNING' | 'CRITICAL',
    currentUsage: number,
    limit: number
  ): Promise<void> {
    const trial = this.trials.get(trialId);
    if (!trial) return;

    const note: TrialNote = {
      id: this.generateNoteId(),
      content: `${level} usage alert for ${metric}: ${currentUsage}/${limit} (${((currentUsage/limit)*100).toFixed(1)}%)`,
      author: 'SYSTEM',
      createdAt: new Date(),
      category: 'SUPPORT',
      visibility: 'TEAM'
    };
    trial.notes.push(note);
  }

  private async sendConversionNotification(trialId: string, trigger: ConversionTrigger): Promise<void> {
    const trial = this.trials.get(trialId);
    if (!trial) return;

    const note: TrialNote = {
      id: this.generateNoteId(),
      content: `Conversion trigger met: ${trigger.condition}`,
      author: 'SYSTEM',
      createdAt: new Date(),
      category: 'CONVERSION',
      visibility: 'TEAM'
    };
    trial.notes.push(note);
  }

  public async convertTrial(
    trialId: string,
    targetTier: ProductTier,
    convertedBy: string
  ): Promise<void> {
    try {
      const trial = this.trials.get(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      if (trial.status !== 'ACTIVE') {
        throw new Error(`Trial ${trialId} is not active`);
      }

      // Convert trial
      trial.status = 'CONVERTED';
      trial.convertedAt = new Date();
      trial.convertedToTier = targetTier;
      trial.updatedAt = new Date();

      // Add conversion note
      const note: TrialNote = {
        id: this.generateNoteId(),
        content: `Trial converted to ${targetTier} tier`,
        author: convertedBy,
        createdAt: new Date(),
        category: 'CONVERSION',
        visibility: 'ALL'
      };
      trial.notes.push(note);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trialId,
        userId: convertedBy,
        action: 'CONVERT_TRIAL',
        details: {
          trialId,
          fromTier: trial.targetTier,
          toTier: targetTier,
          trialDuration: Math.ceil((Date.now() - trial.startDate.getTime()) / (24 * 60 * 60 * 1000))
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'INFO'
      });
    } catch (error) {
      const trial = this.trials.get(trialId);
      await this.auditLog.logOperation({
        tenantId: trial?.tenantId || 'UNKNOWN',
        userId: convertedBy,
        action: 'CONVERT_TRIAL_ERROR',
        details: {
          error: (error as Error).message,
          trialId,
          targetTier
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async expireTrial(trialId: string, expiredBy: string): Promise<void> {
    try {
      const trial = this.trials.get(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      if (trial.status === 'EXPIRED' || trial.status === 'CONVERTED') {
        return;
      }

      // Expire trial
      trial.status = 'EXPIRED';
      trial.updatedAt = new Date();

      // Add expiration note
      const note: TrialNote = {
        id: this.generateNoteId(),
        content: 'Trial expired',
        author: expiredBy,
        createdAt: new Date(),
        category: 'GENERAL',
        visibility: 'ALL'
      };
      trial.notes.push(note);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trialId,
        userId: expiredBy,
        action: 'EXPIRE_TRIAL',
        details: {
          trialId,
          trialDuration: trial.duration,
          actualDuration: Math.ceil((Date.now() - trial.startDate.getTime()) / (24 * 60 * 60 * 1000))
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'INFO'
      });
    } catch (error) {
      const trial = this.trials.get(trialId);
      await this.auditLog.logOperation({
        tenantId: trial?.tenantId || 'UNKNOWN',
        userId: expiredBy,
        action: 'EXPIRE_TRIAL_ERROR',
        details: {
          error: (error as Error).message,
          trialId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async suspendTrial(
    trialId: string,
    reason: string,
    description: string
  ): Promise<void> {
    try {
      const trial = this.trials.get(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      // Suspend trial
      trial.status = 'SUSPENDED';
      trial.suspensionReason = reason;
      trial.updatedAt = new Date();

      // Add suspension note
      const note: TrialNote = {
        id: this.generateNoteId(),
        content: `Trial suspended: ${description}`,
        author: 'SYSTEM',
        createdAt: new Date(),
        category: 'ABUSE',
        visibility: 'TEAM'
      };
      trial.notes.push(note);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trialId,
        userId: 'SYSTEM',
        action: 'SUSPEND_TRIAL',
        details: {
          trialId,
          reason,
          description
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'WARNING'
      });
    } catch (error) {
      const trial = this.trials.get(trialId);
      await this.auditLog.logOperation({
        tenantId: trial?.tenantId || 'UNKNOWN',
        userId: 'SYSTEM',
        action: 'SUSPEND_TRIAL_ERROR',
        details: {
          error: (error as Error).message,
          trialId,
          reason
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async cancelTrial(
    trialId: string,
    reason: string,
    description: string
  ): Promise<void> {
    try {
      const trial = this.trials.get(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      // Cancel trial
      trial.status = 'CANCELLED';
      trial.cancellationReason = reason;
      trial.updatedAt = new Date();

      // Add cancellation note
      const note: TrialNote = {
        id: this.generateNoteId(),
        content: `Trial cancelled: ${description}`,
        author: 'SYSTEM',
        createdAt: new Date(),
        category: 'GENERAL',
        visibility: 'ALL'
      };
      trial.notes.push(note);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trialId,
        userId: 'SYSTEM',
        action: 'CANCEL_TRIAL',
        details: {
          trialId,
          reason,
          description
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'WARNING'
      });
    } catch (error) {
      const trial = this.trials.get(trialId);
      await this.auditLog.logOperation({
        tenantId: trial?.tenantId || 'UNKNOWN',
        userId: 'SYSTEM',
        action: 'CANCEL_TRIAL_ERROR',
        details: {
          error: (error as Error).message,
          trialId,
          reason
        },
        ipAddress: 'SYSTEM',
        userAgent: 'TRIAL_MANAGER',
        timestamp: new Date(),
        category: 'TRIAL',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async getTrial(trialId: string): Promise<Trial | null> {
    return this.trials.get(trialId) || null;
  }

  public async getTrialsByStatus(status: Trial['status']): Promise<Trial[]> {
    return Array.from(this.trials.values()).filter(trial => trial.status === status);
  }

  public async getTrialMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<TrialMetrics> {
    const trials = Array.from(this.trials.values())
      .filter(trial => trial.createdAt >= startDate && trial.createdAt <= endDate);

    const activeTrials = trials.filter(t => t.status === 'ACTIVE');
    const expiredTrials = trials.filter(t => t.status === 'EXPIRED');
    const convertedTrials = trials.filter(t => t.status === 'CONVERTED');
    const cancelledTrials = trials.filter(t => t.status === 'CANCELLED');

    const conversionRate = trials.length > 0 ? (convertedTrials.length / trials.length) * 100 : 0;
    const averageTrialDuration = trials.length > 0 
      ? trials.reduce((sum, t) => sum + t.duration, 0) / trials.length 
      : 0;

    const trialToConversionTime = convertedTrials.length > 0
      ? convertedTrials.reduce((sum, t) => {
          const duration = t.convertedAt ? t.convertedAt.getTime() - t.startDate.getTime() : 0;
          return sum + duration;
        }, 0) / convertedTrials.length / (24 * 60 * 60 * 1000)
      : 0;

    const trialsByType: { [key: string]: number } = {};
    const trialsByIndustry: { [key: string]: number } = {};
    const trialsByCompanySize: { [key: string]: number } = {};

    trials.forEach(trial => {
      trialsByType[trial.trialType] = (trialsByType[trial.trialType] || 0) + 1;
      trialsByIndustry[trial.contactInfo.industry] = (trialsByIndustry[trial.contactInfo.industry] || 0) + 1;
      trialsByCompanySize[trial.contactInfo.companySize] = (trialsByCompanySize[trial.contactInfo.companySize] || 0) + 1;
    });

    return {
      totalTrials: trials.length,
      activeTrials: activeTrials.length,
      expiredTrials: expiredTrials.length,
      convertedTrials: convertedTrials.length,
      cancelledTrials: cancelledTrials.length,
      conversionRate,
      averageTrialDuration,
      trialToConversionTime,
      trialsByType,
      trialsByIndustry,
      trialsByCompanySize,
      topConversionFeatures: [], // Placeholder
      abandonmentReasons: [], // Placeholder
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  private generateTrialId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRIAL${timestamp}${random}`;
  }

  private generateTrialNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 99999) + 1;
    return `TRL-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private generateActivityId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ACT${timestamp}${random}`;
  }

  private generateNoteId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NOTE${timestamp}${random}`;
  }
}
