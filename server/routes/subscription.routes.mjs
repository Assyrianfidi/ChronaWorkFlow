/**
 * Subscription Management Routes
 * Production-grade subscription system with tiered plans and feature gating
 */

/**
 * Subscription Management Routes
 * Enterprise-grade subscription system with tiered plans and feature gating
 */

import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.middleware.mjs';
import {
  requireRole,
  requirePermission,
  requireSubscription,
  requireCompanyAccess,
  auditLog,
  userRateLimit
} from '../middleware/auth.middleware.mjs';

const router = express.Router();

const getPrisma = () => global.prisma;

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Basic accounting',
      'Up to 3 users',
      'Chart of accounts',
      'Basic reports',
      'Email support',
    ],
    limits: {
      users: 3,
      transactions: 1000,
      invoices: 50,
      storage: '1GB',
      apiCalls: 10000,
    },
    permissions: [
      'accounting:read',
      'reports:read',
      'invoices:read',
      'user:read',
    ],
  },
  GROWTH: {
    name: 'Growth',
    price: 99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Everything in Starter',
      'Unlimited users',
      'Invoicing system',
      'Expense tracking',
      'Advanced reports',
      'API access',
      'Priority support',
      'Multi-entity support',
    ],
    limits: {
      users: Infinity,
      transactions: 10000,
      invoices: 500,
      storage: '10GB',
      apiCalls: 100000,
    },
    permissions: [
      'accounting:*',
      'reports:*',
      'invoices:*',
      'user:*',
      'company:read',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Everything in Growth',
      'Custom reporting',
      'Advanced analytics',
      'Audit logs',
      'Accountant collaboration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom workflows',
      'White-label options',
    ],
    limits: {
      users: Infinity,
      transactions: Infinity,
      invoices: Infinity,
      storage: '100GB',
      apiCalls: Infinity,
    },
    permissions: [
      '*:*', // All permissions
    ],
  },
};

// Validation schemas
const updateSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
  paymentMethodId: z.string().optional(),
});

const createSubscriptionSchema = z.object({
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
  paymentMethodId: z.string(),
});

// GET /api/subscriptions/plans
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
  }));

  res.json({
    success: true,
    data: { plans },
  });
}));

// GET /api/subscriptions/current
router.get('/current', asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    return res.json({
      success: true,
      data: {
        subscription: null,
        currentPlan: SUBSCRIPTION_PLANS.STARTER,
      },
    });
  }
  const subscription = await prisma.subscription.findFirst({
    where: { 
      companyId: req.user.id,
      status: 'ACTIVE',
    },
  });

  if (!subscription) {
    return res.json({
      success: true,
      data: { 
        subscription: null,
        currentPlan: SUBSCRIPTION_PLANS.STARTER,
      },
    });
  }

  res.json({
    success: true,
    data: { 
      subscription,
      currentPlan: SUBSCRIPTION_PLANS[subscription.planType],
    },
  });
}));

// GET /api/subscriptions/usage
router.get('/usage', asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  // Mock fallback (no DB connected)
  if (!prisma) {
    res.json({
      success: true,
      data: {
        currentPlan: SUBSCRIPTION_PLANS.ENTERPRISE,
        usage: {
          users: 5,
          transactions: 2450,
          invoices: 127,
          storage: 2.4,
        },
      },
    });
    return;
  }

  const companyId = req.user.companyId || req.user.id;
  const currentPeriod = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  };

  const [userCount, transactionCount, invoiceCount, currentSubscription] = await Promise.all([
    prisma.user.count({ where: { companyId, isActive: true } }).catch(() => 0),
    prisma.transaction.count({
      where: {
        companyId,
        date: { gte: currentPeriod.start, lte: currentPeriod.end },
      },
    }).catch(() => 0),
    prisma.invoice.count({
      where: {
        companyId,
        issueDate: { gte: currentPeriod.start, lte: currentPeriod.end },
      },
    }).catch(() => 0),
    prisma.subscription.findFirst({ where: { companyId, status: 'ACTIVE' } }).catch(() => null),
  ]);

  const planType = currentSubscription?.planType || 'STARTER';
  const currentPlan = SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS.STARTER;

  res.json({
    success: true,
    data: {
      currentPlan,
      usage: {
        users: userCount,
        transactions: transactionCount,
        invoices: invoiceCount,
        storage: 0,
      },
    },
  });
}));

