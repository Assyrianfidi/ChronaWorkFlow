import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { tenants, subscriptions, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { stripeService } from '../integrations/stripe';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email';
import { cacheService } from '../services/cache';

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

// Validation schemas
const createSubscriptionSchema = z.object({
  priceId: z.string(),
  paymentMethodId: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  priceId: z.string(),
  paymentMethodId: z.string().optional(),
});

const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
});

const reactivateSubscriptionSchema = z.object({
  priceId: z.string(),
});

// Subscription management endpoints

// Get current subscription
export async function getSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.user.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenant[0];

    // Get subscription details
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, req.user.tenantId))
      .limit(1);

    let subscriptionData = null;
    if (subscription.length > 0) {
      subscriptionData = subscription[0];
    }

    res.json({
      tenant: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        subscriptionTier: tenantData.subscriptionTier,
        subscriptionStatus: tenantData.subscriptionStatus,
        trialEndsAt: tenantData.trialEndsAt,
        subscriptionEndsAt: tenantData.subscriptionEndsAt,
      },
      subscription: subscriptionData,
    });

  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create subscription
export async function createSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { priceId, paymentMethodId } = createSubscriptionSchema.parse(req.body);

    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.user.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenant[0];

    if (!tenantData.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this tenant' });
    }

    // Create Stripe subscription
    const stripeSubscription = await stripeService.createSubscription({
      customerId: tenantData.stripeCustomerId,
      priceId,
      paymentMethodId,
      trialPeriodDays: tenantData.subscriptionStatus === 'trial' ? 14 : 0,
      metadata: {
        tenant_id: req.user.tenantId,
      },
    });

    // Update local subscription record
    await db
      .update(subscriptions)
      .set({
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.tenantId, req.user.tenantId));

    // Update tenant subscription tier
    const priceTier = priceId.includes('standard') ? 'standard' : 'enterprise';
    await db
      .update(tenants)
      .set({
        subscriptionTier: priceTier,
        subscriptionStatus: 'active',
        subscriptionEndsAt: new Date(stripeSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, req.user.tenantId));

    // Invalidate cache for this tenant
    await cacheService.invalidateCompanyData(req.user.tenantId);

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      template: 'subscription-created',
      data: {
        subscriptionTier: priceTier,
        amount: stripeSubscription.items.data[0].price.unit_amount / 100,
        currency: stripeSubscription.items.data[0].price.currency,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Log subscription creation
    logger.info('Subscription created', {
      tenantId: req.user.tenantId,
      userId: req.user.id,
      priceId,
      subscriptionId: stripeSubscription.id,
    });

    res.json({
      message: 'Subscription created successfully',
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Create subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update subscription
export async function updateSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { priceId, paymentMethodId } = updateSubscriptionSchema.parse(req.body);

    // Get current subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, req.user.tenantId))
      .limit(1);

    if (subscription.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscriptionData = subscription[0];

    if (!subscriptionData.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No Stripe subscription ID found' });
    }

    // Update Stripe subscription
    const updatedSubscription = await stripeService.updateSubscription({
      subscriptionId: subscriptionData.stripeSubscriptionId,
      priceId,
      paymentMethodId,
    });

    // Update local records
    await db
      .update(subscriptions)
      .set({
        stripePriceId: priceId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionData.id));

    // Update tenant subscription tier
    const priceTier = priceId.includes('standard') ? 'standard' : 'enterprise';
    await db
      .update(tenants)
      .set({
        subscriptionTier: priceTier,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, req.user.tenantId));

    // Invalidate cache
    await cacheService.invalidateCompanyData(req.user.tenantId);

    res.json({
      message: 'Subscription updated successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Update subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Cancel subscription
export async function cancelSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { cancelAtPeriodEnd } = cancelSubscriptionSchema.parse(req.body);

    // Get current subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, req.user.tenantId))
      .limit(1);

    if (subscription.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscriptionData = subscription[0];

    if (!subscriptionData.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No Stripe subscription ID found' });
    }

    // Cancel Stripe subscription
    const cancelledSubscription = await stripeService.cancelSubscription({
      subscriptionId: subscriptionData.stripeSubscriptionId,
      cancelAtPeriodEnd,
    });

    // Update local records
    await db
      .update(subscriptions)
      .set({
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        cancelAtPeriodEnd,
        cancelledAt: cancelAtPeriodEnd ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionData.id));

    if (!cancelAtPeriodEnd) {
      await db
        .update(tenants)
        .set({
          subscriptionStatus: 'cancelled',
          subscriptionEndsAt: new Date(cancelledSubscription.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, req.user.tenantId));
    }

    // Send cancellation email
    await sendEmail({
      to: req.user.email,
      template: 'subscription-cancelled',
      data: {
        cancelAtPeriodEnd,
        currentPeriodEnd: new Date(cancelledSubscription.current_period_end * 1000),
      },
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancelAtPeriodEnd,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Reactivate subscription
export async function reactivateSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { priceId } = reactivateSubscriptionSchema.parse(req.body);

    // Get current subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, req.user.tenantId))
      .limit(1);

    if (subscription.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscriptionData = subscription[0];

    if (!subscriptionData.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No Stripe subscription ID found' });
    }

    // Reactivate Stripe subscription
    const reactivatedSubscription = await stripeService.reactivateSubscription({
      subscriptionId: subscriptionData.stripeSubscriptionId,
      priceId,
    });

    // Update local records
    await db
      .update(subscriptions)
      .set({
        status: 'active',
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionData.id));

    await db
      .update(tenants)
      .set({
        subscriptionStatus: 'active',
        subscriptionTier: priceId.includes('standard') ? 'standard' : 'enterprise',
        subscriptionEndsAt: new Date(reactivatedSubscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, req.user.tenantId));

    // Send reactivation email
    await sendEmail({
      to: req.user.email,
      template: 'subscription-reactivated',
      data: {
        subscriptionTier: priceId.includes('standard') ? 'Standard' : 'Enterprise',
        currentPeriodEnd: new Date(reactivatedSubscription.current_period_end * 1000),
      },
    });

    res.json({
      message: 'Subscription reactivated successfully',
      subscription: {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Reactivate subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get subscription usage
export async function getUsage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get current month's usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // This would typically query your usage tracking table
    // For now, return mock data
    const usage = {
      companies: 1,
      invoices: 15,
      transactions: 150,
      storageUsed: 250, // MB
      apiCalls: 2500,
      currentMonth,
    };

    res.json({ usage });

  } catch (error) {
    logger.error('Get usage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get billing history
export async function getBillingHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.user.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenant[0];

    if (!tenantData.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    // Get invoices from Stripe
    const invoices = await stripeService.getInvoices(tenantData.stripeCustomerId);

    res.json({
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        created: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        pdfUrl: invoice.invoice_pdf,
      })),
    });

  } catch (error) {
    logger.error('Get billing history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get payment methods
export async function getPaymentMethods(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.user.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenant[0];

    if (!tenantData.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripeService.getPaymentMethods(tenantData.stripeCustomerId);

    res.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
      })),
    });

  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update default payment method
export async function updateDefaultPaymentMethod(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.user.tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenant[0];

    if (!tenantData.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    // Update default payment method in Stripe
    await stripeService.updateDefaultPaymentMethod({
      customerId: tenantData.stripeCustomerId,
      paymentMethodId,
    });

    res.json({ message: 'Default payment method updated successfully' });

  } catch (error) {
    logger.error('Update default payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Admin: Get all subscriptions (for admin dashboard)
export async function getAllSubscriptions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all tenants with their subscriptions
    const result = await db
      .select({
        tenant: tenants,
        subscription: subscriptions,
      })
      .from(tenants)
      .leftJoin(subscriptions, eq(tenants.id, subscriptions.tenantId))
      .where(eq(tenants.isActive, true));

    const subscriptionData = result.map(row => ({
      tenant: {
        id: row.tenant.id,
        name: row.tenant.name,
        slug: row.tenant.slug,
        subscriptionTier: row.tenant.subscriptionTier,
        subscriptionStatus: row.tenant.subscriptionStatus,
        trialEndsAt: row.tenant.trialEndsAt,
        createdAt: row.tenant.createdAt,
      },
      subscription: row.subscription ? {
        id: row.subscription.id,
        status: row.subscription.status,
        currentPeriodStart: row.subscription.currentPeriodStart,
        currentPeriodEnd: row.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: row.subscription.cancelAtPeriodEnd,
      } : null,
    }));

    res.json({ subscriptions: subscriptionData });

  } catch (error) {
    logger.error('Get all subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Admin: Get subscription analytics
export async function getSubscriptionAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Calculate subscription metrics
    const totalTenants = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(eq(tenants.isActive, true));

    const activeSubscriptions = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const trialingTenants = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants)
      .where(eq(tenants.subscriptionStatus, 'trial'));

    const mrr = await db
      .select({
        total: sql<number>`SUM(CASE
          WHEN subscription_tier = 'standard' THEN 29
          WHEN subscription_tier = 'enterprise' THEN 99
          ELSE 0
        END)`
      })
      .from(tenants)
      .where(eq(tenants.subscriptionStatus, 'active'));

    res.json({
      totalTenants: totalTenants[0].count,
      activeSubscriptions: activeSubscriptions[0].count,
      trialingTenants: trialingTenants[0].count,
      monthlyRecurringRevenue: mrr[0].total || 0,
      averageRevenuePerUser: totalTenants[0].count > 0 ? (mrr[0].total || 0) / totalTenants[0].count : 0,
    });

  } catch (error) {
    logger.error('Get subscription analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
