import { Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { stripeService } from "../../services/billing/stripe.service";
import { prisma } from "../../utils/prisma";
import { logger } from "../../utils/logger.js";

export class BillingController {
  // Get available plans
  async getPlans(req: Request, res: Response) {
    try {
      const plans = await stripeService.getPlans();
      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      logger.error("Error getting plans:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Create subscription
  async createSubscription(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { priceId, paymentMethodId } = req.body;
      const userId = (req as any).user.id;

      const subscription = await stripeService.createSubscription(
        userId.toString(),
        priceId,
        paymentMethodId,
      );

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent
            ?.client_secret,
          status: subscription.status,
        },
      });
    } catch (error) {
      logger.error("Error creating subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create subscription",
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { subscriptionId } = req.params;
      const userId = (req as any).user.id;

      // Verify user owns this subscription
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.subscriptionId !== subscriptionId) {
        return res.status(403).json({
          success: false,
          message: "Subscription not found or access denied",
        });
      }

      const subscription =
        await stripeService.cancelSubscription(subscriptionId);

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
    } catch (error) {
      logger.error("Error canceling subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel subscription",
      });
    }
  }

  // Get current subscription
  async getSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionId: true,
          subscriptionStatus: true,
          planType: true,
          stripeCustomerId: true,
          cancelAtPeriodEnd: true,
        },
      });

      if (!user || !user.subscriptionId) {
        return res.json({
          success: true,
          data: null,
        });
      }

      const subscription = await stripeService.getSubscription(
        user.subscriptionId,
      );

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          planType: user.planType,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd:
            (subscription as unknown as { current_period_end?: number })
              .current_period_end,
          latestInvoice: subscription.latest_invoice,
        },
      });
    } catch (error) {
      logger.error("Error getting subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get subscription",
      });
    }
  }

  // Update subscription
  async updateSubscription(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { priceId } = req.body;
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.subscriptionId) {
        return res.status(404).json({
          success: false,
          message: "No active subscription found",
        });
      }

      const subscription = await stripeService.updateSubscription(
        user.subscriptionId,
        [{ price: priceId }],
      );

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          planType: await stripeService
            .getPlans()
            .then(
              (plans) =>
                plans.find((p) => p.stripePriceId === priceId)?.id || "STARTUP",
            ),
        },
      });
    } catch (error) {
      logger.error("Error updating subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update subscription",
      });
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { amount, currency = "usd" } = req.body;
      const userId = (req as any).user.id;

      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency,
        { userId: userId.toString() },
      );

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error) {
      logger.error("Error creating payment intent:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create payment intent",
      });
    }
  }

  // Get billing history
  async getBillingHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      if (!user?.stripeCustomerId) {
        return res.json({
          success: true,
          data: [],
        });
      }

      // Get invoices from Stripe
      const invoices = await stripeService.getInvoices(user.stripeCustomerId);

      res.json({
        success: true,
        data: invoices.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          invoicePdf: invoice.invoice_pdf,
        })),
      });
    } catch (error) {
      logger.error("Error getting billing history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get billing history",
      });
    }
  }

  // Handle Stripe webhook
  async handleWebhook(req: Request, res: Response) {
    try {
      const sig = req.headers["stripe-signature"] as string;

      if (!sig) {
        return res.status(400).json({
          success: false,
          message: "Stripe signature is required",
        });
      }

      const event = stripeService.constructWebhookEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );

      await stripeService.handleWebhook(event);

      res.json({
        success: true,
        received: true,
      });
    } catch (error) {
      logger.error("Error handling webhook:", error);
      res.status(400).json({
        success: false,
        message: "Webhook handler failed",
      });
    }
  }
}

export const billingController = new BillingController();

// Validation middleware
export const validateCreateSubscription = [
  body("priceId").notEmpty().withMessage("Price ID is required"),
  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment method ID is required"),
];

export const validateUpdateSubscription = [
  body("priceId").notEmpty().withMessage("Price ID is required"),
];

export const validateCreatePaymentIntent = [
  body("amount").isNumeric().withMessage("Amount must be a number"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be 3 characters"),
];
