import { ProductTier } from './product-tiers';
import { UsageMeter } from './usage-meter';
import { BillingEngine } from './billing-engine';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';

export interface ExpansionSignal {
  id: string;
  tenantId: string;
  signalType: 'USAGE_SPIKE' | 'FEATURE_ADOPTION' | 'TEAM_GROWTH' | 'COMPLIANCE_NEED' | 'INTEGRATION_DEMAND' | 'PERFORMANCE_LIMIT' | 'COMPETITIVE_PRESSURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  description: string;
  currentValue: number;
  threshold: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  recommendedAction: string;
  potentialRevenue: number;
  probability: number;
  currentTier: ProductTier;
  recommendedTier: ProductTier;
  features: string[];
  metrics: SignalMetric[];
  createdAt: Date;
  updatedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  status: 'ACTIVE' | 'ADDRESSED' | 'DECLINED' | 'EXPIRED';
}

export interface SignalMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  currentPercentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  historical: HistoricalData[];
}

export interface HistoricalData {
  date: Date;
  value: number;
  event?: string;
}

export interface ExpansionPattern {
  id: string;
  name: string;
  description: string;
  signalTypes: ExpansionSignal['signalType'][];
  conditions: PatternCondition[];
  confidence: number;
  accuracy: number;
  occurrences: number;
  successRate: number;
  averageRevenue: number;
  timeToConversion: number;
  isActive: boolean;
  lastMatched?: Date;
}

export interface PatternCondition {
  signalType: ExpansionSignal['signalType'];
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'BETWEEN';
  value: number;
  weight: number;
}

export interface ExpansionOpportunity {
  id: string;
  tenantId: string;
  opportunityType: 'TIER_UPGRADE' | 'FEATURE_ADD_ON' | 'USAGE_INCREASE' | 'CONTRACT_EXTENSION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  revenuePotential: number;
  probability: number;
  timeToClose: number;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: ExpansionSignal[];
  recommendedActions: RecommendedAction[];
  status: 'IDENTIFIED' | 'QUALIFIED' | 'ENGAGED' | 'CONVERTED' | 'LOST';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export interface RecommendedAction {
  type: 'CONTACT' | 'DEMO' | 'OFFER' | 'TRAINING' | 'SUPPORT' | 'UPGRADE';
  description: string;
  priority: number;
  timeframe: number; // days
  owner: string;
  template?: string;
  materials?: string[];
}

export interface ExpansionMetrics {
  totalSignals: number;
  signalsByType: { [key: string]: number };
  signalsBySeverity: { [key: string]: number };
  signalsByTier: { [key: string]: number };
  conversionRate: number;
  averageRevenuePerSignal: number;
  timeToConversion: number;
  topSignals: { signal: string; count: number; revenue: number }[];
  opportunityPipeline: {
    identified: number;
    qualified: number;
    engaged: number;
    converted: number;
    totalValue: number;
  };
  periodStart: Date;
  periodEnd: Date;
}

export class ExpansionSignalEngine {
  private static instance: ExpansionSignalEngine;
  private auditLog: ImmutableAuditLogger;
  private usageMeter: UsageMeter;
  private billingEngine: BillingEngine;
  private signals: Map<string, ExpansionSignal> = new Map();
  private patterns: Map<string, ExpansionPattern> = new Map();
  private opportunities: Map<string, ExpansionOpportunity> = new Map();
  private thresholds: Map<string, SignalThreshold> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.usageMeter = UsageMeter.getInstance();
    this.billingEngine = BillingEngine.getInstance();
    this.initializeDefaultPatterns();
    this.initializeDefaultThresholds();
  }

  public static getInstance(): ExpansionSignalEngine {
    if (!ExpansionSignalEngine.instance) {
      ExpansionSignalEngine.instance = new ExpansionSignalEngine();
    }
    return ExpansionSignalEngine.instance;
  }

