import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '../db.js';
import * as s from '../../shared/schema.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { getPlanDefinition, type BillingTier, type EntitlementLimit } from './plan-registry.js';
import { UsageMeter, type UsageMetricType } from './usage-meter.js';

export type EntitlementCheckAction =
  | 'create_user'
  | 'create_company'
  | 'export'
  | 'api_call'
  | 'ai_tokens'
  | 'storage_gb';

export type EntitlementDecision = {
  allowed: boolean;
  warn: boolean;
  reason?: string;
  limit?: EntitlementLimit;
  current?: number;
  requested?: number;
  tier?: BillingTier;
};

export class EntitlementEngine {
  constructor(private readonly usage = new UsageMeter()) {}

  async getCurrentTier(companyId: string): Promise<BillingTier> {
    const [row] = await db
      .select({ planCode: s.plans.code })
      .from(s.subscriptions)
      .innerJoin(s.plans, eq(s.subscriptions.planId, s.plans.id))
      .where(
        and(
          eq(s.subscriptions.companyId, companyId),
          sql`${s.subscriptions.deletedAt} is null`,
          sql`${s.plans.deletedAt} is null`,
          inArray(s.subscriptions.status, ['trialing', 'active', 'past_due'] as any)
        )
      )
      .orderBy(sql`${s.subscriptions.createdAt} desc`)
      .limit(1);

    const planCode = row?.planCode as string | undefined;
    if (!planCode) return 'FREE';

    if (planCode === 'enterprise') return 'ENTERPRISE';
    if (planCode === 'business') return 'PRO';
    if (planCode === 'team') return 'STARTER';
    if (planCode === 'solo') return 'FREE';

    return 'FREE';
  }

  private getLimitForAction(tier: BillingTier, action: EntitlementCheckAction): EntitlementLimit {
    const ent = getPlanDefinition(tier).entitlements;
    switch (action) {
      case 'create_user':
        return ent.users;
      case 'create_company':
        return ent.companies;
      case 'export':
        return ent.exportsPerMonth;
      case 'api_call':
        return ent.apiCallsPerMonth;
      case 'ai_tokens':
        return ent.apiCallsPerMonth;
      case 'storage_gb':
        return ent.storageGb;
    }
  }

  private getUsageMetricForAction(action: EntitlementCheckAction): UsageMetricType | null {
    switch (action) {
      case 'api_call':
        return 'api_calls';
      case 'ai_tokens':
        return 'ai_tokens';
      case 'export':
        // We only have authoritative counters for a subset of billable events.
        // Export enforcement for Step 17 uses request-time increments.
        return null;
      default:
        return null;
    }
  }

  async check(input: {
    companyId: string;
    actorUserId: string;
    action: EntitlementCheckAction;
    requested?: number;
    correlationId: string;
  }): Promise<EntitlementDecision> {
    try {
      const tier = await this.getCurrentTier(input.companyId);
      const limit = this.getLimitForAction(tier, input.action);

      const metric = this.getUsageMetricForAction(input.action);
      let current = 0;
      if (metric) {
        const snap = await this.usage.getUsageSnapshot({ companyId: input.companyId });
        current = snap.metrics[metric] ?? 0;
      }

      const requested = input.requested ?? 1;
      const projected = current + requested;

      const hard = limit.hardLimit;
      const soft = limit.softLimit;

      const warn = typeof soft === 'number' && projected > soft;
      const deny = typeof hard === 'number' && projected > hard;

      const decision: EntitlementDecision = {
        allowed: !deny,
        warn,
        tier,
        limit,
        current,
        requested,
        reason: deny ? 'ENTITLEMENT_HARD_LIMIT' : warn ? 'ENTITLEMENT_SOFT_LIMIT' : undefined,
      };

      if (!decision.allowed) {
        getImmutableAuditLogger().logSecurityEvent({
          tenantId: input.companyId,
          actorId: input.actorUserId,
          action: 'BILLING_ENTITLEMENT_DENIED',
          resourceType: 'ENTITLEMENT',
          resourceId: input.action,
          outcome: 'FAILURE',
          correlationId: input.correlationId,
          severity: 'HIGH',
          metadata: { tier, limit, current, requested },
        });
      } else if (decision.warn) {
        getImmutableAuditLogger().logSecurityEvent({
          tenantId: input.companyId,
          actorId: input.actorUserId,
          action: 'BILLING_ENTITLEMENT_WARN',
          resourceType: 'ENTITLEMENT',
          resourceId: input.action,
          outcome: 'SUCCESS',
          correlationId: input.correlationId,
          severity: 'LOW',
          metadata: { tier, limit, current, requested },
        });
      }

      return decision;
    } catch (error) {
      getImmutableAuditLogger().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorUserId,
        action: 'BILLING_ENTITLEMENT_CHECK_ERROR',
        resourceType: 'ENTITLEMENT',
        resourceId: input.action,
        outcome: 'FAILURE',
        correlationId: input.correlationId,
        severity: 'CRITICAL',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return {
        allowed: false,
        warn: false,
        reason: 'ENTITLEMENT_ENGINE_ERROR',
      };
    }
  }
}
