import { ProductTier, ProductTiersManager } from './product-tiers';
import { ImmutableAuditLog } from '../compliance/immutable-audit-log';
import { GovernanceModelManager } from '../governance/governance-model';

export interface BillingPeriod {
  id: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  billingCycle: 'MONTHLY' | 'ANNUAL';
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  billingPeriodId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  lineItems: BillingLineItem[];
  paymentMethod?: string;
  paymentDate?: Date;
  soxCompliant: boolean;
}

export interface BillingLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType: 'SEAT' | 'USAGE' | 'FEATURE' | 'OVERAGE' | 'DISCOUNT';
  tier: ProductTier;
  usageDetails?: UsageDetails;
}

export interface UsageDetails {
  metric: string;
  actualUsage: number;
  includedUsage: number;
  overageUsage: number;
  overageRate: number;
}

export interface BillingAccount {
  id: string;
  tenantId: string;
  companyName: string;
  billingEmail: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  paymentMethods: PaymentMethod[];
  billingTier: ProductTier;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  autoPayEnabled: boolean;
  creditLimit: number;
  currentBalance: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  soxCompliant: boolean;
  complianceLevel: 'BASIC' | 'STANDARD' | 'ENHANCED';
}

export interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'ACH' | 'WIRE';
  isDefault: boolean;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FAILED';
}

export interface BillingTransaction {
  id: string;
  tenantId: string;
  invoiceId?: string;
  type: 'CHARGE' | 'PAYMENT' | 'REFUND' | 'CREDIT' | 'ADJUSTMENT';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  description: string;
  transactionDate: Date;
  processedDate?: Date;
  paymentMethodId?: string;
  soxCompliant: boolean;
  auditTrail: string[];
}

