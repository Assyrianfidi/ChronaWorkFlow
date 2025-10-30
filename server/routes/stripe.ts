import { Request, Response } from 'express';
import { stripeService, StripeWebhookEvent } from '../integrations/stripe';
import { logger } from '../utils/logger';

// Stripe webhook endpoint
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const body = req.body;

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: StripeWebhookEvent;

    try {
      event = await stripeService.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    logger.info(`Webhook received: ${event.type} (${event.id})`);

    // Process the webhook event
    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Create payment intent for invoice payment
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency = 'usd', customerId, description, receiptEmail } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = await stripeService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customerId,
      description,
      receipt_email: receiptEmail,
    });

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (error) {
    logger.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}

// Create Stripe invoice for customer
export async function createStripeInvoice(req: Request, res: Response) {
  try {
    const { customerId, amount, currency = 'usd', description } = req.body;

    if (!customerId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'customerId and valid amount are required' });
    }

    const invoice = await stripeService.createInvoice({
      customerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
    });

    res.json({
      invoiceId: invoice.id,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    });
  } catch (error) {
    logger.error('Stripe invoice creation failed:', error);
    res.status(500).json({ error: 'Failed to create Stripe invoice' });
  }
}

// Send invoice to customer
export async function sendInvoice(req: Request, res: Response) {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ error: 'invoiceId is required' });
    }

    await stripeService.sendInvoice(invoiceId);

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    logger.error('Invoice sending failed:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
}

// Get payment intent status
export async function getPaymentIntent(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    res.json(paymentIntent);
  } catch (error) {
    logger.error('Payment intent retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve payment intent' });
  }
}

// Process refund
export async function refundPayment(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.params;
    const { amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    await stripeService.refundPayment(paymentIntentId, amount ? Math.round(amount * 100) : undefined);

    res.json({ message: 'Refund processed successfully' });
  } catch (error) {
    logger.error('Refund processing failed:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
}

// Get Stripe balance
export async function getBalance(req: Request, res: Response) {
  try {
    // Get the connected account balance (for platform)
    const balance = await stripeService.getBalance();

    res.json({
      available: balance.available / 100, // Convert from cents
      pending: balance.pending / 100,
    });
  } catch (error) {
    logger.error('Balance retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve balance' });
  }
}

// Health check for Stripe integration
export async function stripeHealthCheck(req: Request, res: Response) {
  try {
    const health = await stripeService.healthCheck();

    if (health.status === 'healthy') {
      res.json({ status: 'healthy', message: 'Stripe integration is working correctly' });
    } else {
      res.status(503).json({ status: 'unhealthy', error: health.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Health check failed' });
  }
}
