import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import logger from '../config/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 2900,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    maxUsers: 3,
    maxCompanies: 1,
    features: ['Basic Dashboard', 'Up to 3 users', '1 company', 'Email support'],
  },
  PRO: {
    name: 'Pro',
    price: 7900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    maxUsers: 10,
    maxCompanies: 5,
    features: ['Advanced Analytics', 'Up to 10 users', '5 companies', 'Priority support', 'API access'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 19900,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    maxUsers: -1,
    maxCompanies: -1,
    features: ['Unlimited users', 'Unlimited companies', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  },
};

// POST /api/billing/create-checkout-session
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { plan, companyId } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected.',
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        members: {
          where: { userId: req.user.id },
        },
      },
    });

    if (!company || company.members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this company.',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
      client_reference_id: companyId,
      metadata: {
        companyId,
        userId: req.user.id.toString(),
        plan,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          companyId,
          plan,
        },
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    logger.error('Create checkout session error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session.',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

// POST /api/billing/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check for idempotency
  try {
    const existingEvent = await prisma.stripe_events.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent) {
      logger.info('Webhook event already processed', { eventId: event.id });
      return res.json({ received: true, status: 'already_processed' });
    }
  } catch (error) {
    logger.warn('Idempotency check failed, proceeding with caution', { eventId: event.id });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { companyId, plan } = session.metadata;

        await prisma.billing_status.upsert({
          where: { companyId },
          create: {
            companyId,
            subscriptionPlan: plan,
            subscriptionStatus: 'TRIALING',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          update: {
            subscriptionPlan: plan,
            subscriptionStatus: 'TRIALING',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: parseInt(session.metadata.userId),
            action: 'SUBSCRIPTION_CREATED',
            details: JSON.stringify({ companyId, plan, sessionId: session.id }),
          },
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const companyId = subscription.metadata.companyId;

        await prisma.billing_status.update({
          where: { companyId },
          data: {
            subscriptionStatus: subscription.status.toUpperCase(),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const companyId = subscription.metadata.companyId;

        await prisma.billing_status.update({
          where: { companyId },
          data: {
            subscriptionStatus: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const companyId = subscription.metadata.companyId;

        await prisma.billing_status.update({
          where: { companyId },
          data: {
            subscriptionStatus: 'ACTIVE',
            lastPaymentDate: new Date(),
            lastPaymentAmount: invoice.amount_paid / 100,
          },
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const companyId = subscription.metadata.companyId;

        await prisma.billing_status.update({
          where: { companyId },
          data: {
            subscriptionStatus: 'PAST_DUE',
          },
        });

        break;
      }
    }

    // Store processed event for idempotency
    try {
      await prisma.stripe_events.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      logger.warn('Failed to store webhook event', { eventId: event.id, error: error.message });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error', { error: error.message, eventType: event?.type });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/billing/subscription-status
router.get('/subscription-status', authenticate, async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: req.user.id,
        companyId,
      },
    });

    if (!membership && req.user.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this company.',
      });
    }

    const billingStatus = await prisma.billing_status.findUnique({
      where: { companyId },
    });

    if (!billingStatus) {
      return res.json({
        success: true,
        data: {
          status: 'NO_SUBSCRIPTION',
          plan: null,
          trialDaysRemaining: 0,
        },
      });
    }

    const trialDaysRemaining = billingStatus.trialEndsAt
      ? Math.max(0, Math.ceil((billingStatus.trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      success: true,
      data: {
        status: billingStatus.subscriptionStatus,
        plan: billingStatus.subscriptionPlan,
        currentPeriodEnd: billingStatus.currentPeriodEnd,
        trialEndsAt: billingStatus.trialEndsAt,
        trialDaysRemaining,
        lastPaymentDate: billingStatus.lastPaymentDate,
        lastPaymentAmount: billingStatus.lastPaymentAmount,
      },
    });
  } catch (error) {
    logger.error('Get subscription status error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status.',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

// POST /api/billing/portal
router.post('/portal', authenticate, async (req, res) => {
  try {
    const { companyId } = req.body;

    const billingStatus = await prisma.billing_status.findUnique({
      where: { companyId },
    });

    if (!billingStatus || !billingStatus.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found.',
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billingStatus.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    logger.error('Create portal session error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session.',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

// GET /api/billing/plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price / 100,
      maxUsers: plan.maxUsers,
      maxCompanies: plan.maxCompanies,
      features: plan.features,
    })),
  });
});

// POST /api/billing/change-plan
router.post('/change-plan', authenticate, async (req, res) => {
  try {
    const { companyId, newPlan } = req.body;

    if (!PLANS[newPlan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected.',
      });
    }

    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: req.user.id,
        companyId,
        role: 'OWNER',
      },
    });

    if (!membership && req.user.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only company owners can change subscription plans.',
      });
    }

    const billingStatus = await prisma.billing_status.findUnique({
      where: { companyId },
    });

    if (!billingStatus?.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found.',
      });
    }

    const subscription = await stripe.subscriptions.retrieve(billingStatus.stripeSubscriptionId);
    
    await stripe.subscriptions.update(billingStatus.stripeSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: PLANS[newPlan].priceId,
      }],
      proration_behavior: 'create_prorations',
    });

    await prisma.billing_status.update({
      where: { companyId },
      data: { subscriptionPlan: newPlan },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBSCRIPTION_PLAN_CHANGED',
        details: JSON.stringify({ companyId, oldPlan: billingStatus.subscriptionPlan, newPlan }),
      },
    });

    logger.info('Subscription plan changed', { companyId, oldPlan: billingStatus.subscriptionPlan, newPlan, userId: req.user.id });

    res.json({
      success: true,
      message: 'Subscription plan updated successfully.',
      data: { newPlan },
    });
  } catch (error) {
    logger.error('Change plan error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to change subscription plan.',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

export default router;
export { PLANS };
