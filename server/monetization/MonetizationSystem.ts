/**
 * ChronaWorkFlow Monetization System
 * Pricing Tiers, Billing Lifecycle, Feature Gating
 * Production-Ready Revenue Infrastructure
 */

import { createHash } from 'crypto';

// Pricing Tiers
export type PricingTier = 'free' | 'professional' | 'business' | 'enterprise';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  seats: {
    min: number;
    max: number | null; // null = unlimited
  };
  features: string[];
  limits: {
    transactions: number;
    storage: number; // GB
    apiCalls: number;
    reports: number;
    bankConnections: number;
  };
  trialDays: number;
  popular?: boolean;
}

export const PRICING_PLANS: Record<PricingTier, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For solo practitioners getting started',
    priceMonthly: 0,
    priceAnnual: 0,
    seats: { min: 1, max: 1 },
    features: [
      'Basic chart of accounts',
      'Manual transaction entry',
      'Simple reports',
      'Email support',
      '7-day data history'
    ],
    limits: {
      transactions: 100,
      storage: 1,
      apiCalls: 1000,
      reports: 5,
      bankConnections: 0
    },
    trialDays: 0
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing firms ready to scale',
    priceMonthly: 79,
    priceAnnual: 790, // 17% discount (2 months free)
    seats: { min: 2, max: 10 },
    features: [
      'Everything in Free, plus:',
      'Automated bank connections',
      'Real-time Trial Balance',
      'Advanced reporting',
      'Multi-user collaboration',
      'API access',
      'Priority support (4h SLA)',
      '5-Day Close Guarantee',
      'White-glove onboarding'
    ],
    limits: {
      transactions: 10000,
      storage: 50,
      apiCalls: 50000,
      reports: 100,
      bankConnections: 5
    },
    trialDays: 14,
    popular: true
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For established firms with complex needs',
    priceMonthly: 129,
    priceAnnual: 1290, // 17% discount
    seats: { min: 5, max: 50 },
    features: [
      'Everything in Professional, plus:',
      'Multi-entity consolidation',
      'Advanced workflows',
      'Custom integrations',
      'Dedicated success manager',
      'SSO/SAML',
      'Audit trail (7-year)',
      'Quarterly business reviews'
    ],
    limits: {
      transactions: 100000,
      storage: 500,
      apiCalls: 500000,
      reports: 500,
      bankConnections: 20
    },
    trialDays: 21
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom requirements',
    priceMonthly: 0, // Custom pricing
    priceAnnual: 0,
    seats: { min: 50, max: null },
    features: [
      'Everything in Business, plus:',
      'Custom pricing',
      'Dedicated infrastructure',
      'SLA guarantees',
      'Custom contracts',
      'On-premise option',
      '24/7 phone support',
      'Executive business reviews'
    ],
    limits: {
      transactions: -1, // Unlimited
      storage: -1,
      apiCalls: -1,
      reports: -1,
      bankConnections: -1
    },
    trialDays: 30
  }
};

// Feature Flags for Gating
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  tiers: PricingTier[];
  enabled: boolean;
  beta?: boolean;
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'basic_accounting', name: 'Basic Accounting', description: 'Chart of accounts, journal entries', tiers: ['free', 'professional', 'business', 'enterprise'], enabled: true },
  { id: 'bank_connections', name: 'Bank Connections', description: 'Automated bank feeds', tiers: ['professional', 'business', 'enterprise'], enabled: true },
  { id: 'real_time_tb', name: 'Real-Time Trial Balance', description: 'Live TB validation', tiers: ['professional', 'business', 'enterprise'], enabled: true },
  { id: 'advanced_reports', name: 'Advanced Reporting', description: 'Custom reports, dashboards', tiers: ['professional', 'business', 'enterprise'], enabled: true },
  { id: 'api_access', name: 'API Access', description: 'REST API for integrations', tiers: ['professional', 'business', 'enterprise'], enabled: true },
  { id: 'multi_entity', name: 'Multi-Entity', description: 'Consolidate multiple companies', tiers: ['business', 'enterprise'], enabled: true },
  { id: 'workflows', name: 'Workflow Automation', description: 'Custom approval workflows', tiers: ['business', 'enterprise'], enabled: true },
  { id: 'sso', name: 'SSO/SAML', description: 'Single sign-on', tiers: ['business', 'enterprise'], enabled: true },
  { id: 'audit_trail', name: 'Audit Trail', description: 'Immutable audit logs', tiers: ['business', 'enterprise'], enabled: true },
  { id: 'dedicated_manager', name: 'Dedicated Success Manager', description: 'Assigned CSM', tiers: ['business', 'enterprise'], enabled: true },
  { id: 'custom_contracts', name: 'Custom Contracts', description: 'Negotiated terms', tiers: ['enterprise'], enabled: true },
  { id: 'on_premise', name: 'On-Premise Option', description: 'Self-hosted deployment', tiers: ['enterprise'], enabled: true, beta: true }
];

// Billing Lifecycle
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface Subscription {
  id: string;
  customerId: string;
  tier: PricingTier;
  status: BillingStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  seats: number;
  amount: number; // in cents
  currency: string;
  billingInterval: 'month' | 'year';
  paymentMethodId?: string;
  invoiceId?: string;
}

// Revenue Metrics
export interface RevenueMetrics {
  mrr: number;
  arr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
  activeCustomers: number;
  activeTrials: number;
  trialToPaidRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  customerAcquisitionCost: number;
  ltvToCacRatio: number;
}

// Feature Access Check
export function hasFeatureAccess(tier: PricingTier, featureId: string): boolean {
  const feature = FEATURE_FLAGS.find(f => f.id === featureId);
  if (!feature) return false;
  return feature.tiers.includes(tier) && feature.enabled;
}

