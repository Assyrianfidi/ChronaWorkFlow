/**
 * Billing Controller - Schema-Aligned Version
 * Uses organization → subscriptions relationship (not user.subscriptionId)
 */

import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { stripeService } from '../../services/billing/stripe.service.js';
import { prisma } from '../../utils/prisma.js';
import logger from '../../config/logger.js';

export class BillingController {
  async getPlans(req: Request, res: Response) {
    try {
      const plans = await stripeService.getPlans();
      res.json({ success: true, data: plans });
    } catch (error: any) {
      logger.error('Error fetching plans:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
  }

  async createSubscription(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { priceId, paymentMethodId, organizationId, companyId } = req.body;

      if (!organizationId || !companyId) {
        return res.status(400).json({ success: false, message: 'organizationId and companyId required' });
      }

      const subscription = await stripeService.createSubscription(
        parseInt(organizationId),
        companyId,
        priceId,
        paymentMethodId
      );

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          status: subscription.status,
        },
      });
    } catch (error: any) {
      logger.error('Error creating subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to create subscription' });
    }
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { subscriptionId } = req.params;
      const userId = (req as any).user.id;

      const orgUser = await prisma.organization_users.findFirst({
        where: { userId },
        include: {
          organizations: {
            include: { subscriptions: true },
          },
        },
      });

      const subscription = orgUser?.organizations?.subscriptions;
      if (!subscription || subscription.stripeSubscriptionId !== subscriptionId) {
        return res.status(403).json({ success: false, message: 'Subscription not found or access denied' });
      }

      await stripeService.cancelSubscription(subscriptionId);

      res.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (error: any) {
      logger.error('Error cancelling subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
    }
  }

  async getCurrentSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const orgUser = await prisma.organization_users.findFirst({
        where: { userId },
        include: {
          organizations: {
            include: { subscriptions: true },
          },
        },
      });

      if (!orgUser?.organizations?.subscriptions) {
        return res.json({ success: true, data: null });
      }

      const subscription = orgUser.organizations.subscriptions;

      res.json({
        success: true,
        data: {
          tier: subscription.tier,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodEnd: subscription.currentPeriodEnd,
          canceledAt: subscription.canceledAt,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
    }
  }

  async updatePaymentMethod(req: Request, res: Response) {
    try {
      const { paymentMethodId } = req.body;
      const userId = (req as any).user.id;

      const orgUser = await prisma.organization_users.findFirst({
        where: { userId },
        include: {
          organizations: {
            include: { subscriptions: true },
          },
        },
      });

      const subscription = orgUser?.organizations?.subscriptions;
      if (!subscription?.stripeCustomerId) {
        return res.status(404).json({ success: false, message: 'No subscription found' });
      }

      res.json({ success: true, message: 'Payment method updated successfully' });
    } catch (error: any) {
      logger.error('Error updating payment method:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment method' });
    }
  }
}

export const billingController = new BillingController();

export const createSubscriptionValidation = [
  body('priceId').notEmpty().withMessage('Price ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  body('organizationId').notEmpty().withMessage('Organization ID is required'),
  body('companyId').notEmpty().withMessage('Company ID is required'),
];

export const cancelSubscriptionValidation = [
  param('subscriptionId').notEmpty().withMessage('Subscription ID is required'),
];
