/**
 * Embedded Payments & Cash Control Engine - Type Definitions
 */

export enum PaymentMethodType {
  ACH = 'ACH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
}

export enum PaymentType {
  INVOICE_PAYMENT = 'INVOICE_PAYMENT',
  VENDOR_PAYMENT = 'VENDOR_PAYMENT',
  TAX_RESERVE = 'TAX_RESERVE',
  REFUND = 'REFUND',
  MANUAL = 'MANUAL',
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
}

export enum CashControlRuleType {
  AUTO_COLLECT_OVERDUE = 'AUTO_COLLECT_OVERDUE',
  RETRY_FAILED_PAYMENT = 'RETRY_FAILED_PAYMENT',
  AUTO_RESERVE_TAXES = 'AUTO_RESERVE_TAXES',
  AUTO_PAY_VENDOR = 'AUTO_PAY_VENDOR',
  PAUSE_ON_DISPUTE = 'PAUSE_ON_DISPUTE',
  SCHEDULE_PAYMENT = 'SCHEDULE_PAYMENT',
}

export interface PaymentMethodConfig {
  type: PaymentMethodType;
  customerId?: string;
  isDefault?: boolean;
  nickname?: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface CreatePaymentMethodRequest {
  tenantId: string;
  config: PaymentMethodConfig;
  token: string; // From payment processor (Stripe/Plaid)
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  accountType?: string;
  routingNumber?: string;
}

export interface PaymentMethodResponse {
  id: string;
  tenantId: string;
  customerId?: string;
  type: PaymentMethodType;
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  nickname?: string;
  isActive: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface CreatePaymentRequest {
  tenantId: string;
  paymentMethodId?: string;
  invoiceId?: string;
  type: PaymentType;
  amount: number;
  currency?: string;
  description?: string;
  scheduledFor?: Date;
  requiresApproval?: boolean;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  tenantId: string;
  isDryRun?: boolean;
}

export interface PaymentResponse {
  id: string;
  tenantId: string;
  paymentMethodId?: string;
  invoiceId?: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  description?: string;
  processorId?: string;
  isAutomated: boolean;
  scheduledFor?: Date;
  processedAt?: Date;
  retryCount: number;
  processingFee?: number;
  netAmount?: number;
  isDisputed: boolean;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentWebhookEvent {
  type: 'payment.succeeded' | 'payment.failed' | 'payment.disputed' | 'payment.refunded';
  paymentId: string;
  processorId: string;
  status: PaymentStatus;
  amount: number;
  processingFee?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentExplainabilityData {
  trigger: 'automation_rule' | 'manual' | 'scheduled';
  triggerDetails: {
    ruleId?: string;
    ruleName?: string;
    userId?: string;
    userName?: string;
    scheduleConfig?: Record<string, any>;
  };
  conditionsMet: Array<{
    condition: string;
    result: boolean;
    explanation: string;
  }>;
  amountCalculation: string;
  baseAmount: number;
  adjustments: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  confidenceScore: number;
  safeguards: Array<{
    type: string;
    description: string;
    status: 'passed' | 'failed';
  }>;
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  approvalRequired: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  businessImpact: {
    timeSaved?: number; // minutes
    riskPrevented?: boolean;
    cashFlowImprovement?: number;
    description: string;
  };
  explanation: string;
}

export interface CashControlRuleConfig {
  // AUTO_COLLECT_OVERDUE
  daysOverdue?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  
  // RETRY_FAILED_PAYMENT
  maxRetries?: number;
  retryDelayMinutes?: number;
  backoffMultiplier?: number;
  
  // AUTO_RESERVE_TAXES
  taxReservePercentage?: number;
  reserveAccount?: string;
  
  // AUTO_PAY_VENDOR
  vendorId?: string;
  paymentTerms?: number; // days
  approvalThreshold?: number;
  
  // PAUSE_ON_DISPUTE
  pauseDuration?: number; // days
  
  // SCHEDULE_PAYMENT
  scheduleType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduleConfig?: Record<string, any>;
}

export interface CreateCashControlRuleRequest {
  tenantId: string;
  name: string;
  description?: string;
  ruleType: CashControlRuleType;
  config: CashControlRuleConfig;
  conditions?: any[];
  requiresApproval?: boolean;
}

export interface CashControlRuleResponse {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  ruleType: CashControlRuleType;
  config: CashControlRuleConfig;
  conditions: any[];
  isActive: boolean;
  requiresApproval: boolean;
  executionCount: number;
  successCount: number;
  failureCount: number;
  totalAmountProcessed: number;
  createdBy: string;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecuteCashControlRuleRequest {
  ruleId: string;
  tenantId: string;
  triggerData?: Record<string, any>;
  isDryRun?: boolean;
}

export interface CashControlExecutionResponse {
  id: string;
  ruleId: string;
  tenantId: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  triggerData: Record<string, any>;
  conditionsEvaluated: any[];
  paymentId?: string;
  amount?: number;
  success: boolean;
  errorMessage?: string;
  executionTime?: number;
  isDryRun: boolean;
  createdAt: Date;
}

export interface PaymentReconciliationRequest {
  paymentId: string;
  tenantId: string;
  ledgerEntryId?: string;
  accountId?: string;
  notes?: string;
}

export interface PaymentReconciliationResponse {
  id: string;
  paymentId: string;
  tenantId: string;
  status: ReconciliationStatus;
  ledgerEntryId?: string;
  accountId?: string;
  matchedAmount?: number;
  variance?: number;
  varianceReason?: string;
  reconciledBy?: string;
  reconciledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentAnalyticsEvent {
  tenantId: string;
  paymentId?: string;
  eventType: 'PAYMENT_INITIATED' | 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED' | 'PAYMENT_DISPUTED';
  amount?: number;
  processingFee?: number;
  isAutomated: boolean;
  automationRuleId?: string;
  timeToCash?: number;
  retryCount?: number;
  revenueImpact?: number;
}

export interface PaymentMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmount: number;
  totalFees: number;
  averageTimeToCash: number; // seconds
  successRate: number;
  automationRate: number;
  disputeRate: number;
}

export interface CashFlowImpact {
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  scheduledPayments: number;
  pendingPayments: number;
  overdueInvoices: number;
  taxReserves: number;
}

// Plan-based limits
export interface PaymentPlanLimits {
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  monthlyTransactionLimit: number;
  currentMonthTransactions: number;
  perTransactionFee: number; // percentage
  instantPayoutFee: number; // percentage
  automationEnabled: boolean;
  maxCashControlRules: number;
  currentCashControlRules: number;
  approvalWorkflowsEnabled: boolean;
  prioritySettlement: boolean;
  withinLimits: boolean;
}

// Processor integration types
export interface PaymentProcessorConfig {
  provider: 'stripe' | 'plaid' | 'mock';
  apiKey: string;
  webhookSecret: string;
  environment: 'test' | 'production';
}

export interface ProcessorPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}
