import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import * as s from '../../shared/schema.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';

export type UsageMetricType = 'api_calls' | 'ai_tokens' | 'invoices_created' | 'users_count';

export type UsageSnapshot = {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  metrics: Record<UsageMetricType, number>;
};

function getPeriodStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function getPeriodEnd(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export class UsageMeter {
  async getUsageSnapshot(input: { companyId: string; at?: Date }): Promise<UsageSnapshot> {
    const at = input.at ?? new Date();
    const periodStart = getPeriodStart(at);
    const periodEnd = getPeriodEnd(at);

    const rows = await db
      .select({ metricType: s.usageMetrics.metricType, quantity: s.usageMetrics.quantity })
      .from(s.usageMetrics)
      .where(
        and(
          eq(s.usageMetrics.companyId, input.companyId),
          eq(s.usageMetrics.billingPeriodStart, periodStart),
          eq(s.usageMetrics.billingPeriodEnd, periodEnd)
        )
      );

    const metrics: Record<UsageMetricType, number> = {
      api_calls: 0,
      ai_tokens: 0,
      invoices_created: 0,
      users_count: 0,
    };

    for (const r of rows) {
      const k = r.metricType as UsageMetricType;
      metrics[k] = Number(r.quantity ?? 0);
    }

    return { companyId: input.companyId, periodStart, periodEnd, metrics };
  }

  async incrementUsage(input: {
    companyId: string;
    metricType: UsageMetricType;
    delta: number;
    actorUserId: string;
    correlationId: string;
    at?: Date;
  }): Promise<void> {
    const at = input.at ?? new Date();
    const periodStart = getPeriodStart(at);
    const periodEnd = getPeriodEnd(at);

    await db.transaction(async tx => {
      const [existing] = await tx
        .select()
        .from(s.usageMetrics)
        .where(
          and(
            eq(s.usageMetrics.companyId, input.companyId),
            eq(s.usageMetrics.metricType, input.metricType),
            eq(s.usageMetrics.billingPeriodStart, periodStart),
            eq(s.usageMetrics.billingPeriodEnd, periodEnd)
          )
        )
        .limit(1);

      if (!existing) {
        await tx.insert(s.usageMetrics).values({
          companyId: input.companyId,
          metricType: input.metricType,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          quantity: String(input.delta),
        } as any);
      } else {
        await tx
          .update(s.usageMetrics)
          .set({
            quantity: sql`${s.usageMetrics.quantity} + ${input.delta}`,
            updatedAt: new Date(),
          } as any)
          .where(eq(s.usageMetrics.id, existing.id));
      }
    });

    getImmutableAuditLogger().logSecurityEvent({
      tenantId: input.companyId,
      actorId: input.actorUserId,
      action: 'BILLING_USAGE_INCREMENT',
      resourceType: 'USAGE_METER',
      resourceId: input.metricType,
      outcome: 'SUCCESS',
      correlationId: input.correlationId,
      severity: 'LOW',
      metadata: { delta: input.delta, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() },
    });
  }
}
