import { db } from "../db";
import * as s from "../../shared/schema";
import { eq } from "drizzle-orm";
import { PRICING_MONTHLY_USD, PRICING_ANNUAL_USD, getPlanEntitlements } from "../services/pricing.service";

export async function seedPricingPlans() {
  console.log("Seeding pricing plans...");

  const plans = [
    {
      code: "solo",
      name: "Solo",
      description: "For individual accountants and freelancers",
      priceCents: PRICING_MONTHLY_USD.solo * 100,
      billingInterval: "month" as const,
      stripeProductId: null,
      stripePriceId: null,
      includedUsers: 1,
      includedInvoices: 50,
      includedAiTokens: 0,
      includedApiCalls: 1000,
      maxUsers: 1,
      maxInvoices: 100,
      maxAiTokens: 0,
      maxApiCalls: 1000,
      allowApiAccess: false,
      allowAuditExports: false,
      allowAdvancedAnalytics: false,
    },
    {
      code: "team",
      name: "Team",
      description: "For small teams and growing businesses",
      priceCents: PRICING_MONTHLY_USD.team * 100,
      billingInterval: "month" as const,
      stripeProductId: null,
      stripePriceId: null,
      includedUsers: 5,
      includedInvoices: 500,
      includedAiTokens: 10000,
      includedApiCalls: 5000,
      maxUsers: 5,
      maxInvoices: 1000,
      maxAiTokens: 10000,
      maxApiCalls: 5000,
      allowApiAccess: false,
      allowAuditExports: true,
      allowAdvancedAnalytics: true,
    },
    {
      code: "business",
      name: "Business",
      description: "For established businesses with multiple entities",
      priceCents: PRICING_MONTHLY_USD.business * 100,
      billingInterval: "month" as const,
      stripeProductId: null,
      stripePriceId: null,
      includedUsers: 25,
      includedInvoices: 2000,
      includedAiTokens: 100000,
      includedApiCalls: 25000,
      maxUsers: 25,
      maxInvoices: 5000,
      maxAiTokens: 100000,
      maxApiCalls: 25000,
      allowApiAccess: true,
      allowAuditExports: true,
      allowAdvancedAnalytics: true,
    },
    {
      code: "enterprise",
      name: "Enterprise",
      description: "For large enterprises with complex workflows",
      priceCents: PRICING_MONTHLY_USD.enterprise * 100,
      billingInterval: "month" as const,
      stripeProductId: null,
      stripePriceId: null,
      includedUsers: 100,
      includedInvoices: 10000,
      includedAiTokens: 1000000,
      includedApiCalls: 100000,
      maxUsers: 100,
      maxInvoices: 25000,
      maxAiTokens: 1000000,
      maxApiCalls: 100000,
      allowApiAccess: true,
      allowAuditExports: true,
      allowAdvancedAnalytics: true,
    },
    {
      code: "holding",
      name: "Holding Company",
      description: "For holding companies and multinational corporations",
      priceCents: PRICING_MONTHLY_USD.holding * 100,
      billingInterval: "month" as const,
      stripeProductId: null,
      stripePriceId: null,
      includedUsers: 500,
      includedInvoices: 50000,
      includedAiTokens: 5000000,
      includedApiCalls: 500000,
      maxUsers: 500,
      maxInvoices: 100000,
      maxAiTokens: 5000000,
      maxApiCalls: 500000,
      allowApiAccess: true,
      allowAuditExports: true,
      allowAdvancedAnalytics: true,
    },
  ];

  // Also create annual versions
  const annualPlans = plans.map((p) => ({
    ...p,
    code: `${p.code}_annual`,
    name: `${p.name} (Annual)`,
    priceCents: PRICING_ANNUAL_USD[p.code as keyof typeof PRICING_ANNUAL_USD] * 100,
    billingInterval: "year" as const,
  }));

  const allPlans = [...plans, ...annualPlans];

  for (const plan of allPlans) {
    const existing = await db.select().from(s.plans).where(eq(s.plans.code, plan.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(s.plans).values(plan);
      console.log(`Created plan: ${plan.code}`);
    } else {
      console.log(`Plan already exists: ${plan.code}`);
    }
  }

  console.log("Pricing plans seeded.");
}

if (require.main === module) {
  seedPricingPlans().catch(console.error);
}
