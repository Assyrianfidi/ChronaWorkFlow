import express from 'express';
import Stripe from 'stripe';
import { z } from 'zod';

import { asyncHandler } from '../middleware/error.middleware.mjs';
import { requireRole, requireCompanyAccess } from '../middleware/auth.middleware.mjs';

const router = express.Router();
const getPrisma = () => global.prisma;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
});

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

const getPriceIdForPlan = (plan) => {
  if (plan === 'STARTER') return process.env.STRIPE_STARTER_PRICE_ID;
  if (plan === 'GROWTH') return process.env.STRIPE_GROWTH_PRICE_ID;
  if (plan === 'ENTERPRISE') return process.env.STRIPE_ENTERPRISE_PRICE_ID;
  return undefined;
};

router.post(
  '/checkout',
  requireRole('OWNER', 'ADMIN'),
  requireCompanyAccess('billing'),
  asyncHandler(async (req, res) => {
    const prisma = getPrisma();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Stripe is not configured (missing STRIPE_SECRET_KEY)',
      });
    }

    const validated = checkoutSchema.parse(req.body);
    const priceId = getPriceIdForPlan(validated.plan);

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Missing Stripe price id for plan ${validated.plan}`,
      });
    }

    const companyId = req.user.companyId;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/settings/billing?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: companyId,
      metadata: {
        companyId,
        plan: validated.plan,
      },
    });

    if (prisma) {
      const existing = await prisma.subscription.findFirst({
        where: { companyId, status: 'ACTIVE' },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planType: validated.plan,
            stripePriceId: priceId,
            stripeCheckoutSessionId: session.id,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            planType: validated.plan,
            status: 'PENDING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
            companyId,
            stripePriceId: priceId,
            stripeCheckoutSessionId: session.id,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        url: session.url,
        id: session.id,
      },
    });
  })
);

router.post(
  '/portal',
  requireRole('OWNER', 'ADMIN'),
  requireCompanyAccess('billing'),
  asyncHandler(async (req, res) => {
    const prisma = getPrisma();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Stripe is not configured (missing STRIPE_SECRET_KEY)',
      });
    }

    const validated = portalSchema.parse(req.body || {});
    const companyId = req.user.companyId;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database is not available',
      });
    }

    const activeSub = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeSub?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No Stripe customer found for this account',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const portal = await stripe.billingPortal.sessions.create({
      customer: activeSub.stripeCustomerId,
      return_url: validated.returnUrl || `${frontendUrl}/settings/billing`,
    });

    res.status(201).json({
      success: true,
      data: { url: portal.url },
    });
  })
);

export default router;