  private initializeDefaultPatterns(): void {
    const patterns: ExpansionPattern[] = [
      {
        id: 'HIGH_USAGE_PATTERN',
        name: 'High Usage Pattern',
        description: 'Customer approaching usage limits indicates upgrade need',
        signalTypes: ['USAGE_SPIKE', 'PERFORMANCE_LIMIT'],
        conditions: [
          { signalType: 'USAGE_SPIKE', operator: 'GREATER_THAN', value: 80, weight: 0.7 },
          { signalType: 'PERFORMANCE_LIMIT', operator: 'GREATER_THAN', value: 1, weight: 0.3 }
        ],
        confidence: 0.85,
        accuracy: 0.78,
        occurrences: 245,
        successRate: 0.72,
        averageRevenue: 12000,
        timeToConversion: 14,
        isActive: true
      },
      {
        id: 'TEAM_GROWTH_PATTERN',
        name: 'Team Growth Pattern',
        description: 'Increasing user count indicates tier upgrade need',
        signalTypes: ['TEAM_GROWTH'],
        conditions: [
          { signalType: 'TEAM_GROWTH', operator: 'GREATER_THAN', value: 3, weight: 1.0 }
        ],
        confidence: 0.92,
        accuracy: 0.85,
        occurrences: 189,
        successRate: 0.81,
        averageRevenue: 8500,
        timeToConversion: 21,
        isActive: true
      },
      {
        id: 'FEATURE_ADOPTION_PATTERN',
        name: 'Advanced Feature Adoption Pattern',
        description: 'Customer using advanced features may need higher tier',
        signalTypes: ['FEATURE_ADOPTION'],
        conditions: [
          { signalType: 'FEATURE_ADOPTION', operator: 'GREATER_THAN', value: 5, weight: 1.0 }
        ],
        confidence: 0.78,
        accuracy: 0.71,
        occurrences: 156,
        successRate: 0.68,
        averageRevenue: 15000,
        timeToConversion: 18,
        isActive: true
      },
      {
        id: 'COMPLIANCE_PATTERN',
        name: 'Compliance Need Pattern',
        description: 'Compliance requirements indicate enterprise tier need',
        signalTypes: ['COMPLIANCE_NEED'],
        conditions: [
          { signalType: 'COMPLIANCE_NEED', operator: 'GREATER_THAN', value: 0, weight: 1.0 }
        ],
        confidence: 0.95,
        accuracy: 0.89,
        occurrences: 87,
        successRate: 0.84,
        averageRevenue: 25000,
        timeToConversion: 30,
        isActive: true
      }
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  private initializeDefaultThresholds(): void {
    const thresholds: SignalThreshold[] = [
      {
        signalType: 'USAGE_SPIKE',
        tier: 'FREE',
        metric: 'transactions',
        threshold: 40, // 80% of 50
        severity: 'HIGH',
        timeframe: 'IMMEDIATE',
        recommendedTier: 'STARTER'
      },
      {
        signalType: 'USAGE_SPIKE',
        tier: 'STARTER',
        metric: 'transactions',
        threshold: 400, // 80% of 500
        severity: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        recommendedTier: 'PRO'
      },
      {
        signalType: 'USAGE_SPIKE',
        tier: 'PRO',
        metric: 'transactions',
        threshold: 4000, // 80% of 5000
        severity: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        recommendedTier: 'ENTERPRISE'
      },
      {
        signalType: 'TEAM_GROWTH',
        tier: 'FREE',
        metric: 'users',
        threshold: 1, // 100% of 1
        severity: 'HIGH',
        timeframe: 'IMMEDIATE',
        recommendedTier: 'STARTER'
      },
      {
        signalType: 'TEAM_GROWTH',
        tier: 'STARTER',
        metric: 'users',
        threshold: 2, // 67% of 3
        severity: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        recommendedTier: 'PRO'
      },
      {
        signalType: 'TEAM_GROWTH',
        tier: 'PRO',
        metric: 'users',
        threshold: 8, // 80% of 10
        severity: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        recommendedTier: 'ENTERPRISE'
      },
      {
        signalType: 'FEATURE_ADOPTION',
        tier: 'STARTER',
        metric: 'advanced_features',
        threshold: 2,
        severity: 'MEDIUM',
        timeframe: 'MEDIUM_TERM',
        recommendedTier: 'PRO'
      },
      {
        signalType: 'FEATURE_ADOPTION',
        tier: 'PRO',
        metric: 'enterprise_features',
        threshold: 1,
        severity: 'HIGH',
        timeframe: 'SHORT_TERM',
        recommendedTier: 'ENTERPRISE'
      },
      {
        signalType: 'COMPLIANCE_NEED',
        tier: 'STARTER',
        metric: 'compliance_requests',
        threshold: 1,
        severity: 'HIGH',
        timeframe: 'IMMEDIATE',
        recommendedTier: 'PRO'
      },
      {
        signalType: 'COMPLIANCE_NEED',
        tier: 'PRO',
        metric: 'enterprise_compliance',
        threshold: 1,
        severity: 'CRITICAL',
        timeframe: 'IMMEDIATE',
        recommendedTier: 'ENTERPRISE'
      }
    ];

    thresholds.forEach(threshold => {
      const key = `${threshold.signalType}_${threshold.tier}_${threshold.metric}`;
      this.thresholds.set(key, threshold);
    });
  }

  public async analyzeTenantForExpansionSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    try {
      const signals: ExpansionSignal[] = [];

      // Analyze usage patterns
      const usageSignals = await this.analyzeUsageSignals(tenantId, currentTier);
      signals.push(...usageSignals);

      // Analyze feature adoption
      const featureSignals = await this.analyzeFeatureSignals(tenantId, currentTier);
      signals.push(...featureSignals);

      // Analyze team growth
      const teamSignals = await this.analyzeTeamSignals(tenantId, currentTier);
      signals.push(...teamSignals);

      // Analyze compliance needs
      const complianceSignals = await this.analyzeComplianceSignals(tenantId, currentTier);
      signals.push(...complianceSignals);

      // Analyze integration demands
      const integrationSignals = await this.analyzeIntegrationSignals(tenantId, currentTier);
      signals.push(...integrationSignals);

      // Analyze performance limits
      const performanceSignals = await this.analyzePerformanceSignals(tenantId, currentTier);
      signals.push(...performanceSignals);

      // Store signals
      signals.forEach(signal => {
        this.signals.set(signal.id, signal);
      });

      // Check for patterns
      await this.checkForPatterns(signals);

      // Create opportunities
      await this.createOpportunities(signals);

      // Log the analysis
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'ANALYZE_EXPANSION_SIGNALS',
        details: {
          tenantId,
          currentTier,
          signalsFound: signals.length,
          signalTypes: signals.map(s => s.signalType)
        },
        ipAddress: 'SYSTEM',
        userAgent: 'EXPANSION_SIGNAL_ENGINE',
        timestamp: new Date(),
        category: 'EXPANSION',
        severity: 'INFO'
      });

      return signals;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'ANALYZE_EXPANSION_SIGNALS_ERROR',
        details: {
          error: (error as Error).message,
          tenantId,
          currentTier
        },
        ipAddress: 'SYSTEM',
        userAgent: 'EXPANSION_SIGNAL_ENGINE',
        timestamp: new Date(),
        category: 'EXPANSION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async analyzeUsageSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    const signals: ExpansionSignal[] = [];

    // Get usage metrics
    const usageMetrics = await this.usageMeter.getAllUsageMetrics(tenantId);

    for (const metric of usageMetrics) {
      const thresholdKey = `USAGE_SPIKE_${currentTier}_${metric.metricType}`;
      const threshold = this.thresholds.get(thresholdKey);

      if (threshold && metric.currentValue >= threshold.threshold) {
        const percentage = (metric.currentValue / metric.limit) * 100;
        const trend = await this.calculateTrend(metric.metricType, tenantId);

        const signal: ExpansionSignal = {
          id: this.generateSignalId(),
          tenantId,
          signalType: 'USAGE_SPIKE',
          severity: threshold.severity,
          confidence: Math.min(percentage, 95),
          description: `${metric.metricType} usage at ${percentage.toFixed(1)}% of limit`,
          currentValue: metric.currentValue,
          threshold: threshold.threshold,
          trend,
          timeframe: threshold.timeframe,
          recommendedAction: `Upgrade to ${threshold.recommendedTier} tier for increased limits`,
          potentialRevenue: this.calculatePotentialRevenue(currentTier, threshold.recommendedTier),
          probability: this.calculateConversionProbability(threshold.severity, percentage),
          currentTier,
          recommendedTier: threshold.recommendedTier,
          features: [metric.metricType],
          metrics: [
            {
              name: metric.metricType,
              value: metric.currentValue,
              unit: metric.unit,
              threshold: metric.limit,
              currentPercentage: percentage,
              trend: trend === 'INCREASING' ? 'UP' : trend === 'DECREASING' ? 'DOWN' : 'STABLE',
              historical: await this.getHistoricalData(metric.metricType, tenantId)
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          acknowledged: false,
          status: 'ACTIVE'
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  private async analyzeFeatureSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    const signals: ExpansionSignal[] = [];

    // Analyze advanced feature usage
    const advancedFeaturesUsed = await this.getAdvancedFeatureUsage(tenantId, currentTier);
    
    if (advancedFeaturesUsed.length > 0) {
      const thresholdKey = `FEATURE_ADOPTION_${currentTier}_advanced_features`;
      const threshold = this.thresholds.get(thresholdKey);

      if (threshold && advancedFeaturesUsed.length >= threshold.threshold) {
        const signal: ExpansionSignal = {
          id: this.generateSignalId(),
          tenantId,
          signalType: 'FEATURE_ADOPTION',
          severity: threshold.severity,
          confidence: 75,
          description: `Using ${advancedFeaturesUsed.length} advanced features beyond current tier`,
          currentValue: advancedFeaturesUsed.length,
          threshold: threshold.threshold,
          trend: 'INCREASING',
          timeframe: threshold.timeframe,
          recommendedAction: `Upgrade to ${threshold.recommendedTier} for full feature access`,
          potentialRevenue: this.calculatePotentialRevenue(currentTier, threshold.recommendedTier),
          probability: 0.8,
          currentTier,
          recommendedTier: threshold.recommendedTier,
          features: advancedFeaturesUsed,
          metrics: [
            {
              name: 'Advanced Features',
              value: advancedFeaturesUsed.length,
              unit: 'features',
              threshold: threshold.threshold,
              currentPercentage: (advancedFeaturesUsed.length / threshold.threshold) * 100,
              trend: 'UP',
              historical: []
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          acknowledged: false,
          status: 'ACTIVE'
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  private async analyzeTeamSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    const signals: ExpansionSignal[] = [];

    // Get user count
    const userMetric = await this.usageMeter.getUsageMetric(tenantId, 'USERS');
    
    if (userMetric) {
      const thresholdKey = `TEAM_GROWTH_${currentTier}_users`;
      const threshold = this.thresholds.get(thresholdKey);

      if (threshold && userMetric.currentValue >= threshold.threshold) {
        const percentage = (userMetric.currentValue / userMetric.limit) * 100;
        const trend = await this.calculateTrend('USERS', tenantId);

        const signal: ExpansionSignal = {
          id: this.generateSignalId(),
          tenantId,
          signalType: 'TEAM_GROWTH',
          severity: threshold.severity,
          confidence: Math.min(percentage + 10, 95),
          description: `Team size at ${percentage.toFixed(1)}% of current tier limit`,
          currentValue: userMetric.currentValue,
          threshold: threshold.threshold,
          trend,
          timeframe: threshold.timeframe,
          recommendedAction: `Upgrade to ${threshold.recommendedTier} for larger team support`,
          potentialRevenue: this.calculatePotentialRevenue(currentTier, threshold.recommendedTier),
          probability: this.calculateConversionProbability(threshold.severity, percentage),
          currentTier,
          recommendedTier: threshold.recommendedTier,
          features: ['multi_user_access'],
          metrics: [
            {
              name: 'Team Size',
              value: userMetric.currentValue,
              unit: 'users',
              threshold: userMetric.limit,
              currentPercentage: percentage,
              trend: trend === 'INCREASING' ? 'UP' : trend === 'DECREASING' ? 'DOWN' : 'STABLE',
              historical: await this.getHistoricalData('USERS', tenantId)
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          acknowledged: false,
          status: 'ACTIVE'
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  private async analyzeComplianceSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    const signals: ExpansionSignal[] = [];

    // Check for compliance requests
    const complianceRequests = await this.getComplianceRequests(tenantId);
    
    if (complianceRequests.length > 0) {
      const thresholdKey = currentTier === 'PRO' ? 'COMPLIANCE_NEED_PRO_enterprise_compliance' : 'COMPLIANCE_NEED_STARTER_compliance_requests';
      const threshold = this.thresholds.get(thresholdKey);

      if (threshold && complianceRequests.length >= threshold.threshold) {
        const signal: ExpansionSignal = {
          id: this.generateSignalId(),
          tenantId,
          signalType: 'COMPLIANCE_NEED',
          severity: threshold.severity,
          confidence: 90,
          description: `Compliance requirements detected: ${complianceRequests.join(', ')}`,
          currentValue: complianceRequests.length,
          threshold: threshold.threshold,
          trend: 'INCREASING',
          timeframe: threshold.timeframe,
          recommendedAction: `Upgrade to ${threshold.recommendedTier} for compliance features`,
          potentialRevenue: this.calculatePotentialRevenue(currentTier, threshold.recommendedTier),
          probability: 0.85,
          currentTier,
          recommendedTier: threshold.recommendedTier,
          features: complianceRequests,
          metrics: [
            {
              name: 'Compliance Requests',
              value: complianceRequests.length,
              unit: 'requests',
              threshold: threshold.threshold,
              currentPercentage: (complianceRequests.length / threshold.threshold) * 100,
              trend: 'UP',
              historical: []
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          acknowledged: false,
          status: 'ACTIVE'
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  private async analyzeIntegrationSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    const signals: ExpansionSignal[] = [];

    // Check for integration attempts
    const integrationAttempts = await this.getIntegrationAttempts(tenantId);
    
    if (integrationAttempts.length > 0) {
      const signal: ExpansionSignal = {
        id: this.generateSignalId(),
        tenantId,
        signalType: 'INTEGRATION_DEMAND',
        severity: 'MEDIUM',
        confidence: 70,
        description: `Integration attempts: ${integrationAttempts.join(', ')}`,
        currentValue: integrationAttempts.length,
        threshold: 1,
        trend: 'INCREASING',
        timeframe: 'MEDIUM_TERM',
        recommendedAction: 'Consider upgrade for enhanced integration capabilities',
        potentialRevenue: this.calculatePotentialRevenue(currentTier, 'PRO'),
        probability: 0.6,
        currentTier,
        recommendedTier: 'PRO',
        features: integrationAttempts,
        metrics: [
          {
            name: 'Integration Attempts',
            value: integrationAttempts.length,
            unit: 'attempts',
            threshold: 1,
            currentPercentage: 100,
            trend: 'UP',
            historical: []
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        acknowledged: false,
        status: 'ACTIVE'
      };

      signals.push(signal);
    }

    return signals;
  }

  private async analyzePerformanceSignals(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<ExpansionSignal[]> {
    const signals: ExpansionSignal[] = [];

    // Check for performance issues
    const performanceIssues = await this.getPerformanceIssues(tenantId);
    
    if (performanceIssues.length > 0) {
      const signal: ExpansionSignal = {
        id: this.generateSignalId(),
        tenantId,
        signalType: 'PERFORMANCE_LIMIT',
        severity: 'HIGH',
        confidence: 80,
        description: `Performance issues detected: ${performanceIssues.join(', ')}`,
        currentValue: performanceIssues.length,
        threshold: 1,
        trend: 'INCREASING',
        timeframe: 'IMMEDIATE',
        recommendedAction: 'Upgrade to ensure optimal performance',
        potentialRevenue: this.calculatePotentialRevenue(currentTier, 'ENTERPRISE'),
        probability: 0.7,
        currentTier,
        recommendedTier: 'ENTERPRISE',
        features: performanceIssues,
        metrics: [
          {
            name: 'Performance Issues',
            value: performanceIssues.length,
            unit: 'issues',
            threshold: 1,
            currentPercentage: 100,
            trend: 'UP',
            historical: []
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        acknowledged: false,
        status: 'ACTIVE'
      };

      signals.push(signal);
    }

    return signals;
  }

  private async calculateTrend(
    metricType: string,
    tenantId: string
  ): Promise<'INCREASING' | 'DECREASING' | 'STABLE'> {
    // Simplified trend calculation
    // In production, this would analyze historical data
    return Math.random() > 0.5 ? 'INCREASING' : 'STABLE';
  }

  private async getHistoricalData(
    metricType: string,
    tenantId: string
  ): Promise<HistoricalData[]> {
    // Simplified historical data
    // In production, this would query actual historical data
    const data: HistoricalData[] = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        date,
        value: Math.floor(Math.random() * 100),
        event: i === 0 ? 'Current' : undefined
      });
    }
    
    return data;
  }

  private async getAdvancedFeatureUsage(
    tenantId: string,
    currentTier: ProductTier
  ): Promise<string[]> {
    // Simplified feature usage detection
    // In production, this would analyze actual feature usage
    const features = ['advanced_analytics', 'custom_workflows', 'api_access', 'audit_logs'];
    return features.filter(() => Math.random() > 0.7);
  }

  private async getComplianceRequests(tenantId: string): Promise<string[]> {
    // Simplified compliance request detection
    // In production, this would analyze actual compliance requests
    const complianceTypes = ['SOX', 'GDPR', 'CCPA', 'HIPAA', 'SOC2'];
    return complianceTypes.filter(() => Math.random() > 0.8);
  }

  private async getIntegrationAttempts(tenantId: string): Promise<string[]> {
    // Simplified integration attempt detection
    // In production, this would analyze actual integration attempts
    const integrations = ['salesforce', 'quickbooks', 'xero', 'slack', 'teams'];
    return integrations.filter(() => Math.random() > 0.9);
  }

  private async getPerformanceIssues(tenantId: string): Promise<string[]> {
    // Simplified performance issue detection
    // In production, this would analyze actual performance metrics
    const issues = ['slow_queries', 'timeout_errors', 'memory_usage'];
    return issues.filter(() => Math.random() > 0.95);
  }

  private calculatePotentialRevenue(
    currentTier: ProductTier,
    recommendedTier: ProductTier
  ): number {
    const pricing: { [key in ProductTier]: { monthly: number; annual: number } } = {
      'FREE': { monthly: 0, annual: 0 },
      'STARTER': { monthly: 29, annual: 290 },
      'PRO': { monthly: 99, annual: 990 },
      'ENTERPRISE': { monthly: 499, annual: 4990 }
    };

    return pricing[recommendedTier].annual - pricing[currentTier].annual;
  }

  private calculateConversionProbability(
    severity: ExpansionSignal['severity'],
    percentage: number
  ): number {
    const baseProbability = {
      'LOW': 0.3,
      'MEDIUM': 0.5,
      'HIGH': 0.7,
      'CRITICAL': 0.9
    };

    const severityScore = baseProbability[severity];
    const usageScore = Math.min(percentage / 100, 1);
    
    return (severityScore + usageScore) / 2;
  }

  private async checkForPatterns(signals: ExpansionSignal[]): Promise<void> {
    for (const pattern of this.patterns.values()) {
      if (!pattern.isActive) continue;

      const matchingSignals = signals.filter(signal => 
        pattern.signalTypes.includes(signal.signalType)
      );

      if (matchingSignals.length >= 2) {
        const patternMatch = this.evaluatePattern(pattern, matchingSignals);
        
        if (patternMatch) {
          pattern.lastMatched = new Date();
          pattern.occurrences++;
          
          // Create high-confidence opportunity
          await this.createPatternBasedOpportunity(pattern, matchingSignals);
        }
      }
    }
  }

  private evaluatePattern(
    pattern: ExpansionPattern,
    signals: ExpansionSignal[]
  ): boolean {
    let totalScore = 0;
    let totalWeight = 0;

    for (const condition of pattern.conditions) {
      const matchingSignal = signals.find(s => s.signalType === condition.signalType);
      
      if (matchingSignal) {
        let conditionMet = false;
        
        switch (condition.operator) {
          case 'GREATER_THAN':
            conditionMet = matchingSignal.confidence >= condition.value;
            break;
          case 'LESS_THAN':
            conditionMet = matchingSignal.confidence < condition.value;
            break;
          case 'EQUALS':
            conditionMet = matchingSignal.confidence === condition.value;
            break;
          case 'BETWEEN':
            // Implementation for between operator
            break;
        }

        if (conditionMet) {
          totalScore += condition.weight;
        }
      }
      
      totalWeight += condition.weight;
    }

    return totalWeight > 0 && (totalScore / totalWeight) >= 0.7;
  }

  private async createPatternBasedOpportunity(
    pattern: ExpansionPattern,
    signals: ExpansionSignal[]
  ): Promise<void> {
    const opportunityId = this.generateOpportunityId();
    
    const opportunity: ExpansionOpportunity = {
      id: opportunityId,
      tenantId: signals[0].tenantId,
      opportunityType: 'TIER_UPGRADE',
      priority: 'HIGH',
      revenuePotential: pattern.averageRevenue,
      probability: pattern.successRate,
      timeToClose: pattern.timeToConversion,
      effort: 'MEDIUM',
      signals,
      recommendedActions: [
        {
          type: 'CONTACT',
          description: 'Contact customer about upgrade opportunity',
          priority: 1,
          timeframe: 3,
          owner: 'SALES_TEAM',
          template: 'expansion_opportunity_template'
        }
      ],
      status: 'IDENTIFIED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.opportunities.set(opportunityId, opportunity);
  }

  private async createOpportunities(signals: ExpansionSignal[]): Promise<void> {
    // Group signals by tenant
    const signalsByTenant = new Map<string, ExpansionSignal[]>();
    
    signals.forEach(signal => {
      const tenantSignals = signalsByTenant.get(signal.tenantId) || [];
      tenantSignals.push(signal);
      signalsByTenant.set(signal.tenantId, tenantSignals);
    });

    // Create opportunities for each tenant
    for (const [tenantId, tenantSignals] of signalsByTenant) {
      const existingOpportunity = Array.from(this.opportunities.values())
        .find(op => op.tenantId === tenantId && op.status === 'IDENTIFIED');

      if (!existingOpportunity) {
        const opportunityId = this.generateOpportunityId();
        
        const totalRevenue = tenantSignals.reduce((sum, s) => sum + s.potentialRevenue, 0);
        const avgProbability = tenantSignals.reduce((sum, s) => sum + s.probability, 0) / tenantSignals.length;
        const maxSeverity = this.getMaxSeverity(tenantSignals);

        const opportunity: ExpansionOpportunity = {
          id: opportunityId,
          tenantId,
          opportunityType: 'TIER_UPGRADE',
          priority: maxSeverity,
          revenuePotential: totalRevenue,
          probability: avgProbability,
          timeToClose: 21,
          effort: 'MEDIUM',
          signals: tenantSignals,
          recommendedActions: [
            {
              type: 'CONTACT',
              description: 'Contact customer about expansion opportunity',
              priority: 1,
              timeframe: 7,
              owner: 'SALES_TEAM',
              template: 'expansion_opportunity_template'
            }
          ],
          status: 'IDENTIFIED',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.opportunities.set(opportunityId, opportunity);
      }
    }
  }

  private getMaxSeverity(signals: ExpansionSignal[]): ExpansionOpportunity['priority'] {
    const severityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const maxSeverity = signals.reduce((max, signal) => {
      return severityOrder[signal.severity] > severityOrder[max] ? signal.severity : max;
    }, 'LOW');
    return maxSeverity as ExpansionOpportunity['priority'];
  }

  public async getSignals(tenantId: string): Promise<ExpansionSignal[]> {
    return Array.from(this.signals.values()).filter(signal => signal.tenantId === tenantId);
  }

  public async getOpportunities(tenantId?: string): Promise<ExpansionOpportunity[]> {
    const opportunities = Array.from(this.opportunities.values());
    return tenantId ? opportunities.filter(op => op.tenantId === tenantId) : opportunities;
  }

  public async getExpansionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ExpansionMetrics> {
    const signals = Array.from(this.signals.values())
      .filter(signal => signal.createdAt >= startDate && signal.createdAt <= endDate);

    const opportunities = Array.from(this.opportunities.values())
      .filter(opportunity => opportunity.createdAt >= startDate && opportunity.createdAt <= endDate);

    const signalsByType: { [key: string]: number } = {};
    const signalsBySeverity: { [key: string]: number } = {};
    const signalsByTier: { [key: string]: number } = {};

    signals.forEach(signal => {
      signalsByType[signal.signalType] = (signalsByType[signal.signalType] || 0) + 1;
      signalsBySeverity[signal.severity] = (signalsBySeverity[signal.severity] || 0) + 1;
      signalsByTier[signal.currentTier] = (signalsByTier[signal.currentTier] || 0) + 1;
    });

    const convertedOpportunities = opportunities.filter(op => op.status === 'CONVERTED');
    const conversionRate = opportunities.length > 0 ? (convertedOpportunities.length / opportunities.length) * 100 : 0;
    const averageRevenuePerSignal = signals.length > 0 ? 
      convertedOpportunities.reduce((sum, op) => sum + op.revenuePotential, 0) / signals.length : 0;
    const timeToConversion = convertedOpportunities.length > 0 ?
      convertedOpportunities.reduce((sum, op) => sum + op.timeToClose, 0) / convertedOpportunities.length : 0;

    const opportunityPipeline = {
      identified: opportunities.filter(op => op.status === 'IDENTIFIED').length,
      qualified: opportunities.filter(op => op.status === 'QUALIFIED').length,
      engaged: opportunities.filter(op => op.status === 'ENGAGED').length,
      converted: convertedOpportunities.length,
      totalValue: convertedOpportunities.reduce((sum, op) => sum + op.revenuePotential, 0)
    };

    return {
      totalSignals: signals.length,
      signalsByType,
      signalsBySeverity,
      signalsByTier,
      conversionRate,
      averageRevenuePerSignal,
      timeToConversion,
      topSignals: [], // Placeholder
      opportunityPipeline,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  private generateSignalId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SIG${timestamp}${random}`;
  }

  private generateOpportunityId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `OPP${timestamp}${random}`;
  }
}

interface SignalThreshold {
  signalType: ExpansionSignal['signalType'];
  tier: ProductTier;
  metric: string;
  threshold: number;
  severity: ExpansionSignal['severity'];
  timeframe: ExpansionSignal['timeframe'];
  recommendedTier: ProductTier;
}
