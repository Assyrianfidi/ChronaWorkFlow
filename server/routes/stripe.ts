import { Request, Response } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';

import { stripeService, StripeWebhookEvent } from '../integrations/stripe';
import { logger } from '../utils/logger';
import { db } from '../db';
import * as s from '../../shared/schema';
import { storage } from '../storage';

function toDateFromUnixSeconds(value?: number | null): Date | null {
  if (!value) return null;
  return new Date(value * 1000);
}

function mapStripeSubscriptionStatus(status: string): 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused' {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'paused':
      return 'paused';
    default:
      return 'active';
  }
}

function mapStripeInvoiceStatus(status: string | null | undefined): 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'open':
      return 'open';
    case 'paid':
      return 'paid';
    case 'uncollectible':
      return 'uncollectible';
    case 'void':
      return 'void';
    default:
      return 'open';
  }
}

function mapStripePaymentIntentStatus(status: string | null | undefined):
  'requires_payment_method' | 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'canceled' {
  switch (status) {
    case 'requires_payment_method':
      return 'requires_payment_method';
    case 'requires_action':
      return 'requires_action';
    case 'processing':
      return 'processing';
    case 'succeeded':
      return 'succeeded';
    case 'canceled':
      return 'canceled';
    default:
      return 'failed';
  }
}

async function findCompanyByStripeCustomerId(customerId: string): Promise<s.Company | null> {
  const [company] = await db
    .select()
    .from(s.companies)
    .where(eq(s.companies.stripeCustomerId, customerId));
  return company ?? null;
}

async function resolvePlanIdFromStripeSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const item = sub.items?.data?.[0];
  const priceId = (item?.price as any)?.id as string | undefined;
  if (!priceId) return null;

  const [plan] = await db
    .select()
    .from(s.plans)
    .where(and(eq(s.plans.stripePriceId, priceId), sql`${s.plans.deletedAt} is null`));
  return plan?.id ?? null;
}

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription, companyId: string): Promise<s.Subscription> {
  const planId = (await resolvePlanIdFromStripeSubscription(sub)) || null;
  if (!planId) {
    throw new Error(`No plan found for Stripe price on subscription ${sub.id}`);
  }

  const nextStatus = mapStripeSubscriptionStatus(sub.status);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(s.subscriptions)
    .where(eq(s.subscriptions.stripeSubscriptionId, sub.id));

  const pastDueSince =
    nextStatus === 'past_due'
      ? existing?.pastDueSince ?? now
      : null;

  const suspendedAt =
    nextStatus === 'past_due' && pastDueSince
      ? existing?.suspendedAt ?? null
      : null;

  if (!existing) {
    const [created] = await db
      .insert(s.subscriptions)
      .values({
        companyId,
        planId,
        status: nextStatus,
        stripeCustomerId: String(sub.customer ?? ''),
        stripeSubscriptionId: sub.id,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        currentPeriodStart: toDateFromUnixSeconds((sub as any).current_period_start) ?? undefined,
        currentPeriodEnd: toDateFromUnixSeconds((sub as any).current_period_end) ?? undefined,
        trialStart: toDateFromUnixSeconds((sub as any).trial_start) ?? undefined,
        trialEnd: toDateFromUnixSeconds((sub as any).trial_end) ?? undefined,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
        pastDueSince,
        suspendedAt,
        ownerGrantedFree: false,
        ownerNotes: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  }

  const [updated] = await db
    .update(s.subscriptions)
    .set({
      companyId,
      planId,
      status: nextStatus,
      stripeCustomerId: String(sub.customer ?? ''),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      currentPeriodStart: toDateFromUnixSeconds((sub as any).current_period_start) ?? undefined,
      currentPeriodEnd: toDateFromUnixSeconds((sub as any).current_period_end) ?? undefined,
      trialStart: toDateFromUnixSeconds((sub as any).trial_start) ?? undefined,
      trialEnd: toDateFromUnixSeconds((sub as any).trial_end) ?? undefined,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      pastDueSince,
      suspendedAt,
      updatedAt: now,
    })
    .where(eq(s.subscriptions.id, existing.id))
    .returning();

  return updated;
}

async function upsertInvoiceFromStripe(invoice: Stripe.Invoice, companyId: string, subscriptionId?: string | null): Promise<s.BillingInvoice> {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(s.billingInvoices)
    .where(eq(s.billingInvoices.stripeInvoiceId, invoice.id));

  const values = {
    companyId,
    subscriptionId: subscriptionId ?? null,
    stripeInvoiceId: invoice.id,
    status: mapStripeInvoiceStatus(invoice.status),
    currency: (invoice.currency ?? 'usd').toUpperCase(),
    amountDueCents: invoice.amount_due ?? 0,
    amountPaidCents: invoice.amount_paid ?? 0,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdfUrl: invoice.invoice_pdf ?? null,
    invoicePeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    invoicePeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    updatedAt: now,
  };

  if (!existing) {
    const [created] = await db
      .insert(s.billingInvoices)
      .values({
        ...values,
        createdAt: now,
      } as any)
      .returning();
    return created;
  }

  const [updated] = await db
    .update(s.billingInvoices)
    .set(values as any)
    .where(eq(s.billingInvoices.id, existing.id))
    .returning();
  return updated;
}

async function upsertPaymentFromStripe(invoice: Stripe.Invoice, billingInvoiceId: string, companyId: string): Promise<s.BillingPayment | null> {
  const pi = invoice.payment_intent as any;
  if (!pi) return null;

  const paymentIntentId = typeof pi === 'string' ? pi : pi.id;
  const status = typeof pi === 'string' ? null : pi.status;
  const amount = typeof pi === 'string' ? invoice.amount_paid ?? 0 : pi.amount ?? invoice.amount_paid ?? 0;
  const currency = (typeof pi === 'string' ? invoice.currency : pi.currency) ?? 'usd';

  const now = new Date();
  const [existing] = await db
    .select()
    .from(s.billingPayments)
    .where(eq(s.billingPayments.stripePaymentIntentId, paymentIntentId));

  const values = {
    companyId,
    billingInvoiceId,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: typeof pi === 'string' ? null : (pi.latest_charge as any) ?? null,
    status: mapStripePaymentIntentStatus(status),
    amountCents: amount ?? 0,
    currency: String(currency).toUpperCase(),
    updatedAt: now,
  };

  if (!existing) {
    const [created] = await db
      .insert(s.billingPayments)
      .values({
        ...values,
        createdAt: now,
      } as any)
      .returning();
    return created;
  }

  const [updated] = await db
    .update(s.billingPayments)
    .set(values as any)
    .where(eq(s.billingPayments.id, existing.id))
    .returning();
  return updated;
}

// Stripe webhook endpoint
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const raw = (req as any).rawBody as Buffer | undefined;

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
      if (!raw) {
        return res.status(400).json({ error: 'Missing raw request body' });
      }
      event = await stripeService.constructEvent(raw, sig, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    logger.info(`Webhook received: ${event.type} (${event.id})`);

    const now = new Date();
    try {
      await db.insert(s.stripeWebhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        status: 'processing',
        receivedAt: now,
      } as any);
    } catch (e: any) {
      const code = typeof e?.code === 'string' ? e.code : undefined;
      const message = typeof e?.message === 'string' ? e.message : '';
      if (code === '23505' || message.toLowerCase().includes('unique') || message.toLowerCase().includes('duplicate')) {
        return res.json({ received: true, duplicate: true });
      }
      throw e;
    }

    try {
      if (
        event.type === 'checkout.session.completed' ||
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        let subscription: Stripe.Subscription | null = null;

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as any;
          const subId = session.subscription as string | undefined;
          if (subId) {
            subscription = await stripeService.retrieveSubscription(subId);
          }
        } else {
          subscription = event.data.object as Stripe.Subscription;
        }

        if (subscription) {
          const customerId = String(subscription.customer ?? '');
          const company = await findCompanyByStripeCustomerId(customerId);
          if (!company) {
            throw new Error(`No company found for Stripe customer ${customerId}`);
          }

          const before = await db
            .select()
            .from(s.subscriptions)
            .where(eq(s.subscriptions.stripeSubscriptionId, subscription.id));
          const updated = await upsertSubscriptionFromStripe(subscription, company.id);

          await storage.createAuditLog({
            companyId: company.id,
            userId: null,
            action: `stripe.${event.type}`,
            entityType: 'subscription',
            entityId: updated.id,
            changes: JSON.stringify({ before: before[0] ?? null, after: updated, stripeEventId: event.id }),
          });
        }
      }

      if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = String(invoice.customer ?? '');
        const company = await findCompanyByStripeCustomerId(customerId);
        if (!company) {
          throw new Error(`No company found for Stripe customer ${customerId}`);
        }

        const stripeSubId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as any)?.id;
        let localSubscriptionId: string | null = null;
        if (stripeSubId) {
          const [local] = await db
            .select()
            .from(s.subscriptions)
            .where(eq(s.subscriptions.stripeSubscriptionId, stripeSubId));
          localSubscriptionId = local?.id ?? null;
        }

        const invBefore = await db
          .select()
          .from(s.billingInvoices)
          .where(eq(s.billingInvoices.stripeInvoiceId, invoice.id));
        const localInvoice = await upsertInvoiceFromStripe(invoice, company.id, localSubscriptionId);
        const payment = await upsertPaymentFromStripe(invoice, localInvoice.id, company.id);

        if (stripeSubId) {
          const [subRow] = await db
            .select()
            .from(s.subscriptions)
            .where(eq(s.subscriptions.stripeSubscriptionId, stripeSubId));
          if (subRow) {
            const nextStatus = event.type === 'invoice.payment_succeeded' ? 'active' : 'past_due';
            await db
              .update(s.subscriptions)
              .set({
                status: nextStatus as any,
                pastDueSince: nextStatus === 'past_due' ? subRow.pastDueSince ?? now : null,
                updatedAt: now,
              } as any)
              .where(eq(s.subscriptions.id, subRow.id));
          }
        }

        await storage.createAuditLog({
          companyId: company.id,
          userId: null,
          action: `stripe.${event.type}`,
          entityType: 'billing_invoice',
          entityId: localInvoice.id,
          changes: JSON.stringify({ before: invBefore[0] ?? null, after: localInvoice, payment, stripeEventId: event.id }),
        });
      }

      await db
        .update(s.stripeWebhookEvents)
        .set({ status: 'processed', processedAt: now, error: null } as any)
        .where(eq(s.stripeWebhookEvents.stripeEventId, event.id));

      res.json({ received: true });
    } catch (err: any) {
      const message = err?.message ? String(err.message) : 'Unknown error';
      await db
        .update(s.stripeWebhookEvents)
        .set({ status: 'failed', processedAt: new Date(), error: message } as any)
        .where(eq(s.stripeWebhookEvents.stripeEventId, event.id));
      throw err;
    }
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const companyId = user?.currentCompanyId as string | undefined;
    if (!companyId) {
      return res.status(400).json({ error: 'currentCompanyId is required' });
    }

    const parsed = (req.body ?? {}) as { planId?: string; billingInterval?: 'month' | 'year' };
    if (!parsed.planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const [basePlan] = await db
      .select()
      .from(s.plans)
      .where(and(eq(s.plans.id, parsed.planId), sql`${s.plans.deletedAt} is null`));
    if (!basePlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const requestedInterval = parsed.billingInterval ?? (basePlan.billingInterval as any) ?? 'month';

    const [plan] = basePlan.billingInterval === requestedInterval
      ? [basePlan]
      : await db
          .select()
          .from(s.plans)
          .where(
            and(
              eq(s.plans.code, basePlan.code),
              eq(s.plans.billingInterval, requestedInterval as any),
              sql`${s.plans.deletedAt} is null`,
            ),
          );

    if (!plan) {
      return res.status(404).json({ error: 'Requested plan interval not found' });
    }

    if (!plan.stripePriceId) {
      return res.status(400).json({ error: 'Plan is not configured for Stripe' });
    }

    const [company] = await db.select().from(s.companies).where(eq(s.companies.id, companyId));
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: company.email ?? undefined,
        name: company.name,
        metadata: {
          companyId: company.id,
        },
      });
      customerId = customer.id;
      await db
        .update(s.companies)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() } as any)
        .where(eq(s.companies.id, company.id));
    }

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
    const successUrl = `${appBaseUrl}/owner/subscriptions?checkout=success`;
    const cancelUrl = `${appBaseUrl}/owner/subscriptions?checkout=cancel`;

    const session = await stripeService.createCheckoutSession({
      customerId,
      priceId: plan.stripePriceId,
      successUrl,
      cancelUrl,
      metadata: {
        companyId: company.id,
        planId: plan.id,
      },
      subscriptionMetadata: {
        companyId: company.id,
        planId: plan.id,
      },
    });

    await storage.createAuditLog({
      companyId: company.id,
      userId: String(user?.id ?? null),
      action: 'billing.checkout.created',
      entityType: 'stripe_checkout_session',
      entityId: session.id,
      changes: JSON.stringify({ companyId: company.id, planId: plan.id }),
    });

    res.status(201).json({ id: session.id, url: session.url });
  } catch (error: any) {
    logger.error('Checkout session creation failed:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
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
