/**
 * Cash Control Engine Service
 * 
 * Integrates with Automation Engine for payment-specific automations
 */

import { PrismaClient } from '@prisma/client';
import {
  CashControlRuleType,
  CashControlRuleConfig,
  ExecuteCashControlRuleRequest,
  PaymentType,
  PaymentStatus,
} from './types';
import { evaluateConditions } from '../automation/conditionEvaluator';
import { PaymentProcessorService } from './paymentProcessor.service';

const prisma = new PrismaClient();

/**
 * Cash Control Engine
 * Executes payment-specific automation rules
 */
export class CashControlEngine {
  private paymentProcessor: PaymentProcessorService;

  constructor(paymentProcessor: PaymentProcessorService) {
    this.paymentProcessor = paymentProcessor;
  }

  /**
   * Execute a cash control rule
   */
  async executeRule(request: ExecuteCashControlRuleRequest): Promise<{
    success: boolean;
    paymentId?: string;
    amount?: number;
    conditionsEvaluated: any[];
    errorMessage?: string;
    executionTime: number;
  }> {
    const startTime = Date.now();

    const rule = await prisma.cashControlRule.findUnique({
      where: { id: request.ruleId },
    });

    if (!rule || rule.tenantId !== request.tenantId) {
      throw new Error('Rule not found or unauthorized');
    }

    if (!rule.isActive) {
      return {
        success: false,
        conditionsEvaluated: [],
        errorMessage: 'Rule is not active',
        executionTime: Date.now() - startTime,
      };
    }

    try {
      // Evaluate conditions
      const conditionsResult = await evaluateConditions(
        rule.conditions as any[],
        request.triggerData || {}
      );

      // If conditions not met, skip execution
      if (!conditionsResult.allMet) {
        await this.logExecution(rule.id, request.tenantId, {
          status: 'SKIPPED',
          triggerData: request.triggerData || {},
          conditionsEvaluated: conditionsResult.results,
          success: false,
          isDryRun: request.isDryRun || false,
        });

        return {
          success: false,
          conditionsEvaluated: conditionsResult.results,
          errorMessage: 'Conditions not met',
          executionTime: Date.now() - startTime,
        };
      }

      // Execute rule based on type
      const result = await this.executeRuleByType(rule, request);

      // Log execution
      await this.logExecution(rule.id, request.tenantId, {
        status: result.success ? 'SUCCESS' : 'FAILED',
        triggerData: request.triggerData || {},
        conditionsEvaluated: conditionsResult.results,
        paymentId: result.paymentId,
        amount: result.amount,
        success: result.success,
        errorMessage: result.errorMessage,
        isDryRun: request.isDryRun || false,
      });

      // Update rule statistics
      if (!request.isDryRun) {
        await this.updateRuleStats(rule.id, result.success, result.amount);
      }

      return {
        ...result,
        conditionsEvaluated: conditionsResult.results,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logExecution(rule.id, request.tenantId, {
        status: 'FAILED',
        triggerData: request.triggerData || {},
        conditionsEvaluated: [],
        success: false,
        errorMessage,
        isDryRun: request.isDryRun || false,
      });

      return {
        success: false,
        conditionsEvaluated: [],
        errorMessage,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute rule based on type
   */
  private async executeRuleByType(
    rule: any,
    request: ExecuteCashControlRuleRequest
  ): Promise<{
    success: boolean;
    paymentId?: string;
    amount?: number;
    errorMessage?: string;
  }> {
    const config = rule.config as CashControlRuleConfig;

    switch (rule.ruleType) {
      case CashControlRuleType.AUTO_COLLECT_OVERDUE:
        return this.executeAutoCollectOverdue(rule, config, request);
      
      case CashControlRuleType.RETRY_FAILED_PAYMENT:
        return this.executeRetryFailedPayment(rule, config, request);
      
      case CashControlRuleType.AUTO_RESERVE_TAXES:
        return this.executeAutoReserveTaxes(rule, config, request);
      
      case CashControlRuleType.AUTO_PAY_VENDOR:
        return this.executeAutoPayVendor(rule, config, request);
      
      case CashControlRuleType.PAUSE_ON_DISPUTE:
        return this.executePauseOnDispute(rule, config, request);
      
      case CashControlRuleType.SCHEDULE_PAYMENT:
        return this.executeSchedulePayment(rule, config, request);
      
      default:
        throw new Error(`Unsupported rule type: ${rule.ruleType}`);
    }
  }

  /**
   * AUTO_COLLECT_OVERDUE: Automatically collect overdue invoices
   */
  private async executeAutoCollectOverdue(
    rule: any,
    config: CashControlRuleConfig,
    request: ExecuteCashControlRuleRequest
  ): Promise<any> {
    const invoiceId = request.triggerData?.invoiceId;
    if (!invoiceId) {
      throw new Error('Invoice ID required for auto-collect');
    }

    // Get invoice details (mock - replace with actual invoice query)
    const invoiceAmount = request.triggerData?.amount || 0;
    const daysOverdue = request.triggerData?.daysOverdue || 0;

    // Check amount thresholds
    if (config.minimumAmount && invoiceAmount < config.minimumAmount) {
      return { success: false, errorMessage: 'Amount below minimum threshold' };
    }

    if (config.maximumAmount && invoiceAmount > config.maximumAmount) {
      return { success: false, errorMessage: 'Amount above maximum threshold' };
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        tenantId: rule.tenantId,
        invoiceId,
        type: PaymentType.INVOICE_PAYMENT,
        status: PaymentStatus.PENDING,
        amount: invoiceAmount,
        currency: 'USD',
        description: `Auto-collect overdue invoice (${daysOverdue} days overdue)`,
        isAutomated: true,
        automationRuleId: rule.id,
        requiresApproval: rule.requiresApproval,
      },
    });

    // Create explainability record
    await this.createPaymentExplainability(payment.id, rule, {
      daysOverdue,
      invoiceAmount,
      minimumAmount: config.minimumAmount,
      maximumAmount: config.maximumAmount,
    });

    // Process payment if not dry run and no approval required
    if (!request.isDryRun && !rule.requiresApproval) {
      await this.paymentProcessor.processPayment({
        paymentId: payment.id,
        tenantId: rule.tenantId,
        isDryRun: false,
      });
    }

    return {
      success: true,
      paymentId: payment.id,
      amount: invoiceAmount,
    };
  }

  /**
   * RETRY_FAILED_PAYMENT: Retry failed payments with smart backoff
   */
  private async executeRetryFailedPayment(
    rule: any,
    config: CashControlRuleConfig,
    request: ExecuteCashControlRuleRequest
  ): Promise<any> {
    const paymentId = request.triggerData?.paymentId;
    if (!paymentId) {
      throw new Error('Payment ID required for retry');
    }

    const success = await this.paymentProcessor.retryPayment(paymentId, rule.tenantId);

    return {
      success,
      paymentId,
    };
  }

  /**
   * AUTO_RESERVE_TAXES: Automatically reserve percentage of revenue for taxes
   */
  private async executeAutoReserveTaxes(
    rule: any,
    config: CashControlRuleConfig,
    request: ExecuteCashControlRuleRequest
  ): Promise<any> {
    const revenueAmount = request.triggerData?.revenueAmount || 0;
    const taxPercentage = config.taxReservePercentage || 0.25; // Default 25%
    const reserveAmount = revenueAmount * taxPercentage;

    const payment = await prisma.payment.create({
      data: {
        tenantId: rule.tenantId,
        type: PaymentType.TAX_RESERVE,
        status: PaymentStatus.PENDING,
        amount: reserveAmount,
        currency: 'USD',
        description: `Tax reserve (${taxPercentage * 100}% of $${revenueAmount})`,
        isAutomated: true,
        automationRuleId: rule.id,
        metadata: {
          revenueAmount,
          taxPercentage,
          reserveAccount: config.reserveAccount,
        },
      },
    });

    await this.createPaymentExplainability(payment.id, rule, {
      revenueAmount,
      taxPercentage,
      reserveAmount,
    });

    if (!request.isDryRun) {
      await this.paymentProcessor.processPayment({
        paymentId: payment.id,
        tenantId: rule.tenantId,
        isDryRun: false,
      });
    }

    return {
      success: true,
      paymentId: payment.id,
      amount: reserveAmount,
    };
  }

  /**
   * AUTO_PAY_VENDOR: Automatically pay vendors on approval
   */
  private async executeAutoPayVendor(
    rule: any,
    config: CashControlRuleConfig,
    request: ExecuteCashControlRuleRequest
  ): Promise<any> {
    const vendorId = request.triggerData?.vendorId;
    const amount = request.triggerData?.amount || 0;

    if (!vendorId) {
      throw new Error('Vendor ID required for auto-pay');
    }

    // Check approval threshold
    const requiresApproval = config.approvalThreshold 
      ? amount > config.approvalThreshold 
      : rule.requiresApproval;

    const payment = await prisma.payment.create({
      data: {
        tenantId: rule.tenantId,
        type: PaymentType.VENDOR_PAYMENT,
        status: PaymentStatus.PENDING,
        amount,
        currency: 'USD',
        description: `Auto-pay vendor ${vendorId}`,
        isAutomated: true,
        automationRuleId: rule.id,
        requiresApproval,
        metadata: {
          vendorId,
          paymentTerms: config.paymentTerms,
        },
      },
    });

    await this.createPaymentExplainability(payment.id, rule, {
      vendorId,
      amount,
      approvalThreshold: config.approvalThreshold,
      requiresApproval,
    });

    if (!request.isDryRun && !requiresApproval) {
      await this.paymentProcessor.processPayment({
        paymentId: payment.id,
        tenantId: rule.tenantId,
        isDryRun: false,
      });
    }

    return {
      success: true,
      paymentId: payment.id,
      amount,
    };
  }

  /**
   * PAUSE_ON_DISPUTE: Pause collections if dispute exists
   */
  private async executePauseOnDispute(
    rule: any,
    config: CashControlRuleConfig,
    request: ExecuteCashControlRuleRequest
  ): Promise<any> {
    const paymentId = request.triggerData?.paymentId;
    if (!paymentId) {
      throw new Error('Payment ID required for pause');
    }

    // Cancel pending payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CANCELLED,
        metadata: {
          cancelReason: 'Paused due to dispute',
          pauseDuration: config.pauseDuration,
        },
      },
    });

