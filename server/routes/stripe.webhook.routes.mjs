import express from 'express';
import Stripe from 'stripe';

import { asyncHandler } from '../middleware/error.middleware.mjs';
import { incCounter } from '../utils/metrics.mjs';

const router = express.Router();
const getPrisma = () => global.prisma;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    if (!stripe || !stripeWebhookSecret) {
      return res.status(503).send('Stripe webhook not configured');
    }

    incCounter('accubooks_stripe_webhook_attempts_total', {
      outcome: 'received',
    });

    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).send('Database not available');
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).send('Missing Stripe signature');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
    } catch (err) {
      incCounter('accubooks_stripe_webhook_attempts_total', {
        outcome: 'invalid_signature',
      });
      incCounter('accubooks_stripe_webhooks_total', {
        type: 'invalid_signature',
      });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const existingEvent = await prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });

    if (existingEvent) {
      return res.json({ received: true, duplicate: true });
    }

    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        status: 'RECEIVED',
        processedAt: new Date(),
      },
    });

    incCounter('accubooks_stripe_webhooks_total', {
      type: event.type,
    });

    const handleSubscriptionUpsert = async (subscription) => {
      const companyId = subscription.metadata?.companyId || subscription.client_reference_id || null;
      if (!companyId) return;

      const plan = subscription.metadata?.plan;
      const planType = plan && ['STARTER', 'GROWTH', 'ENTERPRISE'].includes(plan) ? plan : undefined;

      const data = {
        status: subscription.status?.toUpperCase?.() || 'ACTIVE',
        stripeCustomerId: subscription.customer?.toString?.(),
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items?.data?.[0]?.price?.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        updatedAt: new Date(),
        ...(planType ? { planType } : {}),
      };

      const existing = await prisma.subscription.findFirst({
        where: { companyId, stripeSubscriptionId: subscription.id },
      });

      if (existing) {
        await prisma.subscription.update({ where: { id: existing.id }, data });
      } else {
        await prisma.subscription.create({
          data: {
            companyId,
            planType: data.planType || 'STARTER',
            status: data.status || 'ACTIVE',
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            stripeCustomerId: data.stripeCustomerId,
            stripeSubscriptionId: data.stripeSubscriptionId,
            stripePriceId: data.stripePriceId,
            stripeCheckoutSessionId: null,
          },
        });
      }

      if (planType) {
        await prisma.user.updateMany({
          where: { companyId },
          data: { subscriptionPlan: planType },
        });
      }
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());
          await handleSubscriptionUpsert(subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionUpsert(subscription);
        break;
      }
      default:
        break;
    }

    const companyId =
      event?.data?.object?.metadata?.companyId ||
      event?.data?.object?.client_reference_id ||
      null;
    if (companyId) {
      try {
        void prisma.auditLog
          .create({
            data: {
              action: 'stripe_webhook',
              entity: 'stripe',
              entityId: event.id,
              oldValues: null,
              newValues: {
                type: event.type,
              },
              userId: null,
              companyId,
            },
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }

    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSED',
      },
    });

    res.json({ received: true });
  })
);

export default router;
