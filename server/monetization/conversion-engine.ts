import { ProductTier } from './product-tiers';
import { TrialManager, Trial } from './trial-manager';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';

export interface Conversion {
  id: string;
  trialId: string;
  tenantId: string;
  conversionType: 'TRIAL_TO_PAID' | 'TIER_UPGRADE' | 'TIER_DOWNGRADE' | 'REACTIVATION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  fromTier?: ProductTier;
  toTier: ProductTier;
  conversionDate: Date;
  effectiveDate: Date;
  billingStartDate: Date;
  pricing: ConversionPricing;
  paymentInfo: PaymentInfo;
  conversionFactors: ConversionFactor[];
  incentives: ConversionIncentive[];
  requirements: ConversionRequirement[];
  createdAt: Date;
  updatedAt: Date;
  initiatedBy: string;
  completedBy?: string;
  failureReason?: string;
  notes: ConversionNote[];
  activities: ConversionActivity[];
}

export interface ConversionPricing {
  basePrice: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  contractLength: number;
  discounts: ConversionDiscount[];
  setupFee: number;
  implementationFee: number;
  trainingFee: number;
  migrationFee: number;
  totalSetupCost: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  firstMonthRevenue: number;
  totalContractValue: number;
}

export interface ConversionDiscount {
  type: 'TRIAL_CONVERSION' | 'ANNUAL_PREPAY' | 'VOLUME' | 'PROMOTION' | 'CUSTOM';
  name: string;
  value: number;
  valueType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  conditions: string[];
  expiresAt?: Date;
  approvedBy: string;
  approvedAt: Date;
}

export interface PaymentInfo {
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'ACH' | 'WIRE' | 'PURCHASE_ORDER';
  paymentMethodId?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  autoPayEnabled: boolean;
  paymentTerms: {
    netDays: number;
    lateFeePercentage: number;
    earlyPaymentDiscount?: {
      percentage: number;
      days: number;
    };
  };
  purchaseOrder?: {
    number: string;
    amount: number;
    expiresAt: Date;
  };
}

export interface ConversionFactor {
  type: 'USAGE' | 'FEATURE_ADOPTION' | 'USER_ENGAGEMENT' | 'TIME_IN_TRIAL' | 'TEAM_SIZE' | 'BUSINESS_IMPACT';
  name: string;
  value: number;
  weight: number;
  score: number;
  description: string;
  threshold: number;
  met: boolean;
}

export interface ConversionIncentive {
  id: string;
  type: 'DISCOUNT' | 'FREE_MONTHS' | 'ADDITIONAL_FEATURES' | 'TRAINING_CREDITS' | 'MIGRATION_SUPPORT';
  name: string;
  description: string;
  value: number;
  valueType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'MONTHS' | 'CREDITS';
  conditions: string[];
  expiresAt?: Date;
  claimed: boolean;
  claimedAt?: Date;
}

export interface ConversionRequirement {
  id: string;
  type: 'PAYMENT_SETUP' | 'DATA_MIGRATION' | 'USER_TRAINING' | 'COMPLIANCE_CHECK' | 'TECHNICAL_SETUP' | 'LEGAL_REVIEW';
  name: string;
  description: string;
  mandatory: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  evidence?: string[];
  dependencies: string[];
}

export interface ConversionNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  category: 'GENERAL' | 'PRICING' | 'TECHNICAL' | 'LEGAL' | 'PAYMENT';
  visibility: 'INTERNAL' | 'TEAM' | 'ALL';
}

export interface ConversionActivity {
  id: string;
  type: 'INITIATED' | 'PAYMENT_SETUP' | 'DATA_MIGRATION' | 'TIER_CHANGE' | 'BILLING_START' | 'COMPLETED' | 'FAILED';
  description: string;
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: { [key: string]: any };
}

