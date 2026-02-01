import { ProductTier } from './product-tiers';
import { ContractEngine, Contract } from './contract-engine';
import { ImmutableAuditLogger } from '../compliance/immutable-audit-log';

export interface Deal {
  id: string;
  tenantId: string;
  dealNumber: string;
  dealName: string;
  status: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'APPROVED' | 'WON' | 'LOST' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dealType: 'NEW_BUSINESS' | 'RENEWAL' | 'EXPANSION' | 'UPGRADE' | 'DOWNGRADE';
  estimatedValue: number;
  currency: string;
  probability: number;
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  salesRep: string;
  accountManager: string;
  customer: CustomerInfo;
  requirements: DealRequirement[];
  pricing: DealPricing;
  terms: DealTerms;
  approvals: DealApproval[];
  contracts: string[]; // Contract IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes: DealNote[];
  activities: DealActivity[];
  competitors: CompetitorInfo[];
  riskFactors: RiskFactor[];
}

export interface CustomerInfo {
  name: string;
  industry: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  website: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contacts: ContactInfo[];
  currentProvider?: string;
  currentContractValue?: number;
  decisionMaker: string;
  technicalContact: string;
  billingContact: string;
}

export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  role: 'DECISION_MAKER' | 'TECHNICAL' | 'BILLING' | 'USER' | 'INFLUENCER';
  influence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DealRequirement {
  id: string;
  category: 'FUNCTIONAL' | 'TECHNICAL' | 'COMPLIANCE' | 'INTEGRATION' | 'SUPPORT';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mandatory: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  assignedTo?: string;
  dueDate?: Date;
  estimatedEffort?: number;
  actualEffort?: number;
  dependencies: string[];
}

export interface DealPricing {
  basePrice: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  contractLength: number; // in months
  tier: ProductTier;
  users: number;
  companies: number;
  expectedUsage: ExpectedUsage[];
  discounts: PricingDiscount[];
  overageRates: OverageRate[];
  setupFee: number;
  implementationFee: number;
  trainingFee: number;
  supportFee: number;
  totalContractValue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
}

export interface ExpectedUsage {
  metric: string;
  estimatedMonthly: number;
  estimatedAnnual: number;
  unit: string;
  growthRate: number; // percentage
}

export interface PricingDiscount {
  type: 'VOLUME' | 'ANNUAL' | 'STARTUP' | 'NONPROFIT' | 'EDUCATIONAL' | 'CUSTOM' | 'EARLY_BIRD';
  value: number;
  reason: string;
  approvedBy: string;
  approvedAt: Date;
  expiresAt?: Date;
}

export interface OverageRate {
  metric: string;
  unit: string;
  rate: number;
  tieredRates?: {
    minQuantity: number;
    rate: number;
  }[];
}

export interface DealTerms {
  paymentTerms: {
    netDays: number;
    lateFeePercentage: number;
    earlyPaymentDiscount?: {
      percentage: number;
      days: number;
    };
  };
  renewalTerms: {
    autoRenew: boolean;
    noticePeriod: number; // days
    priceIncrease: {
      type: 'PERCENTAGE' | 'FIXED';
      value: number;
      cap?: number;
    };
  };
  terminationTerms: {
    noticePeriod: number; // days
    penalty?: {
      type: 'PERCENTAGE' | 'FIXED';
      value: number;
    };
    dataExportPeriod: number; // days
  };
  serviceLevels: ServiceLevelTerm[];
  customTerms: CustomTerm[];
  complianceRequirements: ComplianceTerm[];
}

export interface ServiceLevelTerm {
  metric: string;
  target: number;
  unit: string;
  credits: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    threshold: number;
  };
  exclusions: string[];
}

export interface CustomTerm {
  id: string;
  title: string;
  description: string;
  category: 'LEGAL' | 'TECHNICAL' | 'FINANCIAL' | 'OPERATIONAL';
  mandatory: boolean;
  customerRequested: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ComplianceTerm {
  type: 'SOX' | 'GDPR' | 'CCPA' | 'HIPAA' | 'SOC2' | 'ISO27001' | 'CUSTOM';
  description: string;
  mandatory: boolean;
  implementationRequired: boolean;
  dueDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo: string;
}

export interface DealApproval {
  id: string;
  type: 'PRICING' | 'TERMS' | 'COMPLIANCE' | 'LEGAL' | 'EXECUTIVE';
  approver: string;
  approverTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: Date;
  reviewedAt?: Date;
  comments?: string;
  conditions?: string[];
  level: number; // Approval level (1, 2, 3...)
}

export interface DealNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  category: 'GENERAL' | 'PRICING' | 'TECHNICAL' | 'LEGAL' | 'COMPLIANCE';
  visibility: 'INTERNAL' | 'TEAM' | 'ALL';
  attachments: string[];
}

