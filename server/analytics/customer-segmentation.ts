// Tenant-Isolated Customer Segmentation
// Deterministic segmentation with strict RBAC enforcement and immutable audit logging

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

import { logger } from '../utils/structured-logger.js';

import { TenantContext } from '../tenant/tenant-isolation.js';

import { AuthorizationEngine } from '../auth/authorization-engine.js';
import { ServiceAuthorizationGuard } from '../auth/authorization-guards.js';
import { Permission } from '../auth/tenant-permissions.js';

import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';

const segmentationTenantContext = new AsyncLocalStorage<TenantContext>();

export const runWithTenantContext = async <T>(tenantContext: TenantContext, fn: () => Promise<T>): Promise<T> => {
  return await segmentationTenantContext.run(tenantContext, fn);
};

const getTenantContextOrThrow = (): TenantContext => {
  const ctx = segmentationTenantContext.getStore();
  if (!ctx) {
    throw new Error('TENANT_CONTEXT_REQUIRED');
  }
  return ctx;
};

export type CustomerSegmentKey = 'HIGH_VALUE' | 'AT_RISK' | 'NEW' | 'STANDARD';

export interface CustomerSegmentRuleEvidence {
  totalInvoiced: number;
  totalPaid: number;
  overdueCount: number;
  invoiceCount: number;
  balance: number;
  lastInvoiceDate?: Date;
  firstInvoiceDate?: Date;
  createdAt: Date;
  daysSinceLastInvoice?: number;
  daysSinceFirstInvoice?: number;
  daysSinceCreated: number;
}

export interface CustomerSegmentedProfile {
  customerId: string;
  companyId: string;
  tenantId: string;
  name: string;
  email?: string;
  isActive: boolean;
  segment: CustomerSegmentKey;
  confidence: number; // 0..1
  evidence: CustomerSegmentRuleEvidence;
}

export interface CustomerSegmentationReport {
  tenantId: string;
  generatedAt: Date;
  windowDays: number;
  counts: Record<CustomerSegmentKey, number>;
  customers: CustomerSegmentedProfile[];
  model: {
    provider: 'DETERMINISTIC' | 'ML_PLACEHOLDER';
    version: string;
    notes?: string;
  };
}

