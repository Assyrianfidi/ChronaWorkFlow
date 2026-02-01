import { ProductTier } from './product-tiers';
import { UsageMeter } from './usage-meter';
import { BillingEngine } from './billing-engine';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';

export interface RetentionCampaign {
  id: string;
  name: string;
  description: string;
  type: 'PROACTIVE' | 'REACTIVE' | 'PREVENTIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  targetSegments: RetentionSegment[];
  triggers: RetentionTrigger[];
  actions: RetentionAction[];
  budget: RetentionBudget;
  timeline: RetentionTimeline;
  kpis: RetentionKPI[];
  owner: string;
  team: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface RetentionSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  size: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  churnProbability: number;
  ltv: number;
  status: 'TARGETED' | 'ACTIVE' | 'RESOLVED' | 'CHURNED';
}

export interface SegmentCriteria {
  tier: ProductTier[];
  usageLevel: string[];
  engagement: string[];
  paymentHistory: string[];
  supportHistory: string[];
  tenureRange: { min: number; max: number }; // in months
  lastLogin: { min: number; max: number }; // in days
  riskFactors: string[];
}

export interface RetentionTrigger {
  id: string;
  name: string;
  description: string;
  type: 'USAGE_DECLINE' | 'PAYMENT_ISSUE' | 'SUPPORT_TICKET' | 'COMPETITOR_THREAT' | 'FEATURE_REQUEST' | 'PRICING_FEEDBACK';
  condition: TriggerCondition;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  timeframe: 'IMMEDIATE' | 'URGENT' | 'SHORT_TERM' | 'MEDIUM_TERM';
  isActive: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'BETWEEN' | 'CONTAINS';
  value: any;
  timeWindow?: number; // in days
}

export interface RetentionAction {
  id: string;
  name: string;
  description: string;
  type: 'EMAIL' | 'CALL' | 'OFFER' | 'FEATURE_GRANT' | 'TRAINING' | 'SUPPORT' | 'SURVEY';
  priority: number;
  delay: number; // in hours
  conditions: string[];
  template?: string;
  parameters: { [key: string]: any };
  owner: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'COMPLETED' | 'FAILED';
  results: ActionResult[];
}

export interface ActionResult {
  metric: string;
  value: any;
  timestamp: Date;
  success: boolean;
}

export interface RetentionBudget {
  total: number;
  allocated: number;
  spent: number;
  remaining: number;
  currency: string;
  categories: BudgetCategory[];
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  description: string;
}

export interface RetentionTimeline {
  startDate: Date;
  endDate: Date;
  phases: TimelinePhase[];
  milestones: TimelineMilestone[];
}

export interface TimelinePhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'DELAYED';
  deliverables: string[];
}

export interface TimelineMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'PENDING' | 'ACHIEVED' | 'MISSED';
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RetentionKPI {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'ACHIEVED';
}

export interface ChurnRisk {
  id: string;
  tenantId: string;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  signals: RiskSignal[];
  predictedChurnDate?: Date;
  confidence: number;
  recommendedActions: string[];
  createdAt: Date;
  updatedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  status: 'ACTIVE' | 'ADDRESSED' | 'CHURNED' | 'FALSE_POSITIVE';
}

export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
  threshold: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface RiskSignal {
  type: 'USAGE_DECLINE' | 'LOGIN_INACTIVITY' | 'SUPPORT_VOLUME' | 'PAYMENT_LATE' | 'FEATURE_ABANDONMENT' | 'COMPETITOR_ACTIVITY';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  value: number;
  threshold: number;
}

