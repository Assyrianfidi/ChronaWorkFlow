/**
 * Stripe Service - Schema-Aligned Version
 * Uses subscriptions and billing_status tables
 */

import Stripe from 'stripe';
import { prisma } from '../../utils/prisma.js';
import logger from '../../config/logger.js';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover' as any,
    });
  }

  async createCustomer(organizationId: number, email: string, name?: string): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email,
      name: name || email,
      metadata: { organizationId: organizationId.toString() },
    });

    await prisma.subscriptions.upsert({
      where: { id: organizationId },
      create: { id: organizationId, tier: 'trial', billingCycle: 'monthly', status: 'trialing', stripeCustomerId: customer.id },
      update: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  async createSubscription(organizationId: number, companyId: string, priceId: string, paymentMethodId: string): Promise<Stripe.Subscription> {
    let subscription = await prisma.subscriptions.findUnique({ where: { id: organizationId } });
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const org = await prisma.organizations.findUnique({
        where: { id: organizationId },
        include: { organization_users: { include: { users: true }, take: 1 } },
      });
      const primaryUser = org?.organization_users[0]?.users;
      const customer = await this.createCustomer(organizationId, primaryUser?.email || 'noemail@accubooks.com', primaryUser?.name || org?.name);
      customerId = customer.id;
    }

    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await this.stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });

    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { organizationId: organizationId.toString(), companyId },
    });

    await prisma.subscriptions.update({
      where: { id: organizationId },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        tier: this.getTierFromPriceId(priceId),
        stripePriceId: priceId,
        updatedAt: new Date(),
      },
    });

    await prisma.billing_status.upsert({
      where: { companyId },
      create: { id: `billing_${companyId}`, companyId, planType: this.getTierFromPriceId(priceId), billingStatus: 'ACTIVE', paymentStatus: 'CURRENT', updatedAt: new Date() },
      update: { planType: this.getTierFromPriceId(priceId), billingStatus: 'ACTIVE', updatedAt: new Date() },
    });

    return stripeSubscription;
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.cancel(stripeSubscriptionId);
    await prisma.subscriptions.updateMany({
      where: { stripeSubscriptionId },
      data: { status: 'canceled', canceledAt: new Date(), updatedAt: new Date() },
    });
    return subscription;
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscriptions.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: subscription.status, updatedAt: new Date() },
    });
  }

  private getTierFromPriceId(priceId: string): string {
    const tierMap: Record<string, string> = {
      price_starter: 'starter',
      price_pro: 'pro',
      price_business: 'business',
      price_enterprise: 'enterprise',
    };
    return tierMap[priceId] || 'starter';
  }

  async getPlans(): Promise<Array<{ id: string; stripePriceId: string }>> {
    return [
      { id: 'starter', stripePriceId: 'price_starter' },
      { id: 'pro', stripePriceId: 'price_pro' },
      { id: 'business', stripePriceId: 'price_business' },
      { id: 'enterprise', stripePriceId: 'price_enterprise' },
    ];
  }
}

export const stripeService = new StripeService();