// Get plan by tier
export function getPlan(tier: PricingTier): PricingPlan {
  return PRICING_PLANS[tier];
}

// Calculate subscription amount
export function calculateSubscriptionAmount(tier: PricingTier, seats: number, interval: 'month' | 'year'): number {
  const plan = getPlan(tier);
  
  if (tier === 'enterprise') {
    return 0; // Custom pricing
  }
  
  const baseAmount = interval === 'year' ? plan.priceAnnual : plan.priceMonthly;
  return baseAmount * seats;
}

// Check if within limits
export function checkWithinLimits(tier: PricingTier, metric: keyof PricingPlan['limits'], current: number): boolean {
  const plan = getPlan(tier);
  const limit = plan.limits[metric];
  
  if (limit === -1) return true; // Unlimited
  return current < limit;
}

// Calculate metrics
export function calculateRevenueMetrics(subscriptions: Subscription[]): RevenueMetrics {
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
  
  const mrr = activeSubs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.billingInterval === 'year' ? s.amount / 12 : s.amount), 0);
  
  const arr = mrr * 12;
  
  // This would be calculated from historical data in production
  const newMrr = mrr * 0.1; // 10% growth assumption
  const expansionMrr = mrr * 0.05;
  const contractionMrr = mrr * 0.02;
  const churnedMrr = mrr * 0.03;
  
  const netRevenueRetention = ((mrr + expansionMrr - contractionMrr - churnedMrr) / mrr) * 100;
  const grossRevenueRetention = ((mrr - churnedMrr) / mrr) * 100;
  
  const activeCustomers = activeSubs.filter(s => s.status === 'active').length;
  const activeTrials = activeSubs.filter(s => s.status === 'trialing').length;
  const trialToPaidRate = activeTrials > 0 ? (activeCustomers / (activeCustomers + activeTrials)) * 100 : 0;
  
  const averageRevenuePerUser = activeCustomers > 0 ? mrr / activeCustomers : 0;
  
  // Simplified LTV calculation
  const lifetimeValue = averageRevenuePerUser * 24; // Assume 24-month average lifetime
  
  // Placeholder CAC (would come from marketing spend data)
  const customerAcquisitionCost = 500;
  
  const ltvToCacRatio = customerAcquisitionCost > 0 ? lifetimeValue / customerAcquisitionCost : 0;
  
  return {
    mrr,
    arr,
    newMrr,
    expansionMrr,
    contractionMrr,
    churnedMrr,
    netRevenueRetention,
    grossRevenueRetention,
    activeCustomers,
    activeTrials,
    trialToPaidRate,
    averageRevenuePerUser,
    lifetimeValue,
    customerAcquisitionCost,
    ltvToCacRatio
  };
}

// Billing lifecycle state machine
export function getNextBillingStatus(current: BillingStatus, event: 'payment_succeeded' | 'payment_failed' | 'trial_ended' | 'canceled'): BillingStatus {
  switch (current) {
    case 'trialing':
      if (event === 'trial_ended') return 'past_due';
      if (event === 'payment_succeeded') return 'active';
      if (event === 'canceled') return 'canceled';
      break;
    case 'active':
      if (event === 'payment_failed') return 'past_due';
      if (event === 'canceled') return 'canceled';
      break;
    case 'past_due':
      if (event === 'payment_succeeded') return 'active';
      if (event === 'payment_failed') return 'unpaid';
      break;
    case 'unpaid':
      if (event === 'payment_succeeded') return 'active';
      if (event === 'canceled') return 'canceled';
      break;
  }
  return current;
}

// Invoice generation
export interface Invoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  createdAt: Date;
  dueDate: Date;
  paidAt?: Date;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  period?: {
    start: Date;
    end: Date;
  };
}

export function generateInvoice(subscription: Subscription): Invoice {
  const plan = getPlan(subscription.tier);
  const amount = subscription.amount;
  
  const lineItem: InvoiceLineItem = {
    description: `${plan.name} Plan - ${subscription.seats} user${subscription.seats > 1 ? 's' : ''}`,
    amount,
    quantity: subscription.seats,
    unitPrice: amount / subscription.seats,
    period: {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd
    }
  };
  
  return {
    id: `inv_${Date.now()}`,
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    amount,
    currency: subscription.currency,
    status: 'draft',
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 86400000 * 30), // 30 days
    lineItems: [lineItem]
  };
}

// Export for CEO dashboard
export function getMonetizationMetrics(): RevenueMetrics {
  // Mock data - in production this queries the database
  const mockSubscriptions: Subscription[] = [
    {
      id: 'sub_1',
      customerId: 'cust_1',
      tier: 'professional',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30),
      cancelAtPeriodEnd: false,
      seats: 5,
      amount: 39500, // $395.00 (annual)
      currency: 'usd',
      billingInterval: 'year'
    },
    {
      id: 'sub_2',
      customerId: 'cust_2',
      tier: 'professional',
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86400000 * 14),
      trialEnd: new Date(Date.now() + 86400000 * 14),
      cancelAtPeriodEnd: false,
      seats: 3,
      amount: 0,
      currency: 'usd',
      billingInterval: 'month'
    }
  ];
  
  return calculateRevenueMetrics(mockSubscriptions);
}

export default {
  PRICING_PLANS,
  FEATURE_FLAGS,
  hasFeatureAccess,
  getPlan,
  calculateSubscriptionAmount,
  checkWithinLimits,
  calculateRevenueMetrics,
  getNextBillingStatus,
  generateInvoice,
  getMonetizationMetrics
};