export interface BillingMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerAccount: number;
  customerLifetimeValue: number;
  churnRate: number;
  expansionRevenue: number;
  contractionRevenue: number;
  netRevenueRetention: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface BillingAlert {
  id: string;
  tenantId: string;
  type: 'PAYMENT_FAILED' | 'OVERDUE' | 'USAGE_LIMIT' | 'CREDIT_LIMIT' | 'COMPLIANCE_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class BillingEngine {
  private static instance: BillingEngine;
  private auditLog: ImmutableAuditLog;
  private governanceManager: GovernanceModelManager;
  private productTiersManager: ProductTiersManager;
  private billingAccounts: Map<string, BillingAccount> = new Map();
  private billingPeriods: Map<string, BillingPeriod> = new Map();
  private invoices: Map<string, BillingInvoice> = new Map();
  private transactions: Map<string, BillingTransaction> = new Map();

  private constructor() {
    this.auditLog = ImmutableAuditLog.getInstance();
    this.governanceManager = new GovernanceModelManager();
    this.productTiersManager = ProductTiersManager.getInstance();
  }

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  public async createBillingAccount(
    tenantId: string,
    companyName: string,
    billingEmail: string,
    billingAddress: BillingAccount['billingAddress'],
    tier: ProductTier,
    billingCycle: 'MONTHLY' | 'ANNUAL',
    taxId?: string
  ): Promise<BillingAccount> {
    try {
      // Validate authority
      const hasAuthority = await this.governanceManager.hasAuthority(tenantId, 'BILLING_ADMIN');
      if (!hasAuthority) {
        throw new Error('Insufficient authority to create billing account');
      }

      // Check if billing account already exists
      if (this.billingAccounts.has(tenantId)) {
        throw new Error('Billing account already exists for tenant');
      }

      // Generate SOX-compliant account ID
      const accountId = this.generateSoxCompliantId('BA');

      const billingAccount: BillingAccount = {
        id: accountId,
        tenantId,
        companyName,
        billingEmail,
        billingAddress,
        taxId,
        paymentMethods: [],
        billingTier: tier,
        billingCycle,
        autoPayEnabled: false,
        creditLimit: this.calculateCreditLimit(tier),
        currentBalance: 0,
        status: 'ACTIVE',
        soxCompliant: tier === 'ENTERPRISE',
        complianceLevel: this.getComplianceLevel(tier)
      };

      // Store billing account
      this.billingAccounts.set(tenantId, billingAccount);

      // Create initial billing period
      await this.createBillingPeriod(tenantId, billingCycle);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'CREATE_BILLING_ACCOUNT',
        details: {
          accountId,
          companyName,
          tier,
          billingCycle
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });

      return billingAccount;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'CREATE_BILLING_ACCOUNT_ERROR',
        details: {
          error: (error as Error).message,
          companyName,
          tier
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async createBillingPeriod(
    tenantId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL'
  ): Promise<BillingPeriod> {
    try {
      const billingAccount = this.billingAccounts.get(tenantId);
      if (!billingAccount) {
        throw new Error('Billing account not found');
      }

      // Generate SOX-compliant period ID
      const periodId = this.generateSoxCompliantId('BP');

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = billingCycle === 'MONTHLY' 
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
        : new Date(now.getFullYear() + 1, now.getMonth(), 0);

      const billingPeriod: BillingPeriod = {
        id: periodId,
        tenantId,
        startDate,
        endDate,
        status: 'ACTIVE',
        billingCycle
      };

      // Store billing period
      this.billingPeriods.set(periodId, billingPeriod);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'CREATE_BILLING_PERIOD',
        details: {
          periodId,
          billingCycle,
          startDate,
          endDate
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });

      return billingPeriod;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'CREATE_BILLING_PERIOD_ERROR',
        details: {
          error: (error as Error).message,
          billingCycle
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async generateInvoice(
    tenantId: string,
    billingPeriodId: string
  ): Promise<BillingInvoice> {
    try {
      const billingAccount = this.billingAccounts.get(tenantId);
      const billingPeriod = this.billingPeriods.get(billingPeriodId);

      if (!billingAccount || !billingPeriod) {
        throw new Error('Billing account or period not found');
      }

      // Generate SOX-compliant invoice ID
      const invoiceId = this.generateSoxCompliantId('INV');
      const invoiceNumber = this.generateInvoiceNumber(tenantId);

      // Calculate billing based on tier and usage
      const lineItems = await this.calculateBillingLineItems(tenantId, billingPeriodId);
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = this.calculateTax(subtotal, billingAccount.billingAddress.country);
      const totalAmount = subtotal + taxAmount;

      const invoice: BillingInvoice = {
        id: invoiceId,
        tenantId,
        billingPeriodId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'PENDING',
        subtotal,
        taxAmount,
        totalAmount,
        currency: 'USD',
        lineItems,
        soxCompliant: billingAccount.soxCompliant
      };

      // Store invoice
      this.invoices.set(invoiceId, invoice);

      // Create billing transaction
      await this.createBillingTransaction(
        tenantId,
        invoiceId,
        'CHARGE',
        totalAmount,
        `Invoice ${invoiceNumber}`,
        invoice.lineItems
      );

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'GENERATE_INVOICE',
        details: {
          invoiceId,
          invoiceNumber,
          totalAmount,
          lineItemCount: lineItems.length
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });

      return invoice;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'GENERATE_INVOICE_ERROR',
        details: {
          error: (error as Error).message,
          billingPeriodId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  private async calculateBillingLineItems(
    tenantId: string,
    billingPeriodId: string
  ): Promise<BillingLineItem[]> {
    const billingAccount = this.billingAccounts.get(tenantId);
    if (!billingAccount) {
      throw new Error('Billing account not found');
    }

    const lineItems: BillingLineItem[] = [];
    const tier = billingAccount.billingTier;

    // Base tier pricing
    const tierPricing = this.productTiersManager.getTierPricing(tier);
    const monthlyPrice = billingAccount.billingCycle === 'MONTHLY' 
      ? tierPricing.monthly 
      : tierPricing.annual / 12;

    lineItems.push({
      id: this.generateSoxCompliantId('LI'),
      description: `${tier} Plan - ${billingAccount.billingCycle}`,
      quantity: 1,
      unitPrice: monthlyPrice,
      amount: monthlyPrice,
      itemType: 'SEAT',
      tier
    });

    // Usage-based billing (if applicable)
    // This would integrate with the usage meter
    // For now, we'll add placeholder logic

    return lineItems;
  }

  private calculateTax(amount: number, country: string): number {
    // Simplified tax calculation - in production, this would use proper tax rates
    const taxRates: { [key: string]: number } = {
      'US': 0.08, // 8% average US tax
      'CA': 0.13, // 13% Canada
      'GB': 0.20, // 20% UK VAT
      'DE': 0.19, // 19% Germany VAT
      'FR': 0.20, // 20% France VAT
    };

    const taxRate = taxRates[country] || 0.0;
    return amount * taxRate;
  }

  private calculateCreditLimit(tier: ProductTier): number {
    const limits: { [key in ProductTier]: number } = {
      'FREE': 0,
      'STARTER': 500,
      'PRO': 5000,
      'ENTERPRISE': 50000
    };
    return limits[tier];
  }

  private getComplianceLevel(tier: ProductTier): 'BASIC' | 'STANDARD' | 'ENHANCED' {
    switch (tier) {
      case 'FREE':
        return 'BASIC';
      case 'STARTER':
      case 'PRO':
        return 'STANDARD';
      case 'ENTERPRISE':
        return 'ENHANCED';
      default:
        return 'BASIC';
    }
  }

  private generateSoxCompliantId(prefix: string): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private generateInvoiceNumber(tenantId: string): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 99999) + 1;
    return `INV-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  public async createBillingTransaction(
    tenantId: string,
    invoiceId: string | undefined,
    type: BillingTransaction['type'],
    amount: number,
    description: string,
    lineItems?: BillingLineItem[]
  ): Promise<BillingTransaction> {
    try {
      // Generate SOX-compliant transaction ID
      const transactionId = this.generateSoxCompliantId('TX');

      const transaction: BillingTransaction = {
        id: transactionId,
        tenantId,
        invoiceId,
        type,
        amount,
        currency: 'USD',
        status: 'PENDING',
        description,
        transactionDate: new Date(),
        soxCompliant: this.billingAccounts.get(tenantId)?.soxCompliant || false,
        auditTrail: [description]
      };

      // Store transaction
      this.transactions.set(transactionId, transaction);

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'CREATE_BILLING_TRANSACTION',
        details: {
          transactionId,
          type,
          amount,
          description,
          invoiceId
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });

      return transaction;
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'CREATE_BILLING_TRANSACTION_ERROR',
        details: {
          error: (error as Error).message,
          type,
          amount
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }

  public async getBillingAccount(tenantId: string): Promise<BillingAccount | null> {
    return this.billingAccounts.get(tenantId) || null;
  }

  public async getInvoice(invoiceId: string): Promise<BillingInvoice | null> {
    return this.invoices.get(invoiceId) || null;
  }

  public async getBillingMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<BillingMetrics> {
    // Calculate billing metrics for the specified period
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.transactionDate >= startDate && t.transactionDate <= endDate)
      .filter(t => t.status === 'COMPLETED');

    const totalRevenue = transactions
      .filter(t => t.type === 'CHARGE')
      .reduce((sum, t) => sum + t.amount, 0);

    const payments = transactions
      .filter(t => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    const refunds = transactions
      .filter(t => t.type === 'REFUND')
      .reduce((sum, t) => sum + t.amount, 0);

    const netRevenue = totalRevenue - refunds;

    return {
      totalRevenue: netRevenue,
      monthlyRecurringRevenue: netRevenue / 12,
      annualRecurringRevenue: netRevenue,
      averageRevenuePerAccount: netRevenue / this.billingAccounts.size,
      customerLifetimeValue: netRevenue / this.billingAccounts.size * 36, // 3 year LTV assumption
      churnRate: 0.05, // 5% monthly churn assumption
      expansionRevenue: 0,
      contractionRevenue: refunds,
      netRevenueRetention: 0.95, // 95% NRR assumption
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  public async updateBillingTier(
    tenantId: string,
    newTier: ProductTier,
    effectiveDate: Date
  ): Promise<void> {
    try {
      const billingAccount = this.billingAccounts.get(tenantId);
      if (!billingAccount) {
        throw new Error('Billing account not found');
      }

      const oldTier = billingAccount.billingTier;

      // Validate tier transition
      const isValidTransition = this.productTiersManager.validateTierTransition(oldTier, newTier);
      if (!isValidTransition) {
        throw new Error(`Invalid tier transition from ${oldTier} to ${newTier}`);
      }

      // Update billing tier
      billingAccount.billingTier = newTier;
      billingAccount.creditLimit = this.calculateCreditLimit(newTier);
      billingAccount.complianceLevel = this.getComplianceLevel(newTier);
      billingAccount.soxCompliant = newTier === 'ENTERPRISE';

      // Log the operation
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'UPDATE_BILLING_TIER',
        details: {
          oldTier,
          newTier,
          effectiveDate
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'INFO'
      });
    } catch (error) {
      await this.auditLog.logOperation({
        tenantId,
        userId: 'SYSTEM',
        action: 'UPDATE_BILLING_TIER_ERROR',
        details: {
          error: (error as Error).message,
          newTier
        },
        ipAddress: 'SYSTEM',
        userAgent: 'BILLING_ENGINE',
        timestamp: new Date(),
        category: 'BILLING',
        severity: 'ERROR'
      });
      throw error;
    }
  }
}