export interface ConversionMetrics {
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  conversionRate: number;
  averageConversionTime: number;
  averageDealSize: number;
  conversionsByType: { [key: string]: number };
  conversionsByTier: { [key: string]: number };
  conversionFactors: { factor: string; correlation: number }[];
  topIncentives: { incentive: string; usage: number; successRate: number }[];
  abandonmentReasons: { reason: string; count: number }[];
  revenueImpact: {
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    totalContractValue: number;
  };
  periodStart: Date;
  periodEnd: Date;
}

export interface ConversionWorkflow {
  id: string;
  name: string;
  description: string;
  conversionType: Conversion['conversionType'];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'AUTOMATED' | 'MANUAL' | 'APPROVAL' | 'NOTIFICATION';
  description: string;
  assignee?: string;
  order: number;
  required: boolean;
  parallel: boolean;
  conditions?: string[];
  timeout?: number; // in hours
  actions: WorkflowAction[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'BETWEEN';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'SEND_EMAIL' | 'CREATE_TASK' | 'UPDATE_RECORD' | 'CALL_API' | 'APPROVE' | 'REJECT';
  parameters: { [key: string]: any };
  order: number;
}

export class ConversionEngine {
  private static instance: ConversionEngine;
  private auditLog: ImmutableAuditLogger;
  private trialManager: TrialManager;
  private conversions: Map<string, Conversion> = new Map();
  private workflows: Map<string, ConversionWorkflow> = new Map();
  private incentives: Map<string, ConversionIncentive> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.trialManager = TrialManager.getInstance();
    this.initializeDefaultWorkflows();
    this.initializeDefaultIncentives();
  }

  public static getInstance(): ConversionEngine {
    if (!ConversionEngine.instance) {
      ConversionEngine.instance = new ConversionEngine();
    }
    return ConversionEngine.instance;
  }