export interface RetentionMetrics {
  totalCustomers: number;
  churnRate: number;
  retentionRate: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
  customerLifetimeValue: number;
  averageTenure: number;
  riskDistribution: { [key: string]: number };
  campaignEffectiveness: { [key: string]: number };
  interventionSuccess: number;
  earlyWarningAccuracy: number;
  revenueAtRisk: number;
  savedRevenue: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface RetentionIntervention {
  id: string;
  tenantId: string;
  campaignId: string;
  type: RetentionAction['type'];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  scheduledAt: Date;
  completedAt?: Date;
  assignedTo: string;
  actions: InterventionAction[];
  results: InterventionResult[];
  outcome: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'UNKNOWN';
  revenueImpact: number;
  cost: number;
  roi: number;
}

export interface InterventionAction {
  id: string;
  type: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  scheduledAt: Date;
  completedAt?: Date;
  assignee: string;
  result?: string;
  metadata?: { [key: string]: any };
}

export interface InterventionResult {
  metric: string;
  value: any;
  baseline: any;
  change: number;
  significance: boolean;
  timestamp: Date;
}

export class RetentionAutomationEngine {
  private static instance: RetentionAutomationEngine;
  private auditLog: ImmutableAuditLogger;
  private usageMeter: UsageMeter;
  private billingEngine: BillingEngine;
  private campaigns: Map<string, RetentionCampaign> = new Map();
  private risks: Map<string, ChurnRisk> = new Map();
  private interventions: Map<string, RetentionIntervention> = new Map();
  private triggers: Map<string, RetentionTrigger> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.usageMeter = UsageMeter.getInstance();
    this.billingEngine = BillingEngine.getInstance();
    this.initializeDefaultCampaigns();
    this.initializeDefaultTriggers();
  }

  public static getInstance(): RetentionAutomationEngine {
    if (!RetentionAutomationEngine.instance) {
      RetentionAutomationEngine.instance = new RetentionAutomationEngine();
    }
    return RetentionAutomationEngine.instance;
  }

