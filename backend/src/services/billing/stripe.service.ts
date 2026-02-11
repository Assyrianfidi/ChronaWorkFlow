// @ts-ignore
import Stripe from "stripe";
import { prisma } from "../../utils/prisma";
import { logger } from "../../utils/logger.js";

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | { id: string } | null;
};

export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });
  }

  // Create a customer in Stripe
  async createCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: name || email,
        metadata: {
          userId,
        },
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { stripeCustomerId: customer.id },
      });

      logger.info(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer;
    } catch (error) {
      logger.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });

      if (!user) {
        throw new Error("User not found");
      }

      let customerId = user.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(
          userId,
          user.email,
          user.name,
        );
        customerId = customer.id;
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          userId,
        },
      });

      // Update user subscription in database
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status as any,
          planType: this.getPlanTypeFromPriceId(priceId),
        },
      });

      logger.info(`Created subscription ${subscription.id} for user ${userId}`);
      return subscription;
    } catch (error) {
      logger.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.cancel(subscriptionId);

      // Update user subscription in database
      await prisma.user.updateMany({
        where: { subscriptionId },
        data: {
          subscriptionStatus: "canceled",
          cancelAtPeriodEnd: true,
        },
      });

      logger.info(`Canceled subscription ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error("Error canceling subscription:", error);
      throw error;
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(
    amount: number,
    currency: string = "usd",
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(
        `Created payment intent ${paymentIntent.id} for amount ${amount} ${currency}`,
      );
      return paymentIntent;
    } catch (error) {
      logger.error("Error creating payment intent:", error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error("Error retrieving subscription:", error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    items: Array<{ price: string; quantity?: number }>,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items,
          payment_behavior: "pending_if_incomplete",
          proration_behavior: "create_prorations",
        },
      );

      // Update user plan in database
      const user = await prisma.user.findFirst({
        where: { subscriptionId },
      });

      if (user && items.length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            planType: this.getPlanTypeFromPriceId(items[0].price),
          },
        });
      }

      logger.info(`Updated subscription ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error("Error updating subscription:", error);
      throw error;
    }
  }

  // Handle webhook events with idempotency
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      // Check if event already processed (idempotency)
      const existingEvent = await prisma.stripeWebhookEvent.findUnique({
        where: { eventId: event.id },
      });

      if (existingEvent) {
        logger.info(`Webhook event ${event.id} already processed, skipping`);
        return;
      }

      // Store event for idempotency
      await prisma.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          processed: false,
          payload: event as any,
        },
      });

      // Process event
      switch (event.type) {
        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;
        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;
        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      // Mark as processed
      await prisma.stripeWebhookEvent.update({
        where: { eventId: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      logger.info(`Successfully processed webhook event ${event.id} (${event.type})`);
    } catch (error) {
      logger.error(`Error handling webhook ${event.id}:`, error);
      
      // Update event with error status
      await prisma.stripeWebhookEvent.updateMany({
        where: { eventId: event.id },
        data: {
          processed: false,
          processedAt: new Date(),
        },
      });
      
      throw error;
    }
  }

  // Private helper methods
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const invoiceWithSubscription = invoice as StripeInvoiceWithSubscription;
    const subscriptionId =
      typeof invoiceWithSubscription.subscription === "string"
        ? invoiceWithSubscription.subscription
        : invoiceWithSubscription.subscription?.id ?? null;

    if (subscriptionId) {
      await prisma.user.updateMany({
        where: { subscriptionId },
        data: {
          subscriptionStatus: "active",
          lastPaymentAt: new Date(),
        },
      });
      logger.info(`Payment succeeded for subscription ${subscriptionId}`);
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const invoiceWithSubscription = invoice as StripeInvoiceWithSubscription;
    const subscriptionId =
      typeof invoiceWithSubscription.subscription === "string"
        ? invoiceWithSubscription.subscription
        : invoiceWithSubscription.subscription?.id ?? null;

    if (subscriptionId) {
      await prisma.user.updateMany({
        where: { subscriptionId },
        data: {
          subscriptionStatus: "past_due",
        },
      });
      logger.warn(`Payment failed for subscription ${subscriptionId}`);
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await prisma.user.updateMany({
      where: { subscriptionId: subscription.id },
      data: {
        subscriptionStatus: "canceled",
        planType: null,
      },
    });
    logger.info(`Subscription ${subscription.id} deleted`);
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await prisma.user.updateMany({
      where: { subscriptionId: subscription.id },
      data: {
        subscriptionStatus: subscription.status as any,
      },
    });
    logger.info(`Subscription ${subscription.id} updated`);
  }

  private getPlanTypeFromPriceId(priceId: string): string {
    // Map price IDs to plan types - configure these based on your Stripe products
    const pricePlanMap: Record<string, string> = {
      [process.env.STRIPE_STARTUP_PRICE_ID || ""]: "STARTUP",
      [process.env.STRIPE_BUSINESS_PRICE_ID || ""]: "BUSINESS",
      [process.env.STRIPE_ENTERPRISE_PRICE_ID || ""]: "ENTERPRISE",
    };

    return pricePlanMap[priceId] || "STARTUP";
  }

  // Get customer invoices
  async getInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });
      return invoices.data;
    } catch (error) {
      logger.error("Error getting invoices:", error);
      throw error;
    }
  }

  // Construct webhook event
  constructWebhookEvent(
    body: string | Buffer,
    sig: string,
    secret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(body, sig, secret);
  }

  // Get available plans
  async getPlans(): Promise<
    Array<{
      id: string;
      name: string;
      price: number;
      features: string[];
      stripePriceId: string;
    }>
  > {
    return [
      {
        id: "startup",
        name: "Startup",
        price: 29,
        features: [
          "Up to 50 invoices/month",
          "Basic reporting",
          "Email support",
          "2 users",
        ],
        stripePriceId: process.env.STRIPE_STARTUP_PRICE_ID || "",
      },
      {
        id: "business",
        name: "Business",
        price: 99,
        features: [
          "Unlimited invoices",
          "Advanced reporting",
          "Priority support",
          "10 users",
          "API access",
        ],
        stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || "",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 299,
        features: [
          "Everything in Business",
          "Custom integrations",
          "Dedicated support",
          "Unlimited users",
          "White-label options",
        ],
        stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
      },
    ];
  }
}

export const stripeService = new StripeService();
