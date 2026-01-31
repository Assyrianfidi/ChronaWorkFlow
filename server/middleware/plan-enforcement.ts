import type { NextFunction, Request, Response } from "express";
import { and, eq, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import * as s from "../../shared/schema";
import { getPlanEntitlements } from "../services/pricing.service";

export async function getCurrentPlan(companyId: string): Promise<{ plan: typeof s.plans.$inferSelect; entitlements: any }> {
  const [row] = await db
    .select({ plan: s.plans })
    .from(s.subscriptions)
    .innerJoin(s.plans, eq(s.subscriptions.planId, s.plans.id))
    .where(
      and(
        eq(s.subscriptions.companyId, companyId),
        sql`${s.subscriptions.deletedAt} is null`,
        sql`${s.plans.deletedAt} is null`,
        sql`${s.subscriptions.status} IN ('trialing', 'active', 'past_due')`,
      ),
    )
    .orderBy(sql`${s.subscriptions.createdAt} desc`)
    .limit(1);

  if (!row || !row.plan) throw new Error("No active plan found");

  const entitlements = getPlanEntitlements(row.plan.code);
  return { plan: row.plan, entitlements };
}

export function enforcePlanLimits(action: "users" | "entities" | "workflows" | "api" | "ai") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).user?.currentCompanyId;
      if (!companyId) return next();

      const { entitlements } = await getCurrentPlan(companyId);
      const currentUsage = await getCurrentUsage(companyId, action);

      let limit = 0;
      let metric = 0;

      switch (action) {
        case "users":
          limit = entitlements.maxUsers;
          metric = currentUsage.activeUsers ?? 0;
          break;
        case "entities":
          limit = entitlements.maxEntities;
          metric = currentUsage.entities ?? 0;
          break;
        case "workflows":
          limit = entitlements.maxWorkflowsPerMonth;
          metric = currentUsage.workflowsThisMonth ?? 0;
          break;
        case "api":
          limit = entitlements.maxApiCallsPerMonth;
          metric = currentUsage.apiCallsThisMonth ?? 0;
          break;
        case "ai":
          limit = entitlements.maxAiTokensPerMonth;
          metric = currentUsage.aiTokensThisMonth ?? 0;
          break;
      }

      if (metric >= limit) {
        return res.status(403).json({
          error: `Plan limit exceeded for ${action}. Limit: ${limit}, Current: ${metric}`,
          code: "PLAN_LIMIT_EXCEEDED",
          action,
          limit,
          current: metric,
          upgradeUrl: "/billing/plans",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireFeature(feature: keyof ReturnType<typeof getPlanEntitlements>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).user?.currentCompanyId;
      if (!companyId) return next();

      const { entitlements } = await getCurrentPlan(companyId);
      if (!entitlements[feature]) {
        return res.status(403).json({
          error: `Feature not available in current plan. Upgrade to access ${feature}.`,
          code: "FEATURE_NOT_AVAILABLE",
          feature,
          upgradeUrl: "/billing/plans",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

async function getCurrentUsage(companyId: string, action: string) {
  // Placeholder: implement real usage counters
  switch (action) {
    case "users": {
      const activeUsers = await db
        .select()
        .from(s.users)
        .where(eq(s.users.currentCompanyId, companyId))
        .then((r) => r.length);
      return { activeUsers };
    }
    case "entities": {
      const customers = await db
        .select({ id: s.customers.id })
        .from(s.customers)
        .where(eq(s.customers.companyId, companyId))
        .then((r) => r.length);

      const vendors = await db
        .select({ id: s.vendors.id })
        .from(s.vendors)
        .where(eq(s.vendors.companyId, companyId))
        .then((r) => r.length);

      const entities = customers + vendors;
      return { entities };
    }
    case "workflows": {
      // Count workflow instances this month
      const workflowsThisMonth = await db
        .select()
        .from(s.workflowInstances)
        .where(
          and(
            eq(s.workflowInstances.companyId, companyId),
            sql`${s.workflowInstances.startedAt} >= date_trunc('month', current_date)`
          )
        )
        .then((r) => r.length);
      return { workflowsThisMonth };
    }
    case "api":
      // Placeholder: implement API usage tracking
      return { apiCallsThisMonth: 0 };
    case "ai":
      // Placeholder: implement AI token usage tracking
      return { aiTokensThisMonth: 0 };
    default:
      return {};
  }
}