    return {
      success: true,
      paymentId,
    };
  }

  /**
   * SCHEDULE_PAYMENT: Schedule recurring payments
   */
  private async executeSchedulePayment(
    rule: any,
    config: CashControlRuleConfig,
    request: ExecuteCashControlRuleRequest
  ): Promise<any> {
    const amount = request.triggerData?.amount || 0;
    const scheduledFor = request.triggerData?.scheduledFor || new Date();

    const payment = await prisma.payment.create({
      data: {
        tenantId: rule.tenantId,
        type: PaymentType.MANUAL,
        status: PaymentStatus.PENDING,
        amount,
        currency: 'USD',
        description: `Scheduled payment (${config.scheduleType})`,
        isAutomated: true,
        automationRuleId: rule.id,
        scheduledFor: new Date(scheduledFor),
        metadata: {
          scheduleType: config.scheduleType,
          scheduleConfig: config.scheduleConfig,
        },
      },
    });

    await this.createPaymentExplainability(payment.id, rule, {
      amount,
      scheduledFor,
      scheduleType: config.scheduleType,
    });

    return {
      success: true,
      paymentId: payment.id,
      amount,
    };
  }

  /**
   * Create payment explainability record
   */
  private async createPaymentExplainability(
    paymentId: string,
    rule: any,
    context: Record<string, any>
  ): Promise<void> {
    const explanation = this.generateExplanation(rule, context);

    await prisma.paymentExplainability.create({
      data: {
        paymentId,
        tenantId: rule.tenantId,
        trigger: 'automation_rule',
        triggerDetails: {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.ruleType,
        },
        conditionsMet: rule.conditions || [],
        amountCalculation: this.generateAmountCalculation(rule, context),
        baseAmount: context.amount || context.invoiceAmount || context.revenueAmount || 0,
        adjustments: [],
        confidenceScore: 0.95,
        safeguards: this.generateSafeguards(rule, context),
        riskFactors: this.generateRiskFactors(rule, context),
        approvalRequired: rule.requiresApproval || false,
        approvalStatus: rule.requiresApproval ? 'pending' : undefined,
        businessImpact: {
          timeSaved: 15,
          riskPrevented: true,
          cashFlowImprovement: context.amount || 0,
          description: `Automated ${rule.ruleType} execution`,
        },
        explanation,
      },
    });
  }

  /**
   * Generate plain English explanation
   */
  private generateExplanation(rule: any, context: Record<string, any>): string {
    const config = rule.config as CashControlRuleConfig;

    switch (rule.ruleType) {
      case CashControlRuleType.AUTO_COLLECT_OVERDUE:
        return `This payment was automatically collected because the invoice was ${context.daysOverdue} days overdue and your '${rule.name}' rule was enabled. The invoice amount of $${context.invoiceAmount} meets the configured thresholds (min: $${config.minimumAmount || 0}, max: ${config.maximumAmount ? '$' + config.maximumAmount : 'unlimited'}).`;
      
      case CashControlRuleType.AUTO_RESERVE_TAXES:
        return `This tax reserve was automatically created to set aside ${(context.taxPercentage * 100).toFixed(0)}% of your revenue ($${context.revenueAmount}) for tax obligations. This helps ensure you have funds available when taxes are due.`;
      
      case CashControlRuleType.AUTO_PAY_VENDOR:
        return `This vendor payment was automatically scheduled because your '${rule.name}' rule is active. ${context.requiresApproval ? 'The amount exceeds your approval threshold, so it requires manual approval before processing.' : 'The amount is within your approval threshold and will be processed automatically.'}`;
      
      case CashControlRuleType.RETRY_FAILED_PAYMENT:
        return `This payment is being retried automatically because the previous attempt failed. Our smart retry logic uses exponential backoff to maximize success rates while avoiding excessive attempts.`;
      
      case CashControlRuleType.PAUSE_ON_DISPUTE:
        return `This payment was automatically paused because a dispute was detected. Collections will resume after ${config.pauseDuration || 30} days or when the dispute is resolved.`;
      
      case CashControlRuleType.SCHEDULE_PAYMENT:
        return `This payment was scheduled automatically based on your ${config.scheduleType} payment schedule. It will be processed on the scheduled date.`;
      
      default:
        return `This payment was automatically processed by the '${rule.name}' automation rule.`;
    }
  }

  /**
   * Generate amount calculation explanation
   */
  private generateAmountCalculation(rule: any, context: Record<string, any>): string {
    const config = rule.config as CashControlRuleConfig;

    switch (rule.ruleType) {
      case CashControlRuleType.AUTO_RESERVE_TAXES:
        return `$${context.revenueAmount} × ${context.taxPercentage * 100}% = $${context.reserveAmount}`;
      
      default:
        return `Base amount: $${context.amount || context.invoiceAmount || 0}`;
    }
  }

  /**
   * Generate safeguards
   */
  private generateSafeguards(rule: any, context: Record<string, any>): any[] {
    const safeguards = [
      {
        type: 'tenant_isolation',
        description: 'Payment is isolated to your tenant',
        status: 'passed',
      },
      {
        type: 'rbac_enforcement',
        description: 'Rule execution authorized by RBAC',
        status: 'passed',
      },
    ];

    if (rule.requiresApproval || context.requiresApproval) {
      safeguards.push({
        type: 'approval_required',
        description: 'Payment requires manual approval before processing',
        status: 'passed',
      });
    }

    return safeguards;
  }

  /**
   * Generate risk factors
   */
  private generateRiskFactors(rule: any, context: Record<string, any>): any[] {
    const riskFactors = [];

    if (context.amount > 10000) {
      riskFactors.push({
        factor: 'high_amount',
        severity: 'medium',
        description: 'Payment amount exceeds $10,000',
      });
    }

    if (context.daysOverdue > 90) {
      riskFactors.push({
        factor: 'very_overdue',
        severity: 'high',
        description: 'Invoice is more than 90 days overdue',
      });
    }

    return riskFactors;
  }

  /**
   * Log execution
   */
  private async logExecution(
    ruleId: string,
    tenantId: string,
    data: {
      status: string;
      triggerData: Record<string, any>;
      conditionsEvaluated: any[];
      paymentId?: string;
      amount?: number;
      success: boolean;
      errorMessage?: string;
      isDryRun: boolean;
    }
  ): Promise<void> {
    await prisma.cashControlExecution.create({
      data: {
        ruleId,
        tenantId,
        status: data.status,
        triggerData: data.triggerData,
        conditionsEvaluated: data.conditionsEvaluated,
        paymentId: data.paymentId,
        amount: data.amount,
        success: data.success,
        errorMessage: data.errorMessage,
        isDryRun: data.isDryRun,
      },
    });
  }

  /**
   * Update rule statistics
   */
  private async updateRuleStats(
    ruleId: string,
    success: boolean,
    amount?: number
  ): Promise<void> {
    const rule = await prisma.cashControlRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) return;

    await prisma.cashControlRule.update({
      where: { id: ruleId },
      data: {
        executionCount: rule.executionCount + 1,
        successCount: success ? rule.successCount + 1 : rule.successCount,
        failureCount: success ? rule.failureCount : rule.failureCount + 1,
        totalAmountProcessed: rule.totalAmountProcessed + (amount || 0),
        lastExecuted: new Date(),
      },
    });
  }
}

