import Stripe from 'stripe';
import { logger } from '../utils/logger';

// Initialize Stripe with API key from environment
let stripe: Stripe | null = null;

// Only initialize Stripe if we have an API key and we're not in development mode
if (process.env.NODE_ENV !== 'development' && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  });
  logger.info('Stripe initialized in production mode');
} else if (process.env.NODE_ENV === 'development') {
  logger.warn('Stripe is running in development mode - payments will be mocked');
}

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

export class StripeService {
  // Check if Stripe is initialized
  private ensureStripeInitialized(): Stripe {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Make sure STRIPE_SECRET_KEY is set in production.');
    }
    return stripe;
  }

  // Customer Management
  async createCustomer(data: {
    email?: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_SECRET_KEY) {
      // Return a mock customer in development
      return {
        id: 'cus_mock_' + Math.random().toString(36).substring(2, 11),
        email: data.email,
        name: data.name,
        metadata: data.metadata,
      };
    }

    const stripe = this.ensureStripeInitialized();
    try {
      const customer = await stripe.customers.create(data);
      logger.info(`Stripe customer created: ${customer.id}`);
      return {
        id: customer.id,
        email: customer.email || undefined,
        name: customer.name || undefined,
        metadata: customer.metadata || undefined,
      };
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error(`Stripe customer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_SECRET_KEY) {
      // Return null in development
      return null;
    }

    const stripe = this.ensureStripeInitialized();
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) return null;

      return {
        id: customer.id,
        email: customer.email || undefined,
        name: customer.name || undefined,
        metadata: customer.metadata || undefined,
      };
    } catch (error) {
      logger.error(`Failed to retrieve Stripe customer ${customerId}:`, error);
      return null;
    }
  }

  // Payment Intent Management
  async createPaymentIntent(data: {
    amount: number; // in cents
    currency?: string;
    customerId?: string;
    metadata?: Record<string, string>;
    description?: string;
    receipt_email?: string;
  }): Promise<StripePaymentIntent> {
    if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_SECRET_KEY) {
      // Return a mock payment intent in development
      return {
        id: 'pi_mock_' + Math.random().toString(36).substring(2, 15),
        client_secret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 22),
        amount: data.amount,
        currency: data.currency || 'usd',
        status: 'succeeded',
        metadata: data.metadata || {},
      };
    }

    const stripe = this.ensureStripeInitialized();
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency || 'usd',
        customer: data.customerId,
        metadata: data.metadata || {},
        description: data.description,
        receipt_email: data.receipt_email,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);
      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret || '',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata || {},
      };
    } catch (error) {
      logger.error('Failed to create Stripe payment intent:', error);
      throw new Error(`Payment intent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret || '',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata || {},
      };
    } catch (error) {
      logger.error(`Failed to retrieve Stripe payment intent ${paymentIntentId}:`, error);
      return null;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret || '',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata || {},
      };
    } catch (error) {
      logger.error(`Failed to confirm Stripe payment intent ${paymentIntentId}:`, error);
      throw new Error(`Payment confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Invoice Integration
  async createInvoice(data: {
    customerId: string;
    amount: number; // in cents
    currency?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; invoice_pdf?: string; hosted_invoice_url?: string }> {
    try {
      const invoice = await stripe.invoices.create({
        customer: data.customerId,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: data.metadata || {},
      });

      // Add invoice item
      await stripe.invoiceItems.create({
        customer: data.customerId,
        invoice: invoice.id,
        amount: data.amount,
        currency: data.currency || 'usd',
        description: data.description || 'Invoice payment',
      });

      // Finalize the invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

      logger.info(`Stripe invoice created: ${finalizedInvoice.id}`);
      return {
        id: finalizedInvoice.id,
        invoice_pdf: finalizedInvoice.invoice_pdf || undefined,
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url || undefined,
      };
    } catch (error) {
      logger.error('Failed to create Stripe invoice:', error);
      throw new Error(`Invoice creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendInvoice(invoiceId: string): Promise<void> {
    try {
      await stripe.invoices.sendInvoice(invoiceId);
      logger.info(`Stripe invoice sent: ${invoiceId}`);
    } catch (error) {
      logger.error(`Failed to send Stripe invoice ${invoiceId}:`, error);
      throw new Error(`Invoice sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Webhook handling
  async constructEvent(payload: Buffer, signature: string, webhookSecret: string): Promise<StripeWebhookEvent> {
    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      logger.error('Failed to construct webhook event:', error);
      throw new Error(`Webhook event construction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleWebhookEvent(event: StripeWebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Failed to handle webhook event:', error);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    logger.info(`Payment intent succeeded: ${paymentIntent.id}`);
    // Implementation would:
    // 1. Update payment status in database
    // 2. Update invoice status if applicable
    // 3. Send confirmation notifications
    // 4. Trigger reconciliation processes
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    logger.warn(`Payment intent failed: ${paymentIntent.id}`);
    // Implementation would:
    // 1. Update payment status to failed
    // 2. Send failure notifications
    // 3. Log failure reasons for analysis
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
    // Implementation would:
    // 1. Update invoice status to paid
    // 2. Update customer balance
    // 3. Record payment transaction
    // 4. Send receipt notifications
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    logger.warn(`Invoice payment failed: ${invoice.id}`);
    // Implementation would:
    // 1. Update invoice status to overdue
    // 2. Send payment reminder notifications
    // 3. Apply late fees if applicable
  }

  private async handleCustomerCreated(customer: any): Promise<void> {
    logger.info(`Customer created: ${customer.id}`);
    // Implementation would:
    // 1. Sync customer data with internal database
    // 2. Set up customer-specific configurations
  }

  // Utility methods
  async getBalance(): Promise<{ available: number; pending: number }> {
    try {
      const balance = await stripe.balance.retrieve();
      return {
        available: balance.available.reduce((sum: number, item: any) => sum + item.amount, 0),
        pending: balance.pending.reduce((sum: number, item: any) => sum + item.amount, 0),
      };
    } catch (error) {
      logger.error('Failed to retrieve Stripe balance:', error);
      throw new Error(`Balance retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<void> {
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // in cents, if not provided refunds full amount
      });
      logger.info(`Refund created for payment intent: ${paymentIntentId}`);
    } catch (error) {
      logger.error(`Failed to refund payment intent ${paymentIntentId}:`, error);
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; error?: string }> {
    try {
      await stripe.balance.retrieve();
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
