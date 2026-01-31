/**
 * Payment Processor Service
 * 
 * Handles payment processing with tokenization, webhooks, and reconciliation
 * PCI-safe: No raw card data stored
 */

import { PrismaClient } from '@prisma/client';
import {
  PaymentStatus,
  PaymentType,
  ProcessPaymentRequest,
  PaymentWebhookEvent,
  PaymentProcessorConfig,
  ProcessorPaymentIntent,
} from './types';

const prisma = new PrismaClient();

/**
 * Payment Processor Service
 * Integrates with Stripe/Plaid for actual payment processing
 */
export class PaymentProcessorService {
  private config: PaymentProcessorConfig;

  constructor(config: PaymentProcessorConfig) {
    this.config = config;
  }

  /**
   * Process a payment
   */
  async processPayment(request: ProcessPaymentRequest): Promise<{
    success: boolean;
    processorId?: string;
    status: PaymentStatus;
    processingFee?: number;
    netAmount?: number;
    failureReason?: string;
  }> {
    const payment = await prisma.payment.findUnique({
      where: { id: request.paymentId },
      include: { paymentMethod: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.tenantId !== request.tenantId) {
      throw new Error('Unauthorized: Payment does not belong to tenant');
    }

    // Dry run - simulate success
    if (request.isDryRun) {
      return {
        success: true,
        status: PaymentStatus.SUCCEEDED,
        processorId: `dry_run_${Date.now()}`,
        processingFee: this.calculateProcessingFee(payment.amount),
        netAmount: payment.amount - this.calculateProcessingFee(payment.amount),
      };
    }

    try {
      // Update payment status to PROCESSING
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PROCESSING },
      });

      // Process payment with external processor
      const result = await this.processWithProcessor(payment);

      // Update payment with results
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          processorId: result.processorId,
          processorStatus: result.processorStatus,
          processorResponse: result.processorResponse,
          processingFee: result.processingFee,
          netAmount: result.netAmount,
          processedAt: new Date(),
          failureReason: result.failureReason,
        },
      });

      // Track analytics
      await this.trackPaymentAnalytics({
        tenantId: payment.tenantId,
        paymentId: payment.id,
        eventType: result.status === PaymentStatus.SUCCEEDED ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED',
        amount: payment.amount,
        processingFee: result.processingFee,
        isAutomated: payment.isAutomated,
        automationRuleId: payment.automationRuleId || undefined,
        retryCount: payment.retryCount,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update payment with failure
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: errorMessage,
        },
      });

      return {
        success: false,
        status: PaymentStatus.FAILED,
        failureReason: errorMessage,
      };
    }
  }

  /**
   * Process payment with external processor (Stripe/Plaid)
   */
  private async processWithProcessor(payment: any): Promise<{
    success: boolean;
    processorId: string;
    processorStatus: string;
    processorResponse: any;
    status: PaymentStatus;
    processingFee: number;
    netAmount: number;
    failureReason?: string;
  }> {
    // Mock implementation - replace with actual Stripe/Plaid integration
    if (this.config.provider === 'mock') {
      return this.mockProcessPayment(payment);
    }

    // Stripe integration
    if (this.config.provider === 'stripe') {
      return this.processWithStripe(payment);
    }

    // Plaid integration (ACH)
    if (this.config.provider === 'plaid') {
      return this.processWithPlaid(payment);
    }

    throw new Error(`Unsupported payment processor: ${this.config.provider}`);
  }

  /**
   * Mock payment processing for testing
   */
  private async mockProcessPayment(payment: any): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 95% success rate for testing
    const success = Math.random() > 0.05;
    const processingFee = this.calculateProcessingFee(payment.amount);

    return {
      success,
      processorId: `mock_${Date.now()}`,
      processorStatus: success ? 'succeeded' : 'failed',
      processorResponse: {
        mock: true,
        timestamp: new Date().toISOString(),
      },
      status: success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      processingFee,
      netAmount: payment.amount - processingFee,
      failureReason: success ? undefined : 'Insufficient funds (mock)',
    };
  }

  /**
   * Process with Stripe
   */
  private async processWithStripe(payment: any): Promise<any> {
    // TODO: Implement actual Stripe integration
    // const stripe = new Stripe(this.config.apiKey);
    // const paymentIntent = await stripe.paymentIntents.create({...});
    
    return this.mockProcessPayment(payment);
  }

  /**
   * Process with Plaid (ACH)
   */
  private async processWithPlaid(payment: any): Promise<any> {
    // TODO: Implement actual Plaid integration
    // const plaidClient = new PlaidApi(configuration);
    // const transfer = await plaidClient.transferCreate({...});
    
    return this.mockProcessPayment(payment);
  }

  /**
   * Handle webhook from payment processor
   */
  async handleWebhook(event: PaymentWebhookEvent): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { processorId: event.processorId },
    });

    if (!payment) {
      console.warn(`Payment not found for processor ID: ${event.processorId}`);
      return;
    }

    // Update payment status based on webhook
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: event.status,
        processingFee: event.processingFee,
        failureReason: event.failureReason,
        isDisputed: event.type === 'payment.disputed',
        disputedAt: event.type === 'payment.disputed' ? new Date() : undefined,
      },
    });

    // Track analytics
    await this.trackPaymentAnalytics({
      tenantId: payment.tenantId,
      paymentId: payment.id,
      eventType: this.mapWebhookEventType(event.type),
      amount: event.amount,
      processingFee: event.processingFee,
      isAutomated: payment.isAutomated,
      automationRuleId: payment.automationRuleId || undefined,
    });

    // If payment succeeded, trigger reconciliation
    if (event.status === PaymentStatus.SUCCEEDED) {
      await this.triggerReconciliation(payment.id, payment.tenantId);
    }
  }

  /**
   * Retry failed payment with smart backoff
   */
  async retryPayment(paymentId: string, tenantId: string): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.tenantId !== tenantId) {
      throw new Error('Payment not found or unauthorized');
    }

    if (payment.status !== PaymentStatus.FAILED) {
      throw new Error('Only failed payments can be retried');
    }

    if (payment.retryCount >= payment.maxRetries) {
      throw new Error('Maximum retry attempts reached');
    }

    // Calculate next retry time with exponential backoff
    const backoffMinutes = Math.pow(2, payment.retryCount) * 5; // 5, 10, 20 minutes
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    // Update payment for retry
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PENDING,
        retryCount: payment.retryCount + 1,
        nextRetryAt,
      },
    });

    return true;
  }

  /**
   * Calculate processing fee based on amount and plan
   */
  private calculateProcessingFee(amount: number): number {
    // Base fee: 2.9% + $0.30 (Stripe-like pricing)
    return amount * 0.029 + 0.30;
  }

  /**
   * Trigger automatic reconciliation
   */
  private async triggerReconciliation(paymentId: string, tenantId: string): Promise<void> {
    await prisma.paymentReconciliation.create({
      data: {
        paymentId,
        tenantId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Track payment analytics
   */
  private async trackPaymentAnalytics(event: {
    tenantId: string;
    paymentId: string;
    eventType: string;
    amount?: number;
    processingFee?: number;
    isAutomated: boolean;
    automationRuleId?: string;
    retryCount?: number;
  }): Promise<void> {
    await prisma.paymentAnalytics.create({
      data: {
        tenantId: event.tenantId,
        paymentId: event.paymentId,
        eventType: event.eventType,
        amount: event.amount,
        processingFee: event.processingFee,
        isAutomated: event.isAutomated,
        automationRuleId: event.automationRuleId,
        retryCount: event.retryCount,
      },
    });
  }

  /**
   * Map webhook event type to analytics event type
   */
  private mapWebhookEventType(webhookType: string): string {
    const mapping: Record<string, string> = {
      'payment.succeeded': 'PAYMENT_SUCCEEDED',
      'payment.failed': 'PAYMENT_FAILED',
      'payment.disputed': 'PAYMENT_DISPUTED',
      'payment.refunded': 'PAYMENT_REFUNDED',
    };
    return mapping[webhookType] || 'PAYMENT_UNKNOWN';
  }
}

/**
 * Get payment metrics for a tenant
 */
export async function getPaymentMetrics(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalAmount: number;
  totalFees: number;
  averageTimeToCash: number;
  successRate: number;
  automationRate: number;
  disputeRate: number;
}> {
  const whereClause: any = { tenantId };
  
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
  });

  const totalPayments = payments.length;
  const successfulPayments = payments.filter(p => p.status === PaymentStatus.SUCCEEDED).length;
  const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED).length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = payments.reduce((sum, p) => sum + (p.processingFee || 0), 0);
  const automatedPayments = payments.filter(p => p.isAutomated).length;
  const disputedPayments = payments.filter(p => p.isDisputed).length;

  // Calculate average time to cash (from creation to processed)
  const processedPayments = payments.filter(p => p.processedAt);
  const averageTimeToCash = processedPayments.length > 0
    ? processedPayments.reduce((sum, p) => {
        const timeDiff = p.processedAt!.getTime() - p.createdAt.getTime();
        return sum + timeDiff / 1000; // Convert to seconds
      }, 0) / processedPayments.length
    : 0;

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    totalAmount,
    totalFees,
    averageTimeToCash,
    successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
    automationRate: totalPayments > 0 ? (automatedPayments / totalPayments) * 100 : 0,
    disputeRate: totalPayments > 0 ? (disputedPayments / totalPayments) * 100 : 0,
  };
}