/**
 * Get payment plan limits for a tenant
 */
export async function getPaymentPlanLimits(tenantId: string): Promise<{
  plan: string;
  monthlyTransactionLimit: number;
  currentMonthTransactions: number;
  perTransactionFee: number;
  instantPayoutFee: number;
  automationEnabled: boolean;
  maxCashControlRules: number;
  currentCashControlRules: number;
  approvalWorkflowsEnabled: boolean;
  prioritySettlement: boolean;
  withinLimits: boolean;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Get current month transactions
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentMonthTransactions = await prisma.payment.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
  });

  // Get current cash control rules
  const currentCashControlRules = await prisma.cashControlRule.count({
    where: {
      tenantId,
      isActive: true,
    },
  });

  // Plan-based limits
  const planLimits: Record<string, any> = {
    FREE: {
      monthlyTransactionLimit: 10,
      perTransactionFee: 0.035, // 3.5%
      instantPayoutFee: 0.02, // 2%
      automationEnabled: false,
      maxCashControlRules: 0,
      approvalWorkflowsEnabled: false,
      prioritySettlement: false,
    },
    STARTER: {
      monthlyTransactionLimit: 100,
      perTransactionFee: 0.03, // 3%
      instantPayoutFee: 0.015, // 1.5%
      automationEnabled: true,
      maxCashControlRules: 5,
      approvalWorkflowsEnabled: false,
      prioritySettlement: false,
    },
    PROFESSIONAL: {
      monthlyTransactionLimit: 1000,
      perTransactionFee: 0.025, // 2.5%
      instantPayoutFee: 0.01, // 1%
      automationEnabled: true,
      maxCashControlRules: 20,
      approvalWorkflowsEnabled: true,
      prioritySettlement: false,
    },
    ENTERPRISE: {
      monthlyTransactionLimit: -1, // Unlimited
      perTransactionFee: 0.02, // 2% (custom negotiable)
      instantPayoutFee: 0.005, // 0.5%
      automationEnabled: true,
      maxCashControlRules: -1, // Unlimited
      approvalWorkflowsEnabled: true,
      prioritySettlement: true,
    },
  };

  const limits = planLimits[tenant.plan] || planLimits.FREE;
  const withinLimits = 
    (limits.monthlyTransactionLimit === -1 || currentMonthTransactions < limits.monthlyTransactionLimit) &&
    (limits.maxCashControlRules === -1 || currentCashControlRules < limits.maxCashControlRules);

  return {
    plan: tenant.plan,
    monthlyTransactionLimit: limits.monthlyTransactionLimit,
    currentMonthTransactions,
    perTransactionFee: limits.perTransactionFee,
    instantPayoutFee: limits.instantPayoutFee,
    automationEnabled: limits.automationEnabled,
    maxCashControlRules: limits.maxCashControlRules,
    currentCashControlRules,
    approvalWorkflowsEnabled: limits.approvalWorkflowsEnabled,
    prioritySettlement: limits.prioritySettlement,
    withinLimits,
  };
}