  private initializeDefaultCampaigns(): void {
    const campaigns: RetentionCampaign[] = [
      {
        id: 'HIGH_RISK_INTERVENTION',
        name: 'High Risk Customer Intervention',
        description: 'Proactive outreach to customers at high risk of churn',
        type: 'PROACTIVE',
        priority: 'HIGH',
        status: 'ACTIVE',
        targetSegments: [
          {
            id: 'high_risk_customers',
            name: 'High Risk Customers',
            description: 'Customers with churn probability > 70%',
            criteria: {
              tier: ['STARTER', 'PRO'],
              usageLevel: ['LOW', 'DECLINING'],
              engagement: ['LOW'],
              paymentHistory: ['LATE', 'MISSED'],
              supportHistory: ['HIGH_VOLUME'],
              tenureRange: { min: 3, max: 24 },
              lastLogin: { min: 7, max: 30 },
              riskFactors: ['usage_decline', 'payment_issues', 'support_tickets']
            },
            size: 150,
            riskLevel: 'HIGH',
            churnProbability: 75,
            ltv: 8500,
            status: 'TARGETED'
          }
        ],
        triggers: [
          {
            id: 'usage_decline_trigger',
            name: 'Usage Decline Trigger',
            description: 'Detect significant decline in usage',
            type: 'USAGE_DECLINE',
            condition: {
              field: 'usage_change_percentage',
              operator: 'LESS_THAN',
              value: -30,
              timeWindow: 14
            },
            severity: 'HIGH',
            confidence: 0.8,
            timeframe: 'URGENT',
            isActive: true
          },
          {
            id: 'payment_issue_trigger',
            name: 'Payment Issue Trigger',
            description: 'Detect payment failures or delays',
            type: 'PAYMENT_ISSUE',
            condition: {
              field: 'payment_status',
              operator: 'CONTAINS',
              value: 'FAILED|LATE',
              timeWindow: 7
            },
            severity: 'CRITICAL',
            confidence: 0.9,
            timeframe: 'IMMEDIATE',
            isActive: true
          }
        ],
        actions: [
          {
            id: 'high_risk_email',
            name: 'High Risk Email Outreach',
            description: 'Personalized email to high risk customers',
            type: 'EMAIL',
            priority: 1,
            delay: 2,
            conditions: ['risk_score > 70'],
            template: 'high_risk_retention_template',
            parameters: {
              subject: 'We want to help you succeed',
              personalization: 'HIGH',
              offer_type: 'SUPPORT'
            },
            owner: 'RETENTION_TEAM',
            status: 'PENDING',
            results: []
          },
          {
            id: 'account_manager_call',
            name: 'Account Manager Call',
            description: 'Personal call from account manager',
            type: 'CALL',
            priority: 2,
            delay: 24,
            conditions: ['risk_score > 80'],
            parameters: {
              script: 'high_risk_call_script',
              objective: 'IDENTIFY_ISSUES_AND_SOLUTIONS'
            },
            owner: 'ACCOUNT_MANAGER',
            status: 'PENDING',
            results: []
          },
          {
            id: 'retention_offer',
            name: 'Retention Offer',
            description: 'Special offer to prevent churn',
            type: 'OFFER',
            priority: 3,
            delay: 48,
            conditions: ['risk_score > 75'],
            parameters: {
              discount_percentage: 20,
              duration_months: 3,
              type: 'TEMPORARY_DISCOUNT'
            },
            owner: 'SALES_TEAM',
            status: 'PENDING',
            results: []
          }
        ],
        budget: {
          total: 50000,
          allocated: 35000,
          spent: 12000,
          remaining: 23000,
          currency: 'USD',
          categories: [
            {
              name: 'Personnel',
              allocated: 25000,
              spent: 8000,
              remaining: 17000,
              description: 'Account manager and support time'
            },
            {
              name: 'Offers',
              allocated: 10000,
              spent: 4000,
              remaining: 6000,
              description: 'Discounts and special offers'
            }
          ],
          period: 'QUARTERLY'
        },
        timeline: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          phases: [
            {
              id: 'identification_phase',
              name: 'Risk Identification',
              description: 'Identify high risk customers',
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              status: 'COMPLETED',
              deliverables: ['Risk assessment report', 'Customer list']
            },
            {
              id: 'intervention_phase',
              name: 'Customer Intervention',
              description: 'Execute retention actions',
              startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              status: 'ACTIVE',
              deliverables: ['Customer contacts', 'Offers sent', 'Follow-ups completed']
            }
          ],
          milestones: [
            {
              id: 'first_contact_milestone',
              name: 'First Contact Complete',
              description: 'Initial contact with all high risk customers',
              dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              status: 'ACHIEVED',
              importance: 'HIGH'
            },
            {
              id: 'retention_target_milestone',
              name: 'Retention Target Achieved',
              description: 'Achieve 80% retention rate for target segment',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
              importance: 'CRITICAL'
            }
          ]
        },
        kpis: [
          {
            id: 'retention_rate',
            name: 'Target Segment Retention Rate',
            description: 'Retention rate for high risk customers',
            target: 80,
            current: 72,
            unit: '%',
            frequency: 'WEEKLY',
            trend: 'IMPROVING',
            status: 'ON_TRACK'
          },
          {
            id: 'intervention_success',
            name: 'Intervention Success Rate',
            description: 'Percentage of successful interventions',
            target: 70,
            current: 65,
            unit: '%',
            frequency: 'WEEKLY',
            trend: 'STABLE',
            status: 'ON_TRACK'
          }
        ],
        owner: 'RETENTION_MANAGER',
        team: ['RETENTION_TEAM', 'ACCOUNT_MANAGERS', 'SUPPORT_TEAM', 'SALES_TEAM'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ];

    campaigns.forEach(campaign => {
      this.campaigns.set(campaign.id, campaign);
    });
  }

  private initializeDefaultTriggers(): void {
    const triggers: RetentionTrigger[] = [
      {
        id: 'usage_decline_trigger',
        name: 'Usage Decline Trigger',
        description: 'Detect significant decline in customer usage',
        type: 'USAGE_DECLINE',
        condition: {
          field: 'usage_change_percentage',
          operator: 'LESS_THAN',
          value: -25,
          timeWindow: 14
        },
        severity: 'HIGH',
        confidence: 0.8,
        timeframe: 'URGENT',
        isActive: true
      },
      {
        id: 'login_inactivity_trigger',
        name: 'Login Inactivity Trigger',
        description: 'Detect extended period of no login activity',
        type: 'USAGE_DECLINE',
        condition: {
          field: 'days_since_last_login',
          operator: 'GREATER_THAN',
          value: 14,
          timeWindow: 1
        },
        severity: 'MEDIUM',
        confidence: 0.7,
        timeframe: 'SHORT_TERM',
        isActive: true
      },
      {
        id: 'support_volume_trigger',
        name: 'Support Volume Trigger',
        description: 'Detect unusual increase in support tickets',
        type: 'SUPPORT_TICKET',
        condition: {
          field: 'support_tickets_last_30_days',
          operator: 'GREATER_THAN',
          value: 5,
          timeWindow: 30
        },
        severity: 'MEDIUM',
        confidence: 0.6,
        timeframe: 'SHORT_TERM',
        isActive: true
      },
      {
        id: 'payment_late_trigger',
        name: 'Payment Late Trigger',
        description: 'Detect late or failed payments',
        type: 'PAYMENT_ISSUE',
        condition: {
          field: 'payment_days_overdue',
          operator: 'GREATER_THAN',
          value: 7,
          timeWindow: 1
        },
        severity: 'HIGH',
        confidence: 0.9,
        timeframe: 'IMMEDIATE',
        isActive: true
      },
      {
        id: 'feature_abandonment_trigger',
        name: 'Feature Abandonment Trigger',
        description: 'Detect abandonment of previously used features',
        type: 'FEATURE_REQUEST',
        condition: {
          field: 'feature_usage_decline',
          operator: 'GREATER_THAN',
          value: 50,
          timeWindow: 30
        },
        severity: 'MEDIUM',
        confidence: 0.5,
        timeframe: 'MEDIUM_TERM',
        isActive: true
      }
    ];

    triggers.forEach(trigger => {
      this.triggers.set(trigger.id, trigger);
    });
  }

  public async analyzeChurnRisk(tenantId: string): Promise<ChurnRisk> {
    try {
      // Get tenant data
      const usageMetrics = await this.usageMeter.getAllUsageMetrics(tenantId);
      const billingData = await this.billingEngine.getAccount(tenantId);
      
      // Analyze risk factors
      const factors = await this.calculateRiskFactors(tenantId, usageMetrics, billingData);
      
      // Detect risk signals
      const signals = await this.detectRiskSignals(tenantId, usageMetrics, billingData);
      
      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(factors, signals);
      const riskLevel = this.getRiskLevel(riskScore);
      
      // Predict churn date if high risk
      const predictedChurnDate = riskScore > 70 ? this.predictChurnDate(riskScore) : undefined;
      
      // Generate recommendations
      const recommendedActions = this.generateRecommendations(factors, signals, riskLevel);
      
      const churnRisk: ChurnRisk = {
        id: this.generateRiskId(),
        tenantId,
        riskScore,
        riskLevel,
        factors,
        signals,
        predictedChurnDate,
        confidence: this.calculateConfidence(factors, signals),
        recommendedActions,
        createdAt: new Date(),
        updatedAt: new Date(),
        acknowledged: false,
        status: 'ACTIVE'
      };

      this.risks.set(churnRisk.id, churnRisk);

      // Trigger retention actions if needed
      if (riskScore > 60) {
        await this.triggerRetentionActions(tenantId, churnRisk);
      }

      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'ANALYZE_CHURN_RISK',
        details: {
          tenantId,
          riskScore,
          riskLevel,
          factorsCount: factors.length,
          signalsCount: signals.length
        },
        ipAddress: 'SYSTEM',
        userAgent: 'RETENTION_ENGINE',
        timestamp: new Date(),
        category: 'RETENTION',
        severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : riskLevel === 'HIGH' ? 'WARNING' : 'INFO'
      });

      return churnRisk;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'ANALYZE_CHURN_RISK_ERROR',
        details: {
          error: (error as Error).message,
          tenantId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'RETENTION_ENGINE',
        timestamp: new Date(),
        category: 'RETENTION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async calculateRiskFactors(
    tenantId: string,
    usageMetrics: any[],
    billingData: any
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Usage decline factor
    const usageFactor: RiskFactor = {
      name: 'Usage Decline',
      value: await this.calculateUsageDecline(tenantId),
      weight: 0.3,
      description: 'Percentage decline in usage over last 30 days',
      threshold: 25,
      impact: 'HIGH',
      status: 'NORMAL'
    };
    factors.push(usageFactor);

    // Login frequency factor
    const loginFactor: RiskFactor = {
      name: 'Login Frequency',
      value: await this.calculateLoginFrequency(tenantId),
      weight: 0.2,
      description: 'Days since last login',
      threshold: 14,
      impact: 'MEDIUM',
      status: 'NORMAL'
    };
    factors.push(loginFactor);

    // Support tickets factor
    const supportFactor: RiskFactor = {
      name: 'Support Volume',
      value: await this.calculateSupportVolume(tenantId),
      weight: 0.15,
      description: 'Number of support tickets in last 30 days',
      threshold: 5,
      impact: 'MEDIUM',
      status: 'NORMAL'
    };
    factors.push(supportFactor);

    // Payment history factor
    const paymentFactor: RiskFactor = {
      name: 'Payment History',
      value: await this.calculatePaymentRisk(billingData),
      weight: 0.25,
      description: 'Payment risk score based on history',
      threshold: 30,
      impact: 'HIGH',
      status: 'NORMAL'
    };
    factors.push(paymentFactor);

    // Feature adoption factor
    const featureFactor: RiskFactor = {
      name: 'Feature Adoption',
      value: await this.calculateFeatureAdoption(tenantId),
      weight: 0.1,
      description: 'Percentage of core features actively used',
      threshold: 40,
      impact: 'LOW',
      status: 'NORMAL'
    };
    factors.push(featureFactor);

    // Update factor statuses
    factors.forEach(factor => {
      if (factor.value >= factor.threshold * 1.5) {
        factor.status = 'CRITICAL';
      } else if (factor.value >= factor.threshold) {
        factor.status = 'WARNING';
      }
    });

    return factors;
  }

  private async detectRiskSignals(
    tenantId: string,
    usageMetrics: any[],
    billingData: any
  ): Promise<RiskSignal[]> {
    const signals: RiskSignal[] = [];

    // Check all active triggers
    for (const trigger of this.triggers.values()) {
      if (!trigger.isActive) continue;

      const isTriggered = await this.evaluateTrigger(trigger, tenantId, usageMetrics, billingData);
      
      if (isTriggered) {
        const signal: RiskSignal = {
          type: trigger.type,
          description: trigger.description,
          severity: trigger.severity,
          timestamp: new Date(),
          value: await this.getTriggerValue(trigger, tenantId),
          threshold: trigger.condition.value
        };
        signals.push(signal);
      }
    }

    return signals;
  }

  private async evaluateTrigger(
    trigger: RetentionTrigger,
    tenantId: string,
    usageMetrics: any[],
    billingData: any
  ): Promise<boolean> {
    const value = await this.getTriggerValue(trigger, tenantId);
    
    switch (trigger.condition.operator) {
      case 'GREATER_THAN':
        return value > trigger.condition.value;
      case 'LESS_THAN':
        return value < trigger.condition.value;
      case 'EQUALS':
        return value === trigger.condition.value;
      case 'BETWEEN':
        {
          const [min, max] = trigger.condition.value;
          return value >= min && value <= max;
        }
      case 'CONTAINS':
        return String(value).includes(String(trigger.condition.value));
      default:
        return false;
    }
  }

  private async getTriggerValue(trigger: RetentionTrigger, tenantId: string): Promise<any> {
    switch (trigger.condition.field) {
      case 'usage_change_percentage':
        return await this.calculateUsageDecline(tenantId);
      case 'days_since_last_login':
        return await this.calculateLoginFrequency(tenantId);
      case 'support_tickets_last_30_days':
        return await this.calculateSupportVolume(tenantId);
      case 'payment_days_overdue':
        return await this.calculatePaymentDaysOverdue(tenantId);
      case 'feature_usage_decline':
        return await this.calculateFeatureUsageDecline(tenantId);
      default:
        return 0;
    }
  }

  private calculateRiskScore(factors: RiskFactor[], signals: RiskSignal[]): number {
    let factorScore = 0;
    let signalScore = 0;

    // Calculate factor contribution
    factors.forEach(factor => {
      const normalizedValue = Math.min(factor.value / factor.threshold, 2);
      factorScore += normalizedValue * factor.weight;
    });

    // Calculate signal contribution
    signals.forEach(signal => {
      const signalWeight = {
        'LOW': 0.1,
        'MEDIUM': 0.2,
        'HIGH': 0.3,
        'CRITICAL': 0.4
      }[signal.severity];
      signalScore += signalWeight;
    });

    // Combine scores
    const totalScore = (factorScore * 0.7) + (signalScore * 0.3);
    return Math.min(totalScore * 100, 100);
  }

  private getRiskLevel(score: number): ChurnRisk['riskLevel'] {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private predictChurnDate(riskScore: number): Date {
    // Simple prediction based on risk score
    const daysToChurn = Math.max(7, 90 - (riskScore * 0.8));
    return new Date(Date.now() + daysToChurn * 24 * 60 * 60 * 1000);
  }

  private calculateConfidence(factors: RiskFactor[], signals: RiskSignal[]): number {
    // Confidence based on data quality and signal strength
    const factorConfidence = factors.length > 0 ? 0.8 : 0.5;
    const signalConfidence = signals.length > 0 ? 0.9 : 0.6;
    return (factorConfidence + signalConfidence) / 2;
  }

  private generateRecommendations(
    factors: RiskFactor[],
    signals: RiskSignal[],
    riskLevel: ChurnRisk['riskLevel']
  ): string[] {
    const recommendations: string[] = [];

    // Usage-related recommendations
    const usageFactor = factors.find(f => f.name === 'Usage Decline');
    if (usageFactor && usageFactor.status !== 'NORMAL') {
      recommendations.push('Schedule usage review call to understand declining usage');
      recommendations.push('Offer training on underutilized features');
    }

    // Payment-related recommendations
    const paymentFactor = factors.find(f => f.name === 'Payment History');
    if (paymentFactor && paymentFactor.status !== 'NORMAL') {
      recommendations.push('Contact customer about payment issues');
      recommendations.push('Offer flexible payment options');
    }

    // Support-related recommendations
    const supportFactor = factors.find(f => f.name === 'Support Volume');
    if (supportFactor && supportFactor.status !== 'NORMAL') {
      recommendations.push('Review support tickets for underlying issues');
      recommendations.push('Assign dedicated support representative');
    }

    // Risk level specific recommendations
    if (riskLevel === 'CRITICAL') {
      recommendations.push('Immediate executive outreach');
      recommendations.push('Offer significant retention incentive');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Account manager outreach within 24 hours');
      recommendations.push('Schedule success planning session');
    }

    return recommendations;
  }

  private async triggerRetentionActions(tenantId: string, churnRisk: ChurnRisk): Promise<void> {
    // Find applicable campaigns
    const applicableCampaigns = Array.from(this.campaigns.values())
      .filter(campaign => campaign.status === 'ACTIVE');

    for (const campaign of applicableCampaigns) {
      // Check if tenant matches campaign criteria
      const matches = await this.evaluateCampaignCriteria(campaign, tenantId, churnRisk);
      
      if (matches) {
        await this.executeCampaignActions(campaign, tenantId, churnRisk);
      }
    }
  }

  private async evaluateCampaignCriteria(
    campaign: RetentionCampaign,
    tenantId: string,
    churnRisk: ChurnRisk
  ): Promise<boolean> {
    // Simplified criteria evaluation
    // In production, this would be more sophisticated
    return campaign.targetSegments.some(segment => 
      segment.riskLevel === churnRisk.riskLevel
    );
  }

  private async executeCampaignActions(
    campaign: RetentionCampaign,
    tenantId: string,
    churnRisk: ChurnRisk
  ): Promise<void> {
    for (const action of campaign.actions) {
      if (action.status !== 'PENDING') continue;

      // Check action conditions
      const conditionsMet = await this.evaluateActionConditions(action, churnRisk);
      
      if (conditionsMet) {
        await this.executeRetentionAction(action, tenantId, churnRisk);
      }
    }
  }

  private async evaluateActionConditions(
    action: RetentionAction,
    churnRisk: ChurnRisk
  ): Promise<boolean> {
    // Simplified condition evaluation
    // In production, this would support complex condition logic
    return true;
  }

  private async executeRetentionAction(
    action: RetentionAction,
    tenantId: string,
    churnRisk: ChurnRisk
  ): Promise<void> {
    const interventionId = this.generateInterventionId();

    const intervention: RetentionIntervention = {
      id: interventionId,
      tenantId,
      campaignId: 'HIGH_RISK_INTERVENTION', // Simplified
      type: action.type,
      priority: 'HIGH',
      status: 'PENDING',
      scheduledAt: new Date(Date.now() + action.delay * 60 * 60 * 1000),
      assignedTo: action.owner,
      actions: [],
      results: [],
      outcome: 'UNKNOWN',
      revenueImpact: 0,
      cost: 0,
      roi: 0
    };

    this.interventions.set(interventionId, intervention);

    // Update action status
    action.status = 'SENT';

    await this.auditLog.logOperation({
      tenantId,
      userId: 'SYSTEM',
      action: 'EXECUTE_RETENTION_ACTION',
      details: {
        interventionId,
        actionType: action.type,
        actionName: action.name,
        riskScore: churnRisk.riskScore
      },
      ipAddress: 'SYSTEM',
      userAgent: 'RETENTION_ENGINE',
      timestamp: new Date(),
      category: 'RETENTION',
      severity: 'INFO'
    });
  }

  // Helper methods (simplified implementations)
  private async calculateUsageDecline(tenantId: string): Promise<number> {
    return Math.floor(Math.random() * 50); // Placeholder
  }

  private async calculateLoginFrequency(tenantId: string): Promise<number> {
    return Math.floor(Math.random() * 30); // Placeholder
  }

  private async calculateSupportVolume(tenantId: string): Promise<number> {
    return Math.floor(Math.random() * 10); // Placeholder
  }

  private async calculatePaymentRisk(billingData: any): Promise<number> {
    return Math.floor(Math.random() * 40); // Placeholder
  }

  private async calculateFeatureAdoption(tenantId: string): Promise<number> {
    return Math.floor(Math.random() * 60); // Placeholder
  }

  private async calculatePaymentDaysOverdue(tenantId: string): Promise<number> {
    return Math.floor(Math.random() * 15); // Placeholder
  }

  private async calculateFeatureUsageDecline(tenantId: string): Promise<number> {
    return Math.floor(Math.random() * 70); // Placeholder
  }

  public async getRetentionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<RetentionMetrics> {
    try {
      const metrics: RetentionMetrics = {
        totalCustomers: 0, // Would calculate from customer data
        churnRate: 0, // Would calculate from churn data
        retentionRate: 0, // Would calculate from retention data
        netRevenueRetention: 0, // Would calculate from billing data
        grossRevenueRetention: 0, // Would calculate from billing data
        customerLifetimeValue: 0, // Would calculate from customer data
        averageTenure: 0, // Would calculate from customer data
        riskDistribution: {}, // Would calculate from risk data
        campaignEffectiveness: {}, // Would calculate from campaign data
        interventionSuccess: 0, // Would calculate from intervention data
        earlyWarningAccuracy: 0, // Would calculate from prediction accuracy
        revenueAtRisk: 0, // Would calculate from risk data
        savedRevenue: 0, // Would calculate from intervention results
        periodStart: startDate,
        periodEnd: endDate
      };

      return metrics;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId: 'SYSTEM',
        userId: 'SYSTEM',
        action: 'GET_RETENTION_METRICS_ERROR',
        details: {
          error: (error as Error).message,
          startDate,
          endDate
        },
        ipAddress: 'SYSTEM',
        userAgent: 'RETENTION_ENGINE',
        timestamp: new Date(),
        category: 'RETENTION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async getChurnRisk(tenantId: string): Promise<ChurnRisk | null> {
    return Array.from(this.risks.values()).find(risk => risk.tenantId === tenantId) || null;
  }

  public async getInterventions(tenantId?: string): Promise<RetentionIntervention[]> {
    const interventions = Array.from(this.interventions.values());
    return tenantId ? interventions.filter(i => i.tenantId === tenantId) : interventions;
  }

  private generateRiskId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RISK${timestamp}${random}`;
  }

  private generateInterventionId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INT${timestamp}${random}`;
  }
}