  private initializeDefaultWorkflows(): void {
    const workflows: ConversionWorkflow[] = [
      {
        id: 'TRIAL_TO_PAID_WORKFLOW',
        name: 'Trial to Paid Conversion',
        description: 'Standard workflow for converting trial users to paid plans',
        conversionType: 'TRIAL_TO_PAID',
        steps: [
          {
            id: 'payment_setup',
            name: 'Payment Method Setup',
            type: 'MANUAL',
            description: 'Customer sets up payment method',
            order: 1,
            required: true,
            parallel: false,
            actions: [
              {
                type: 'SEND_EMAIL',
                parameters: { template: 'payment_setup_instructions' },
                order: 1
              }
            ]
          },
          {
            id: 'tier_selection',
            name: 'Tier Selection',
            type: 'MANUAL',
            description: 'Customer selects appropriate tier',
            order: 2,
            required: true,
            parallel: false,
            actions: [
              {
                type: 'SEND_EMAIL',
                parameters: { template: 'tier_selection_guidance' },
                order: 1
              }
            ]
          },
          {
            id: 'data_migration',
            name: 'Data Migration',
            type: 'AUTOMATED',
            description: 'Migrate trial data to paid account',
            order: 3,
            required: true,
            parallel: false,
            actions: [
              {
                type: 'UPDATE_RECORD',
                parameters: { action: 'migrate_trial_data' },
                order: 1
              }
            ]
          },
          {
            id: 'billing_activation',
            name: 'Billing Activation',
            type: 'AUTOMATED',
            description: 'Activate billing for the account',
            order: 4,
            required: true,
            parallel: false,
            actions: [
              {
                type: 'CALL_API',
                parameters: { endpoint: '/billing/activate' },
                order: 1
              }
            ]
          }
        ],
        conditions: [
          { field: 'trial.status', operator: 'EQUALS', value: 'ACTIVE' },
          { field: 'trial.daysRemaining', operator: 'LESS_THAN', value: 7 }
        ],
        isActive: true,
        createdBy: 'SYSTEM',
        createdAt: new Date()
      }
    ];

    workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  private initializeDefaultIncentives(): void {
    const incentives: ConversionIncentive[] = [
      {
        id: 'TRIAL_CONVERSION_DISCOUNT',
        type: 'DISCOUNT',
        name: 'Trial Conversion Discount',
        description: '20% discount for converting from trial',
        value: 20,
        valueType: 'PERCENTAGE',
        conditions: ['trial_completed', 'conversion_within_30_days'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        claimed: false
      },
      {
        id: 'ANNUAL_PREPAY_DISCOUNT',
        type: 'DISCOUNT',
        name: 'Annual Prepayment Discount',
        description: 'Additional 10% discount for annual prepayment',
        value: 10,
        valueType: 'PERCENTAGE',
        conditions: ['annual_billing', 'prepayment'],
        claimed: false
      },
      {
        id: 'FREE_ONBOARDING',
        type: 'TRAINING_CREDITS',
        name: 'Free Onboarding Session',
        description: 'Complimentary onboarding session for new converts',
        value: 1,
        valueType: 'CREDITS',
        conditions: ['first_time_conversion'],
        claimed: false
      }
    ];

    incentives.forEach(incentive => {
      this.incentives.set(incentive.id, incentive);
    });
  }

  public async initiateConversion(
    trialId: string,
    toTier: ProductTier,
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
    paymentInfo: PaymentInfo,
    initiatedBy: string
  ): Promise<Conversion> {
    try {
      // Get trial information
      const trial = await this.trialManager.getTrial(trialId);
      if (!trial) {
        throw new Error(`Trial ${trialId} not found`);
      }

      if (trial.status !== 'ACTIVE') {
        throw new Error(`Trial ${trialId} is not active`);
      }

      // Analyze conversion factors
      const conversionFactors = await this.analyzeConversionFactors(trial);

      // Calculate pricing
      const pricing = await this.calculateConversionPricing(trial, toTier, billingCycle, conversionFactors);

      // Generate conversion ID
      const conversionId = this.generateConversionId();

      // Create conversion
      const conversion: Conversion = {
        id: conversionId,
        trialId,
        tenantId: trial.tenantId,
        conversionType: 'TRIAL_TO_PAID',
        status: 'PENDING',
        fromTier: trial.targetTier,
        toTier,
        conversionDate: new Date(),
        effectiveDate: new Date(),
        billingStartDate: new Date(),
        pricing,
        paymentInfo,
        conversionFactors,
        incentives: await this.getApplicableIncentives(trial, toTier, billingCycle),
        requirements: await this.generateConversionRequirements(trial, toTier),
        createdAt: new Date(),
        updatedAt: new Date(),
        initiatedBy,
        notes: [],
        activities: []
      };

      // Store conversion
      this.conversions.set(conversionId, conversion);

      // Start conversion workflow
      await this.startConversionWorkflow(conversion);

      // Add initial activity
      const activity: ConversionActivity = {
        id: this.generateActivityId(),
        type: 'INITIATED',
        description: `Conversion initiated from ${trial.targetTier} to ${toTier}`,
        timestamp: new Date(),
        userId: initiatedBy,
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE'
      };
      conversion.activities.push(activity);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: trial.tenantId,
        userId: initiatedBy,
        action: 'INITIATE_CONVERSION',
        details: {
          conversionId,
          trialId,
          fromTier: trial.targetTier,
          toTier,
          billingCycle,
          totalContractValue: pricing.totalContractValue
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE',
        timestamp: new Date(),
        category: 'CONVERSION',
        severity: 'INFO'
      });

      return conversion;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId: 'UNKNOWN',
        userId: initiatedBy,
        action: 'INITIATE_CONVERSION_ERROR',
        details: {
          error: (error as Error).message,
          trialId,
          toTier
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE',
        timestamp: new Date(),
        category: 'CONVERSION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async analyzeConversionFactors(trial: Trial): Promise<ConversionFactor[]> {
    const factors: ConversionFactor[] = [];

    // Usage factor
    const totalUsage = trial.usage.reduce((sum, usage) => sum + usage.value, 0);
    const usageLimit = trial.limits.find(l => l.metric === 'transactions')?.limit || 100;
    const usageScore = Math.min((totalUsage / usageLimit) * 100, 100);
    
    factors.push({
      type: 'USAGE',
      name: 'Usage Intensity',
      value: totalUsage,
      weight: 0.3,
      score: usageScore,
      description: `Used ${totalUsage} transactions out of ${usageLimit} limit`,
      threshold: 50,
      met: usageScore >= 50
    });

    // Feature adoption factor
    const enabledFeatures = trial.features.filter(f => f.enabled).length;
    const totalFeatures = trial.features.length;
    const featureScore = (enabledFeatures / totalFeatures) * 100;
    
    factors.push({
      type: 'FEATURE_ADOPTION',
      name: 'Feature Adoption',
      value: enabledFeatures,
      weight: 0.25,
      score: featureScore,
      description: `Adopted ${enabledFeatures} out of ${totalFeatures} features`,
      threshold: 60,
      met: featureScore >= 60
    });

    // Time in trial factor
    const daysInTrial = Math.ceil((Date.now() - trial.startDate.getTime()) / (24 * 60 * 60 * 1000));
    const timeScore = Math.min((daysInTrial / trial.duration) * 100, 100);
    
    factors.push({
      type: 'TIME_IN_TRIAL',
      name: 'Trial Engagement Duration',
      value: daysInTrial,
      weight: 0.2,
      score: timeScore,
      description: `Spent ${daysInTrial} days in ${trial.duration}-day trial`,
      threshold: 70,
      met: timeScore >= 70
    });

    // User engagement factor
    const loginActivities = trial.activities.filter(a => a.type === 'LOGIN').length;
    const engagementScore = Math.min((loginActivities / 10) * 100, 100);
    
    factors.push({
      type: 'USER_ENGAGEMENT',
      name: 'User Engagement',
      value: loginActivities,
      weight: 0.15,
      score: engagementScore,
      description: `Logged in ${loginActivities} times during trial`,
      threshold: 40,
      met: engagementScore >= 40
    });

    // Team size factor
    const teamSize = trial.contactInfo.companySize;
    const teamScore = this.getTeamSizeScore(teamSize);
    
    factors.push({
      type: 'TEAM_SIZE',
      name: 'Team Size Potential',
      value: this.getTeamSizeValue(teamSize),
      weight: 0.1,
      score: teamScore,
      description: `Company size: ${teamSize}`,
      threshold: 30,
      met: teamScore >= 30
    });

    return factors;
  }

  private getTeamSizeScore(size: string): number {
    const scores: { [key: string]: number } = {
      '1-10': 20,
      '11-50': 40,
      '51-200': 60,
      '201-500': 80,
      '500+': 100
    };
    return scores[size] || 0;
  }

  private getTeamSizeValue(size: string): number {
    const values: { [key: string]: number } = {
      '1-10': 5,
      '11-50': 25,
      '51-200': 100,
      '201-500': 350,
      '500+': 750
    };
    return values[size] || 0;
  }

  private async calculateConversionPricing(
    trial: Trial,
    toTier: ProductTier,
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
    conversionFactors: ConversionFactor[]
  ): Promise<ConversionPricing> {
    // Base pricing (simplified - would come from pricing model)
    const basePrices: { [key in ProductTier]: { monthly: number; annual: number } } = {
      'FREE': { monthly: 0, annual: 0 },
      'STARTER': { monthly: 29, annual: 290 },
      'PRO': { monthly: 99, annual: 990 },
      'ENTERPRISE': { monthly: 499, annual: 4990 }
    };

    const basePrice = basePrices[toTier];
    const monthlyPrice = billingCycle === 'ANNUAL' ? basePrice.annual / 12 : basePrice.monthly;

    // Calculate discounts
    const discounts: ConversionDiscount[] = [];
    let totalDiscount = 0;

    // Trial conversion discount
    if (conversionFactors.some(f => f.type === 'USAGE' && f.met)) {
      const trialDiscount: ConversionDiscount = {
        type: 'TRIAL_CONVERSION',
        name: 'Trial Conversion Discount',
        value: 20,
        valueType: 'PERCENTAGE',
        conditions: ['trial_usage_threshold_met'],
        approvedBy: 'SYSTEM',
        approvedAt: new Date()
      };
      discounts.push(trialDiscount);
      totalDiscount += 20;
    }

    // Annual prepayment discount
    if (billingCycle === 'ANNUAL') {
      const annualDiscount: ConversionDiscount = {
        type: 'ANNUAL_PREPAY',
        name: 'Annual Prepayment Discount',
        value: 20,
        valueType: 'PERCENTAGE',
        conditions: ['annual_billing_selected'],
        approvedBy: 'SYSTEM',
        approvedAt: new Date()
      };
      discounts.push(annualDiscount);
      totalDiscount += 20;
    }

    // Apply discounts
    const discountedPrice = monthlyPrice * (1 - totalDiscount / 100);

    // Calculate fees
    const setupFee = toTier === 'ENTERPRISE' ? 5000 : 0;
    const implementationFee = discountedPrice * 12 * 0.1; // 10% of annual value
    const trainingFee = toTier === 'ENTERPRISE' ? 2000 : 500;
    const migrationFee = 0; // Complimentary for trial conversions

    const totalSetupCost = setupFee + implementationFee + trainingFee + migrationFee;
    const monthlyRecurringRevenue = discountedPrice;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;
    const firstMonthRevenue = monthlyRecurringRevenue + (totalSetupCost / 12);
    const totalContractValue = annualRecurringRevenue + totalSetupCost;

    return {
      basePrice: monthlyPrice,
      currency: 'USD',
      billingCycle,
      contractLength: billingCycle === 'ANNUAL' ? 12 : 1,
      discounts,
      setupFee,
      implementationFee,
      trainingFee,
      migrationFee,
      totalSetupCost,
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      firstMonthRevenue,
      totalContractValue
    };
  }

  private async getApplicableIncentives(
    trial: Trial,
    toTier: ProductTier,
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  ): Promise<ConversionIncentive[]> {
    const applicableIncentives: ConversionIncentive[] = [];

    for (const incentive of this.incentives.values()) {
      let isApplicable = false;

      switch (incentive.id) {
        case 'TRIAL_CONVERSION_DISCOUNT':
          isApplicable = true; // Always applicable for trial conversions
          break;
        case 'ANNUAL_PREPAY_DISCOUNT':
          isApplicable = billingCycle === 'ANNUAL';
          break;
        case 'FREE_ONBOARDING':
          isApplicable = toTier !== 'FREE';
          break;
      }

      if (isApplicable && !incentive.claimed) {
        applicableIncentives.push({ ...incentive });
      }
    }

    return applicableIncentives;
  }

  private async generateConversionRequirements(
    trial: Trial,
    toTier: ProductTier
  ): Promise<ConversionRequirement[]> {
    const requirements: ConversionRequirement[] = [];

    // Payment setup requirement
    requirements.push({
      id: this.generateRequirementId(),
      type: 'PAYMENT_SETUP',
      name: 'Payment Method Setup',
      description: 'Customer must set up a valid payment method',
      mandatory: true,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Data migration requirement
    requirements.push({
      id: this.generateRequirementId(),
      type: 'DATA_MIGRATION',
      name: 'Trial Data Migration',
      description: 'Migrate trial data to paid account',
      mandatory: true,
      status: 'PENDING',
      assignedTo: 'SYSTEM',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    });

    // User training requirement (for higher tiers)
    if (toTier === 'PRO' || toTier === 'ENTERPRISE') {
      requirements.push({
        id: this.generateRequirementId(),
        type: 'USER_TRAINING',
        name: 'User Training Session',
        description: 'Conduct user training for new features',
        mandatory: false,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
    }

    // Compliance check for enterprise
    if (toTier === 'ENTERPRISE') {
      requirements.push({
        id: this.generateRequirementId(),
        type: 'COMPLIANCE_CHECK',
        name: 'Enterprise Compliance Verification',
        description: 'Verify enterprise compliance requirements',
        mandatory: true,
        status: 'PENDING',
        assignedTo: 'COMPLIANCE_TEAM',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      });
    }

    return requirements;
  }

  private async startConversionWorkflow(conversion: Conversion): Promise<void> {
    const workflow = this.workflows.get('TRIAL_TO_PAID_WORKFLOW');
    if (!workflow) return;

    // Execute workflow steps
    for (const step of workflow.steps) {
      if (step.type === 'AUTOMATED') {
        await this.executeWorkflowStep(conversion, step);
      } else if (step.type === 'NOTIFICATION') {
        await this.sendWorkflowNotification(conversion, step);
      }
    }
  }

  private async executeWorkflowStep(conversion: Conversion, step: WorkflowStep): Promise<void> {
    for (const action of step.actions) {
      switch (action.type) {
        case 'UPDATE_RECORD':
          // Execute record update logic
          break;
        case 'CALL_API':
          // Execute API call logic
          break;
        case 'SEND_EMAIL':
          // Execute email sending logic
          break;
      }
    }

    // Add activity
    const activity: ConversionActivity = {
      id: this.generateActivityId(),
      type: 'TIER_CHANGE',
      description: `Executed workflow step: ${step.name}`,
      timestamp: new Date(),
      ipAddress: 'SYSTEM',
      userAgent: 'CONVERSION_ENGINE'
    };
    conversion.activities.push(activity);
  }

  private async sendWorkflowNotification(conversion: Conversion, step: WorkflowStep): Promise<void> {
    // Send notification logic
    // This would integrate with email/notification systems
  }

  public async completeConversion(
    conversionId: string,
    completedBy: string
  ): Promise<void> {
    try {
      const conversion = this.conversions.get(conversionId);
      if (!conversion) {
        throw new Error(`Conversion ${conversionId} not found`);
      }

      if (conversion.status !== 'IN_PROGRESS') {
        throw new Error(`Conversion ${conversionId} is not in progress`);
      }

      // Check all requirements are completed
      const incompleteRequirements = conversion.requirements.filter(r => r.mandatory && r.status !== 'COMPLETED');
      if (incompleteRequirements.length > 0) {
        throw new Error(`Cannot complete conversion. Incomplete requirements: ${incompleteRequirements.map(r => r.name).join(', ')}`);
      }

      // Complete conversion
      conversion.status = 'COMPLETED';
      conversion.completedBy = completedBy;
      conversion.updatedAt = new Date();

      // Convert trial
      await this.trialManager.convertTrial(conversion.trialId, conversion.toTier, completedBy);

      // Claim incentives
      for (const incentive of conversion.incentives) {
        if (!incentive.claimed) {
          incentive.claimed = true;
          incentive.claimedAt = new Date();
        }
      }

      // Add completion activity
      const activity: ConversionActivity = {
        id: this.generateActivityId(),
        type: 'COMPLETED',
        description: `Conversion completed successfully`,
        timestamp: new Date(),
        userId: completedBy,
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE'
      };
      conversion.activities.push(activity);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: conversion.tenantId,
        userId: completedBy,
        action: 'COMPLETE_CONVERSION',
        details: {
          conversionId,
          totalContractValue: conversion.pricing.totalContractValue,
          monthlyRecurringRevenue: conversion.pricing.monthlyRecurringRevenue
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE',
        timestamp: new Date(),
        category: 'CONVERSION',
        severity: 'INFO'
      });
    } catch (error) {
      const conversion = this.conversions.get(conversionId);
      await this.auditLog.logOperation({
        tenantId: conversion?.tenantId || 'UNKNOWN',
        userId: completedBy,
        action: 'COMPLETE_CONVERSION_ERROR',
        details: {
          error: (error as Error).message,
          conversionId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE',
        timestamp: new Date(),
        category: 'CONVERSION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async failConversion(
    conversionId: string,
    reason: string,
    failedBy: string
  ): Promise<void> {
    try {
      const conversion = this.conversions.get(conversionId);
      if (!conversion) {
        throw new Error(`Conversion ${conversionId} not found`);
      }

      // Fail conversion
      conversion.status = 'FAILED';
      conversion.failureReason = reason;
      conversion.updatedAt = new Date();

      // Add failure activity
      const activity: ConversionActivity = {
        id: this.generateActivityId(),
        type: 'FAILED',
        description: `Conversion failed: ${reason}`,
        timestamp: new Date(),
        userId: failedBy,
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE'
      };
      conversion.activities.push(activity);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: conversion.tenantId,
        userId: failedBy,
        action: 'FAIL_CONVERSION',
        details: {
          conversionId,
          reason
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE',
        timestamp: new Date(),
        category: 'CONVERSION',
        severity: 'WARNING'
      });
    } catch (error) {
      const conversion = this.conversions.get(conversionId);
      await this.auditLog.logOperation({
        tenantId: conversion?.tenantId || 'UNKNOWN',
        userId: failedBy,
        action: 'FAIL_CONVERSION_ERROR',
        details: {
          error: (error as Error).message,
          conversionId,
          reason
        },
        ipAddress: 'SYSTEM',
        userAgent: 'CONVERSION_ENGINE',
        timestamp: new Date(),
        category: 'CONVERSION',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async getConversion(conversionId: string): Promise<Conversion | null> {
    return this.conversions.get(conversionId) || null;
  }

  public async getConversionsByStatus(status: Conversion['status']): Promise<Conversion[]> {
    return Array.from(this.conversions.values()).filter(conversion => conversion.status === status);
  }

  public async getConversionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ConversionMetrics> {
    const conversions = Array.from(this.conversions.values())
      .filter(conversion => conversion.createdAt >= startDate && conversion.createdAt <= endDate);

    const successfulConversions = conversions.filter(c => c.status === 'COMPLETED');
    const failedConversions = conversions.filter(c => c.status === 'FAILED');

    const conversionRate = conversions.length > 0 ? (successfulConversions.length / conversions.length) * 100 : 0;
    const averageConversionTime = successfulConversions.length > 0
      ? successfulConversions.reduce((sum, c) => {
          const time = c.completedAt ? c.completedAt.getTime() - c.createdAt.getTime() : 0;
          return sum + time;
        }, 0) / successfulConversions.length / (24 * 60 * 60 * 1000)
      : 0;

    const averageDealSize = successfulConversions.length > 0
      ? successfulConversions.reduce((sum, c) => sum + c.pricing.totalContractValue, 0) / successfulConversions.length
      : 0;

    const conversionsByType: { [key: string]: number } = {};
    const conversionsByTier: { [key: string]: number } = {};

    conversions.forEach(conversion => {
      conversionsByType[conversion.conversionType] = (conversionsByType[conversion.conversionType] || 0) + 1;
      conversionsByTier[conversion.toTier] = (conversionsByTier[conversion.toTier] || 0) + 1;
    });

    const revenueImpact = {
      monthlyRecurringRevenue: successfulConversions.reduce((sum, c) => sum + c.pricing.monthlyRecurringRevenue, 0),
      annualRecurringRevenue: successfulConversions.reduce((sum, c) => sum + c.pricing.annualRecurringRevenue, 0),
      totalContractValue: successfulConversions.reduce((sum, c) => sum + c.pricing.totalContractValue, 0)
    };

    return {
      totalConversions: conversions.length,
      successfulConversions: successfulConversions.length,
      failedConversions: failedConversions.length,
      conversionRate,
      averageConversionTime,
      averageDealSize,
      conversionsByType,
      conversionsByTier,
      conversionFactors: [], // Placeholder
      topIncentives: [], // Placeholder
      abandonmentReasons: [], // Placeholder
      revenueImpact,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  private generateConversionId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CONV${timestamp}${random}`;
  }

  private generateActivityId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ACT${timestamp}${random}`;
  }

  private generateRequirementId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REQ${timestamp}${random}`;
  }
}