interface CustomerStatsRow {
  customerId: string;
  companyId: string;
  name: string;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  balance: string | number | null;
  totalInvoiced: string | number | null;
  totalPaid: string | number | null;
  overdueCount: string | number | null;
  invoiceCount: string | number | null;
  lastInvoiceDate: Date | null;
  firstInvoiceDate: Date | null;
}

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const toNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const daysBetween = (a: Date, b: Date): number => {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const stableId = (parts: string[]): string => {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
};

export class CustomerSegmentationEngine {
  private static instance: CustomerSegmentationEngine | null = null;

  private prisma: PrismaClient;
  private authorizationEngine: AuthorizationEngine;
  private serviceGuard: ServiceAuthorizationGuard;
  private auditLogger: any;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.authorizationEngine = new AuthorizationEngine(prisma);
    this.serviceGuard = new ServiceAuthorizationGuard(this.authorizationEngine);
    this.auditLogger = getImmutableAuditLogger(prisma);
  }

  static getInstance(prisma?: PrismaClient): CustomerSegmentationEngine {
    if (!CustomerSegmentationEngine.instance) {
      if (!prisma) {
        throw new Error('PRISMA_REQUIRED');
      }
      CustomerSegmentationEngine.instance = new CustomerSegmentationEngine(prisma);
    }
    return CustomerSegmentationEngine.instance;
  }

  private async requirePermission(
    tenantContext: TenantContext,
    permission: Permission,
    operation: string,
    requestId: string,
    resource?: { type: string; id: string; tenantId?: string }
  ): Promise<void> {
    const result = await this.serviceGuard.requirePermission(tenantContext, {
      permission,
      resource: resource
        ? {
            type: resource.type,
            id: resource.id,
            tenantId: resource.tenantId ?? tenantContext.tenantId
          }
        : undefined,
      operation,
      requestId
    });

    if (!result.authorized) {
      throw new Error('PERMISSION_DENIED');
    }
  }

  private sanitizeError(err: unknown): Error {
    const e = err as Error;
    const msg = (e?.message || 'INTERNAL_ERROR').toUpperCase();

    const safeCodes = new Set([
      'TENANT_CONTEXT_REQUIRED',
      'PERMISSION_DENIED',
      'TENANT_ISOLATION_VIOLATION',
      'INTERNAL_ERROR'
    ]);

    if (safeCodes.has(msg)) return new Error(msg);
    return new Error('INTERNAL_ERROR');
  }

  private async loadCustomerStats(tenantId: string): Promise<CustomerStatsRow[]> {
    // NOTE: Prisma schema in this repo may not model business tables, so we use tenant-scoped raw SQL.
    // CRITICAL: Always join through `companies` to enforce tenant isolation at the query level.
    const rows = (await this.prisma.$queryRaw`
      SELECT
        c.id AS "customerId",
        c.company_id AS "companyId",
        c.name AS "name",
        c.email AS "email",
        c.is_active AS "isActive",
        c.created_at AS "createdAt",
        c.balance AS "balance",
        COALESCE(SUM(i.total), 0) AS "totalInvoiced",
        COALESCE(SUM(i.amount_paid), 0) AS "totalPaid",
        COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN 1 ELSE 0 END), 0) AS "overdueCount",
        COALESCE(COUNT(i.id), 0) AS "invoiceCount",
        MAX(i.date) AS "lastInvoiceDate",
        MIN(i.date) AS "firstInvoiceDate"
      FROM customers c
      INNER JOIN companies co ON co.id = c.company_id
      LEFT JOIN invoices i ON i.customer_id = c.id AND i.company_id = c.company_id
      WHERE co.tenant_id = ${tenantId}
      GROUP BY c.id, c.company_id, c.name, c.email, c.is_active, c.created_at, c.balance
      ORDER BY c.created_at DESC
    `) as CustomerStatsRow[];

    return rows;
  }

  private segmentCustomers(tenantId: string, rows: CustomerStatsRow[]): CustomerSegmentedProfile[] {
    const now = new Date();

    // Precompute numeric metrics and a stable ordering.
    const customers = rows.map((r) => {
      const totalInvoiced = toNumber(r.totalInvoiced, 0);
      const totalPaid = toNumber(r.totalPaid, 0);
      const overdueCount = toNumber(r.overdueCount, 0);
      const invoiceCount = toNumber(r.invoiceCount, 0);
      const balance = toNumber(r.balance, 0);

      const daysSinceCreated = daysBetween(now, r.createdAt);
      const daysSinceLastInvoice = r.lastInvoiceDate ? daysBetween(now, r.lastInvoiceDate) : undefined;
      const daysSinceFirstInvoice = r.firstInvoiceDate ? daysBetween(now, r.firstInvoiceDate) : undefined;

      return {
        raw: r,
        metrics: {
          totalInvoiced,
          totalPaid,
          overdueCount,
          invoiceCount,
          balance,
          daysSinceCreated,
          daysSinceLastInvoice,
          daysSinceFirstInvoice
        }
      };
    });

    // Deterministic "high-value" selection: top 20% by invoiced volume, minimum 1.
    const byValue = [...customers].sort((a, b) => {
      if (b.metrics.totalInvoiced !== a.metrics.totalInvoiced) {
        return b.metrics.totalInvoiced - a.metrics.totalInvoiced;
      }
      return a.raw.customerId.localeCompare(b.raw.customerId);
    });

    const highValueCount = Math.max(1, Math.ceil(byValue.length * 0.2));
    const highValueSet = new Set(byValue.slice(0, highValueCount).map((x) => x.raw.customerId));

    return customers
      .map((c) => {
        const r = c.raw;
        const m = c.metrics;

        const isNew = m.daysSinceCreated <= 30 || (m.daysSinceFirstInvoice !== undefined && m.daysSinceFirstInvoice <= 30);

        const isAtRisk =
          m.overdueCount > 0 ||
          (m.daysSinceLastInvoice !== undefined && m.daysSinceLastInvoice >= 90 && (m.totalInvoiced > 0 || m.balance > 0));

        const isHighValue = highValueSet.has(r.customerId) || m.totalInvoiced >= 10000;

        let segment: CustomerSegmentKey = 'STANDARD';
        let confidence = 0.6;

        // Deterministic precedence:
        // - HIGH_VALUE beats AT_RISK/NEW (exec teams usually want high-value customers surfaced)
        // - AT_RISK beats NEW
        if (isHighValue) {
          segment = 'HIGH_VALUE';
          confidence = 0.8;
        } else if (isAtRisk) {
          segment = 'AT_RISK';
          confidence = 0.85;
        } else if (isNew) {
          segment = 'NEW';
          confidence = 0.75;
        }

        const evidence: CustomerSegmentRuleEvidence = {
          totalInvoiced: m.totalInvoiced,
          totalPaid: m.totalPaid,
          overdueCount: m.overdueCount,
          invoiceCount: m.invoiceCount,
          balance: m.balance,
          lastInvoiceDate: r.lastInvoiceDate ?? undefined,
          firstInvoiceDate: r.firstInvoiceDate ?? undefined,
          createdAt: r.createdAt,
          daysSinceLastInvoice: m.daysSinceLastInvoice,
          daysSinceFirstInvoice: m.daysSinceFirstInvoice,
          daysSinceCreated: m.daysSinceCreated
        };

        return {
          customerId: r.customerId,
          companyId: r.companyId,
          tenantId,
          name: r.name,
          email: r.email ?? undefined,
          isActive: r.isActive,
          segment,
          confidence: clamp(confidence, 0, 1),
          evidence
        };
      })
      .sort((a, b) => {
        // Deterministic output ordering.
        if (a.segment !== b.segment) return a.segment.localeCompare(b.segment);
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return a.customerId.localeCompare(b.customerId);
      });
  }

  private auditSegmentationEvent(input: {
    tenantId: string;
    actorId: string;
    requestId: string;
    outcome: 'SUCCESS' | 'DENIED';
    counts?: Record<CustomerSegmentKey, number>;
  }): void {
    const integrityHash = createHash('sha256')
      .update(JSON.stringify({
        tenantId: input.tenantId,
        actorId: input.actorId,
        requestId: input.requestId,
        outcome: input.outcome,
        counts: input.counts ?? null
      }))
      .digest('hex');

    this.auditLogger.logAuthorizationDecision({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: 'CUSTOMER_SEGMENTATION',
      resourceType: 'ANALYTICS',
      resourceId: input.tenantId,
      outcome: input.outcome,
      correlationId: input.requestId || `customer_seg_${Date.now()}`,
      metadata: {
        who: input.actorId,
        what: 'CUSTOMER_SEGMENTATION',
        when: new Date().toISOString(),
        why: 'Tenant customer segmentation requested',
        requestId: input.requestId,
        counts: input.counts,
        integrityHash
      }
    });
  }

  async getTenantCustomerSegmentation(tenantId: string): Promise<CustomerSegmentationReport> {
    const tenantContext = getTenantContextOrThrow();
    const requestId = (tenantContext as any).requestId || 'unknown';
    const actorId = (tenantContext as any).user?.id || 'system';

    try {
      if (tenantContext.tenantId !== tenantId) {
        throw new Error('TENANT_ISOLATION_VIOLATION');
      }

      await this.requirePermission(tenantContext, 'reports:read', 'get_customer_segmentation', requestId, {
        type: 'TENANT',
        id: tenantId,
        tenantId
      });

      const rows = await this.loadCustomerStats(tenantId);
      const customers = this.segmentCustomers(tenantId, rows);

      const counts: Record<CustomerSegmentKey, number> = {
        HIGH_VALUE: 0,
        AT_RISK: 0,
        NEW: 0,
        STANDARD: 0
      };

      for (const c of customers) {
        counts[c.segment] = (counts[c.segment] || 0) + 1;
      }

      const report: CustomerSegmentationReport = {
        tenantId,
        generatedAt: new Date(),
        windowDays: 90,
        counts,
        customers,
        model: {
          provider: 'DETERMINISTIC',
          version: 'v1',
          notes: 'Deterministic segmentation rules. Replace with ML clustering later.'
        }
      };

      this.auditSegmentationEvent({
        tenantId,
        actorId,
        requestId,
        outcome: 'SUCCESS',
        counts
      });

      return report;
    } catch (err) {
      const safe = this.sanitizeError(err);

      this.auditSegmentationEvent({
        tenantId: tenantContext.tenantId,
        actorId,
        requestId,
        outcome: safe.message === 'PERMISSION_DENIED' ? 'DENIED' : 'DENIED'
      });

      throw safe;
    }
  }
}

let globalPrisma: PrismaClient | null = null;

export const initializeCustomerSegmentationEngine = (prisma: PrismaClient): void => {
  globalPrisma = prisma;
  CustomerSegmentationEngine.getInstance(prisma);
};

export async function getTenantCustomerSegmentation(tenantId: string): Promise<CustomerSegmentationReport> {
  if (!globalPrisma) {
    throw new Error('INTERNAL_ERROR');
  }

  const engine = CustomerSegmentationEngine.getInstance(globalPrisma);
  return await engine.getTenantCustomerSegmentation(tenantId);
}

export const getCustomerSegmentationPreview = async (tenantId: string): Promise<Array<{ id: string; segment: CustomerSegmentKey }>> => {
  const report = await getTenantCustomerSegmentation(tenantId);
  return report.customers.map((c) => ({
    id: stableId([c.tenantId, c.customerId, c.segment]),
    segment: c.segment
  }));
};