export interface DealActivity {
  id: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'DEMO' | 'PROPOSAL' | 'SITE_VISIT' | 'FOLLOW_UP';
  title: string;
  description: string;
  date: Date;
  duration: number; // in minutes
  participants: string[];
  outcome: string;
  nextSteps: string[];
  createdBy: string;
}

export interface CompetitorInfo {
  name: string;
  strengths: string[];
  weaknesses: string[];
  pricing: {
    estimated: number;
    currency: string;
    notes: string;
  };
  marketPosition: 'LEADER' | 'CHALLENGER' | 'FOLLOWER' | 'NICHE';
  winProbability: number;
}

export interface RiskFactor {
  id: string;
  category: 'TECHNICAL' | 'FINANCIAL' | 'LEGAL' | 'COMPETITIVE' | 'TIMING' | 'RESOURCE';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
  owner: string;
  status: 'OPEN' | 'MITIGATED' | 'CLOSED';
}

export interface DealMetrics {
  totalDeals: number;
  dealsByStatus: { [key: string]: number };
  dealsByPriority: { [key: string]: number };
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageDealSize: number;
  averageSalesCycle: number;
  winRate: number;
  conversionRate: number;
  averageDiscount: number;
  topCompetitors: { name: string; deals: number; winRate: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  periodStart: Date;
  periodEnd: Date;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  conditions: ApprovalCondition[];
  requiredApprovers: ApproverRequirement[];
  enabled: boolean;
  priority: number;
}

export interface ApprovalCondition {
  field: string;
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'BETWEEN';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ApproverRequirement {
  role: string;
  level: number;
  required: boolean;
  parallel: boolean;
}

export class DealDesk {
  private static instance: DealDesk;
  private auditLog: ImmutableAuditLogger;
  private contractEngine: ContractEngine;
  private deals: Map<string, Deal> = new Map();
  private approvalRules: Map<string, ApprovalRule> = new Map();
  private templates: Map<string, DealTemplate> = new Map();

  private constructor() {
    this.auditLog = new ImmutableAuditLogger();
    this.contractEngine = ContractEngine.getInstance();
    this.initializeApprovalRules();
    this.initializeTemplates();
  }

  public static getInstance(): DealDesk {
    if (!DealDesk.instance) {
      DealDesk.instance = new DealDesk();
    }
    return DealDesk.instance;
  }

  private initializeApprovalRules(): void {
    const rules: ApprovalRule[] = [
      {
        id: 'ENTERPRISE_PRICING',
        name: 'Enterprise Pricing Approval',
        description: 'Approval required for deals over $100,000',
        conditions: [
          { field: 'estimatedValue', operator: 'GREATER_THAN', value: 100000 }
        ],
        requiredApprovers: [
          { role: 'SALES_DIRECTOR', level: 1, required: true, parallel: false },
          { role: 'FINANCE_DIRECTOR', level: 2, required: true, parallel: false }
        ],
        enabled: true,
        priority: 1
      },
      {
        id: 'CUSTOM_TERMS',
        name: 'Custom Terms Approval',
        description: 'Approval required for deals with custom terms',
        conditions: [
          { field: 'hasCustomTerms', operator: 'EQUALS', value: true }
        ],
        requiredApprovers: [
          { role: 'LEGAL_COUNSEL', level: 1, required: true, parallel: false }
        ],
        enabled: true,
        priority: 2
      },
      {
        id: 'COMPLIANCE_RISK',
        name: 'Compliance Risk Approval',
        description: 'Approval required for high compliance risk deals',
        conditions: [
          { field: 'complianceRisk', operator: 'EQUALS', value: 'HIGH' }
        ],
        requiredApprovers: [
          { role: 'COMPLIANCE_OFFICER', level: 1, required: true, parallel: false },
          { role: 'RISK_MANAGER', level: 2, required: true, parallel: false }
        ],
        enabled: true,
        priority: 3
      }
    ];

    rules.forEach(rule => {
      this.approvalRules.set(rule.id, rule);
    });
  }