/**
 * Get cash flow impact projection
 */
export async function getCashFlowImpact(tenantId: string): Promise<{
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  scheduledPayments: number;
  pendingPayments: number;
  overdueInvoices: number;
  taxReserves: number;
}> {
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Scheduled inbound payments
  const scheduledInbound = await prisma.payment.findMany({
    where: {
      tenantId,
      type: PaymentType.INVOICE_PAYMENT,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
      scheduledFor: { gte: now, lte: next30Days },
    },
  });

  // Scheduled outbound payments
  const scheduledOutbound = await prisma.payment.findMany({
    where: {
      tenantId,
      type: { in: [PaymentType.VENDOR_PAYMENT, PaymentType.TAX_RESERVE] },
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
      scheduledFor: { gte: now, lte: next30Days },
    },
  });

  // Pending payments
  const pendingPayments = await prisma.payment.count({
    where: {
      tenantId,
      status: PaymentStatus.PENDING,
    },
  });

  // Tax reserves
  const taxReserves = await prisma.payment.aggregate({
    where: {
      tenantId,
      type: PaymentType.TAX_RESERVE,
      status: PaymentStatus.SUCCEEDED,
    },
    _sum: { amount: true },
  });

  const projectedInflow = scheduledInbound.reduce((sum, p) => sum + p.amount, 0);
  const projectedOutflow = scheduledOutbound.reduce((sum, p) => sum + p.amount, 0);

  return {
    projectedInflow,
    projectedOutflow,
    netCashFlow: projectedInflow - projectedOutflow,
    scheduledPayments: scheduledInbound.length + scheduledOutbound.length,
    pendingPayments,
    overdueInvoices: 0, // TODO: Calculate from invoices
    taxReserves: taxReserves._sum.amount || 0,
  };
}