// PUT /api/subscriptions/upgrade
router.put('/upgrade',
  requireRole('OWNER', 'ADMIN'),
  requireCompanyAccess('subscriptions'),
  auditLog('upgraded', 'subscription'),
  asyncHandler(async (req, res) => {
    const validatedData = updateSubscriptionSchema.parse(req.body);

    const prisma = getPrisma();

    if (prisma) {
      // Database mode
      const currentSubscription = await prisma.subscription.findFirst({
        where: {
          companyId: req.user.companyId,
          status: 'ACTIVE',
        },
      });

      if (!currentSubscription) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'No active subscription found',
        });
      }

      // Prevent downgrades
      const planHierarchy = ['STARTER', 'GROWTH', 'ENTERPRISE'];
      const currentIndex = planHierarchy.indexOf(currentSubscription.planType);
      const newIndex = planHierarchy.indexOf(validatedData.plan);

      if (newIndex < currentIndex) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Plan downgrades are not supported through this endpoint. Contact support.',
        });
      }

      // If same plan, no action needed
      if (validatedData.plan === currentSubscription.planType) {
        return res.json({
          success: true,
          data: { subscription: currentSubscription },
          message: 'Already on this plan',
        });
      }

      // Calculate prorated amount (simplified)
      const daysRemaining = Math.ceil(
        (new Date(currentSubscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const dailyRate = SUBSCRIPTION_PLANS[validatedData.plan].price / 30;
      const proratedAmount = dailyRate * daysRemaining;

      // In production, this would integrate with payment processor
      const updatedSubscription = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          planType: validatedData.plan,
          updatedAt: new Date(),
        },
      });

      // Update all users in the company
      await prisma.user.updateMany({
        where: { companyId: req.user.companyId },
        data: { subscriptionPlan: validatedData.plan },
      });

      // Create billing invoice record (placeholder - real Stripe integration pending)
      await prisma.billingInvoice.create({
        data: {
          invoiceNumber: `BILL-${Date.now()}`,
          amount: proratedAmount,
          currency: 'USD',
          status: 'PAID',
          dueDate: new Date(),
          paidAt: new Date(),
          companyId: req.user.companyId,
        },
      });

      res.json({
        success: true,
        data: {
          subscription: updatedSubscription,
          proratedAmount,
        },
        message: `Successfully upgraded to ${SUBSCRIPTION_PLANS[validatedData.plan].name} plan`,
      });
    } else {
      // Mock mode
      res.json({
        success: true,
        data: {
          subscription: {
            id: 'sub-1',
            planType: validatedData.plan,
            status: 'ACTIVE',
          },
          proratedAmount: 49.50,
        },
        message: `Successfully upgraded to ${SUBSCRIPTION_PLANS[validatedData.plan].name} plan`,
      });
    }
  })
);

// POST /api/subscriptions/cancel
router.post('/cancel', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const currentSubscription = await prisma.subscription.findFirst({
    where: { 
      companyId: req.user.companyId,
      status: 'ACTIVE',
    },
  });

  if (!currentSubscription) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'No active subscription found',
    });
  }

  // Set subscription to cancel at period end
  const updatedSubscription = await prisma.subscription.update({
    where: { id: currentSubscription.id },
    data: {
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    },
  });

  res.json({
    success: true,
    data: { subscription: updatedSubscription },
    message: 'Subscription will be cancelled at the end of the current billing period',
  });
}));

// GET /api/subscriptions/billing-history
router.get('/billing-history', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.billingInvoice.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.billingInvoice.count({
      where: { companyId: req.user.companyId },
    }),
  ]);

  res.json({
    success: true,
    data: {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

// GET /api/subscriptions/payment-methods
router.get('/payment-methods', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { 
      companyId: req.user.companyId,
      isActive: true,
    },
    orderBy: { isDefault: 'desc' },
  });

  res.json({
    success: true,
    data: { paymentMethods },
  });
}));

// POST /api/subscriptions/payment-methods
router.post('/payment-methods', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { type, last4, brand, expiryMonth, expiryYear } = req.body;
  
  // In production, this would integrate with payment processor like Stripe
  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      type,
      last4,
      brand,
      expiryMonth,
      expiryYear,
      companyId: req.user.companyId,
      isDefault: false, // First payment method won't be default
    },
  });

  res.status(201).json({
    success: true,
    data: { paymentMethod },
  });
}));

// PUT /api/subscriptions/payment-methods/:methodId/default
router.put('/payment-methods/:methodId/default', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { methodId } = req.params;
  
  // Remove default from all other methods
  await prisma.paymentMethod.updateMany({
    where: { companyId: req.user.companyId },
    data: { isDefault: false },
  });

  // Set new default
  const paymentMethod = await prisma.paymentMethod.update({
    where: { id: methodId },
    data: { isDefault: true },
  });

  res.json({
    success: true,
    data: { paymentMethod },
  });
}));

export default router;