  private initializeTemplates(): void {
    // Initialize deal templates
    const templates: DealTemplate[] = [
      {
        id: 'ENTERPRISE_TEMPLATE',
        name: 'Enterprise Deal Template',
        description: 'Standard template for enterprise deals',
        dealType: 'NEW_BUSINESS',
        customerSize: 'ENTERPRISE',
        pricing: {
          basePrice: 50000,
          billingCycle: 'ANNUAL',
          contractLength: 36,
          tier: 'ENTERPRISE'
        },
        terms: {
          paymentTerms: { netDays: 30, lateFeePercentage: 1.5 },
          renewalTerms: { autoRenew: true, noticePeriod: 90, priceIncrease: { type: 'PERCENTAGE', value: 5 } },
          terminationTerms: { noticePeriod: 90, dataExportPeriod: 30 }
        },
        requirements: [
          { category: 'COMPLIANCE', description: 'SOX compliance', mandatory: true, priority: 'HIGH' }
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  public async createDeal(
    tenantId: string,
    dealName: string,
    customer: CustomerInfo,
    dealType: Deal['dealType'],
    estimatedValue: number,
    createdBy: string
  ): Promise<Deal> {
    try {
      // Generate deal ID
      const dealId = this.generateDealId();
      const dealNumber = this.generateDealNumber(tenantId);

      // Create deal
      const deal: Deal = {
        id: dealId,
        tenantId,
        dealNumber,
        dealName,
        status: 'PROSPECT',
        priority: this.calculatePriority(estimatedValue, dealType),
        dealType,
        estimatedValue,
        currency: 'USD',
        probability: this.calculateInitialProbability(dealType),
        expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        salesRep: createdBy,
        accountManager: createdBy,
        customer,
        requirements: [],
        pricing: this.getDefaultPricing(dealType, estimatedValue),
        terms: this.getDefaultTerms(),
        approvals: [],
        contracts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        notes: [],
        activities: [],
        competitors: [],
        riskFactors: []
      };

      // Store deal
      this.deals.set(dealId, deal);

      // Check if approvals are needed
      await this.checkRequiredApprovals(deal);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: createdBy,
        action: 'CREATE_DEAL',
        details: {
          dealId,
          dealName,
          dealType,
          estimatedValue
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'INFO'
      });

      return deal;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: createdBy,
        action: 'CREATE_DEAL_ERROR',
        details: {
          error: (error as Error).message,
          dealName,
          dealType
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private calculatePriority(estimatedValue: number, dealType: Deal['dealType']): Deal['priority'] {
    if (estimatedValue > 100000) return 'HIGH';
    if (estimatedValue > 50000) return 'MEDIUM';
    if (dealType === 'RENEWAL' || dealType === 'EXPANSION') return 'HIGH';
    return 'LOW';
  }

  private calculateInitialProbability(dealType: Deal['dealType']): number {
    switch (dealType) {
      case 'NEW_BUSINESS': return 25;
      case 'RENEWAL': return 75;
      case 'EXPANSION': return 50;
      case 'UPGRADE': return 60;
      case 'DOWNGRADE': return 40;
      default: return 25;
    }
  }

  private getDefaultPricing(dealType: Deal['dealType'], estimatedValue: number): DealPricing {
    const monthlyValue = estimatedValue / 12;

    return {
      basePrice: monthlyValue,
      currency: 'USD',
      billingCycle: 'MONTHLY',
      contractLength: 12,
      tier: 'PRO',
      users: 10,
      companies: 2,
      expectedUsage: [],
      discounts: [],
      overageRates: [],
      setupFee: 0,
      implementationFee: estimatedValue * 0.1,
      trainingFee: estimatedValue * 0.05,
      supportFee: monthlyValue * 0.2,
      totalContractValue: estimatedValue,
      monthlyRecurringRevenue: monthlyValue,
      annualRecurringRevenue: estimatedValue
    };
  }

  private getDefaultTerms(): DealTerms {
    return {
      paymentTerms: {
        netDays: 30,
        lateFeePercentage: 1.5
      },
      renewalTerms: {
        autoRenew: true,
        noticePeriod: 90,
        priceIncrease: {
          type: 'PERCENTAGE',
          value: 5,
          cap: 10
        }
      },
      terminationTerms: {
        noticePeriod: 90,
        dataExportPeriod: 30
      },
      serviceLevels: [],
      customTerms: [],
      complianceRequirements: []
    };
  }

  private async checkRequiredApprovals(deal: Deal): Promise<void> {
    const requiredApprovals: DealApproval[] = [];

    for (const rule of this.approvalRules.values()) {
      if (!rule.enabled) continue;

      if (this.evaluateConditions(rule.conditions, deal)) {
        for (const approver of rule.requiredApprovers) {
          const approval: DealApproval = {
            id: this.generateApprovalId(),
            type: this.getApprovalType(approver.role),
            approver: approver.role,
            approverTitle: approver.role,
            status: 'PENDING',
            requestedAt: new Date(),
            level: approver.level
          };
          requiredApprovals.push(approval);
        }
      }
    }

    deal.approvals = requiredApprovals;
  }

  private evaluateConditions(conditions: ApprovalCondition[], deal: Deal): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(deal, condition.field);
      
      switch (condition.operator) {
        case 'EQUALS':
          return fieldValue === condition.value;
        case 'GREATER_THAN':
          return Number(fieldValue) > Number(condition.value);
        case 'LESS_THAN':
          return Number(fieldValue) < Number(condition.value);
        case 'CONTAINS':
          return String(fieldValue).includes(String(condition.value));
        case 'BETWEEN':
          {
            const [min, max] = condition.value;
            return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
          }
        default:
          return false;
      }
    });
  }

  private getFieldValue(deal: Deal, field: string): any {
    switch (field) {
      case 'estimatedValue':
        return deal.estimatedValue;
      case 'hasCustomTerms':
        return deal.terms.customTerms.length > 0;
      case 'complianceRisk':
        {
          const highRiskCompliance = deal.terms.complianceRequirements
            .filter(req => req.mandatory && req.status !== 'COMPLETED');
          return highRiskCompliance.length > 0 ? 'HIGH' : 'LOW';
        }
      default:
        return null;
    }
  }

  private getApprovalType(role: string): DealApproval['type'] {
    if (role.includes('SALES')) return 'PRICING';
    if (role.includes('FINANCE')) return 'PRICING';
    if (role.includes('LEGAL')) return 'LEGAL';
    if (role.includes('COMPLIANCE')) return 'COMPLIANCE';
    if (role.includes('RISK')) return 'COMPLIANCE';
    if (role.includes('EXECUTIVE')) return 'EXECUTIVE';
    return 'PRICING';
  }

  public async updateDeal(
    dealId: string,
    updates: Partial<Deal>,
    updatedBy: string
  ): Promise<Deal> {
    try {
      const deal = this.deals.get(dealId);
      if (!deal) {
        throw new Error(`Deal ${dealId} not found`);
      }

      // Update deal
      const updatedDeal = { ...deal, ...updates, updatedAt: new Date() };
      this.deals.set(dealId, updatedDeal);

      // Recheck approvals if pricing or terms changed
      if (updates.pricing || updates.terms) {
        await this.checkRequiredApprovals(updatedDeal);
      }

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: deal.tenantId,
        userId: updatedBy,
        action: 'UPDATE_DEAL',
        details: {
          dealId,
          updates: Object.keys(updates)
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'INFO'
      });

      return updatedDeal;
    } catch (error) {
      const deal = this.deals.get(dealId);
      await this.auditLog.logOperation({
        tenantId: deal?.tenantId || 'UNKNOWN',
        userId: updatedBy,
        action: 'UPDATE_DEAL_ERROR',
        details: {
          error: (error as Error).message,
          dealId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async approveDeal(
    dealId: string,
    approvalId: string,
    approvedBy: string,
    comments?: string
  ): Promise<void> {
    try {
      const deal = this.deals.get(dealId);
      if (!deal) {
        throw new Error(`Deal ${dealId} not found`);
      }

      const approval = deal.approvals.find(a => a.id === approvalId);
      if (!approval) {
        throw new Error(`Approval ${approvalId} not found`);
      }

      // Update approval
      approval.status = 'APPROVED';
      approval.reviewedAt = new Date();
      approval.comments = comments;

      // Check if all required approvals are complete
      const pendingApprovals = deal.approvals.filter(a => a.status === 'PENDING');
      if (pendingApprovals.length === 0) {
        deal.status = 'APPROVED';
      }

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: deal.tenantId,
        userId: approvedBy,
        action: 'APPROVE_DEAL',
        details: {
          dealId,
          approvalId,
          approverRole: approval.approver,
          comments
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'INFO'
      });
    } catch (error) {
      const deal = this.deals.get(dealId);
      await this.auditLog.logOperation({
        tenantId: deal?.tenantId || 'UNKNOWN',
        userId: approvedBy,
        action: 'APPROVE_DEAL_ERROR',
        details: {
          error: (error as Error).message,
          dealId,
          approvalId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async closeDeal(
    dealId: string,
    status: 'WON' | 'LOST',
    closedBy: string,
    reason?: string,
    actualValue?: number
  ): Promise<void> {
    try {
      const deal = this.deals.get(dealId);
      if (!deal) {
        throw new Error(`Deal ${dealId} not found`);
      }

      // Update deal status
      deal.status = status;
      deal.actualCloseDate = new Date();
      
      if (actualValue) {
        deal.estimatedValue = actualValue;
      }

      // Add closing note
      const note: DealNote = {
        id: this.generateNoteId(),
        content: `Deal ${status.toLowerCase()}. ${reason || ''}`,
        author: closedBy,
        createdAt: new Date(),
        category: 'GENERAL',
        visibility: 'ALL',
        attachments: []
      };
      deal.notes.push(note);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId: deal.tenantId,
        userId: closedBy,
        action: 'CLOSE_DEAL',
        details: {
          dealId,
          status,
          reason,
          actualValue
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'INFO'
      });
    } catch (error) {
      const deal = this.deals.get(dealId);
      await this.auditLog.logOperation({
        tenantId: deal?.tenantId || 'UNKNOWN',
        userId: closedBy,
        action: 'CLOSE_DEAL_ERROR',
        details: {
          error: (error as Error).message,
          dealId,
          status
        },
        ipAddress: 'SYSTEM',
        userAgent: 'DEAL_DESK',
        timestamp: new Date(),
        category: 'SALES',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async getDeal(dealId: string): Promise<Deal | null> {
    return this.deals.get(dealId) || null;
  }

  public async getDealsByTenant(tenantId: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.tenantId === tenantId);
  }

  public async getDealsByStatus(status: Deal['status']): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.status === status);
  }

  public async getDealMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<DealMetrics> {
    const deals = Array.from(this.deals.values())
      .filter(deal => deal.createdAt >= startDate && deal.createdAt <= endDate);

    const dealsByStatus: { [key: string]: number } = {};
    const dealsByPriority: { [key: string]: number } = {};

    deals.forEach(deal => {
      dealsByStatus[deal.status] = (dealsByStatus[deal.status] || 0) + 1;
      dealsByPriority[deal.priority] = (dealsByPriority[deal.priority] || 0) + 1;
    });

    const totalPipelineValue = deals
      .filter(d => d.status !== 'LOST' && d.status !== 'CLOSED')
      .reduce((sum, d) => sum + d.estimatedValue, 0);

    const weightedPipelineValue = deals
      .filter(d => d.status !== 'LOST' && d.status !== 'CLOSED')
      .reduce((sum, d) => sum + (d.estimatedValue * d.probability / 100), 0);

    const averageDealSize = deals.length > 0 ? totalPipelineValue / deals.length : 0;

    const wonDeals = deals.filter(d => d.status === 'WON');
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    return {
      totalDeals: deals.length,
      dealsByStatus,
      dealsByPriority,
      totalPipelineValue,
      weightedPipelineValue,
      averageDealSize,
      averageSalesCycle: 45, // Placeholder
      winRate,
      conversionRate: 25, // Placeholder
      averageDiscount: 10, // Placeholder
      topCompetitors: [], // Placeholder
      revenueByMonth: [], // Placeholder
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  private generateDealId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DEAL${timestamp}${random}`;
  }

  private generateDealNumber(tenantId: string): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 99999) + 1;
    return `DL-${tenantId.toUpperCase()}-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private generateApprovalId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `APPR${timestamp}${random}`;
  }

  private generateNoteId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NOTE${timestamp}${random}`;
  }
}

interface DealTemplate {
  id: string;
  name: string;
  description: string;
  dealType: Deal['dealType'];
  customerSize: CustomerInfo['size'];
  pricing: Partial<DealPricing>;
  terms: Partial<DealTerms>;
  requirements: Partial<DealRequirement>[];
}
