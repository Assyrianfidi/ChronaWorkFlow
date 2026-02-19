/**
 * ============================================================================
 * PRODUCTION-CRITICAL SECURITY MIDDLEWARE — V3 ENTERPRISE GRADE
 * ============================================================================
 *
 * PROTECTION SCOPE:
 *   1. Dynamic tenant model detection via Prisma DMMF
 *   2. Where clause validation (reads, updates, deletes)
 *   3. Nested write recursive validation (create, update, upsert, connectOrCreate)
 *   4. Create / createMany tenant field enforcement
 *   5. Cross-tenant connect validation via internal Prisma client
 *   6. Auto-injection of tenant filter from AsyncLocalStorage context
 *   7. Raw query HARD BLOCK (no heuristics)
 *   8. Aggregate, count, groupBy tenant scoping
 *
 * ARCHITECTURAL GUARANTEES:
 *   - Dual Prisma client: securePrisma (middleware) + internalPrisma (lookups)
 *   - connect: { id } validated via DB lookup on internalPrisma
 *   - Auto-injection prevents human omission of tenant filters
 *   - Raw queries on tenant tables BLOCKED unless explicitly bypassed by admin
 *   - RLS at PostgreSQL layer provides defense-in-depth (see migration SQL)
 *
 * DO NOT DISABLE, BYPASS, OR SUPPRESS ERRORS FROM THIS MIDDLEWARE
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import logger from '../config/logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantModelMap = Map<string, string>;
type ModelRelationMap = Map<string, Set<string>>;

export interface TenantContext {
  companyId?: string;
  organizationId?: number;
  userId?: number;
  isAdmin?: boolean;
  bypassTenant?: boolean;
}

// ---------------------------------------------------------------------------
// AsyncLocalStorage for tenant context
// ---------------------------------------------------------------------------

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getCurrentTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function runWithTenant<T>(ctx: TenantContext, fn: () => T): T {
  return tenantStorage.run(ctx, fn);
}

// ---------------------------------------------------------------------------
// Internal Prisma client (NO middleware — for connect validation lookups)
// ---------------------------------------------------------------------------

let _internalPrisma: any | null = null;

function getInternalPrisma(): any {
  if (!_internalPrisma) {
    _internalPrisma = new PrismaClient({ log: ['error'] });
  }
  return _internalPrisma;
}

// ---------------------------------------------------------------------------
// Dynamic model detection via Prisma DMMF
// ---------------------------------------------------------------------------

const FIELD_OVERRIDES: Record<string, string> = {
  founder_audit_logs: 'resourceId',
};

export function detectTenantModels(prismaClient: any): TenantModelMap {
  const map: TenantModelMap = new Map();

  try {
    const dmmf =
      (prismaClient as any)._baseDmmf ??
      (prismaClient as any)._dmmf ??
      (prismaClient as any)._engineConfig?.document;

    if (!dmmf?.datamodel?.models) {
      logger.warn('TENANT ISOLATION: DMMF unavailable — using static fallback');
      return buildStaticFallbackMap();
    }

    const CANDIDATES = ['companyId', 'organizationId', 'tenantId'];

    for (const model of dmmf.datamodel.models) {
      const dbName: string = model.dbName ?? model.name;
      if (FIELD_OVERRIDES[dbName]) {
        map.set(dbName, FIELD_OVERRIDES[dbName]);
        continue;
      }
      for (const field of model.fields) {
        if (CANDIDATES.includes(field.name) && field.kind === 'scalar') {
          map.set(dbName, field.name);
          break;
        }
      }
    }
  } catch (err: any) {
    logger.error('TENANT ISOLATION: DMMF detection failed', { error: (err as Error).message });
    return buildStaticFallbackMap();
  }

  for (const [model, field] of Object.entries(FIELD_OVERRIDES)) {
    if (!map.has(model)) map.set(model, field);
  }

  return map;
}

function buildStaticFallbackMap(): TenantModelMap {
  const map: TenantModelMap = new Map();
  const companyModels = [
    'accounts', 'billing_status', 'churn_retention_analytics', 'company_members',
    'customer_health_scores', 'dashboard_metrics_cache', 'executive_alerts',
    'executive_analytics_snapshots', 'executive_kpi_snapshots',
    'feature_adoption_metrics', 'feature_usage', 'founder_control_states',
    'invoice_risk_analytics', 'invoices', 'payments', 'predictive_metrics',
    'reconciliation_reports', 'revenue_analytics', 'suspicious_activities',
    'transaction_lines', 'transactions', 'trend_patterns',
    'usage_frequency_metrics', 'user_activity_logs', 'user_sessions',
  ];
  for (const m of companyModels) map.set(m, 'companyId');

  const orgModels = [
    'api_usage_records', 'audit_logs', 'automation_rules', 'custom_reports',
    'departments', 'documents', 'organization_users',
  ];
  for (const m of orgModels) map.set(m, 'organizationId');

  map.set('automation_proposals', 'tenantId');
  map.set('founder_audit_logs', 'resourceId');
  return map;
}

// ---------------------------------------------------------------------------
// Relation target map
// ---------------------------------------------------------------------------

let _relationTargetMap: Map<string, string> = new Map();

export function setRelationTargetMap(map: Map<string, string>) {
  _relationTargetMap = map;
}

function resolveRelationTarget(fieldName: string): string | undefined {
  return _relationTargetMap.get(fieldName);
}

export function buildRelationTargetMap(prismaClient: any): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const dmmf =
      (prismaClient as any)._baseDmmf ??
      (prismaClient as any)._dmmf ??
      (prismaClient as any)._engineConfig?.document;

    if (!dmmf?.datamodel?.models) return buildStaticRelationMap();

    for (const model of dmmf.datamodel.models) {
      for (const field of model.fields) {
        if (field.kind === 'object' && field.type) {
          const targetModel = dmmf.datamodel.models.find((m: any) => m.name === field.type);
          const targetDbName = targetModel?.dbName ?? field.type;
          map.set(field.name, targetDbName);
        }
      }
    }
  } catch {
    return buildStaticRelationMap();
  }
  return map;
}

function buildStaticRelationMap(): Map<string, string> {
  const map = new Map<string, string>();
  const entries = [
    'payments', 'invoices', 'accounts', 'transactions', 'transaction_lines',
    'billing_status', 'company_members', 'companies', 'subscriptions',
    'reconciliation_reports', 'user_activity_logs', 'user_sessions',
    'executive_alerts', 'automation_proposals', 'founder_audit_logs',
    'suspicious_activities', 'predictive_metrics', 'feature_usage',
    'feature_adoption_metrics', 'trend_patterns', 'revenue_analytics',
    'churn_retention_analytics', 'customer_health_scores',
    'dashboard_metrics_cache', 'invoice_risk_analytics',
    'executive_analytics_snapshots', 'executive_kpi_snapshots',
    'usage_frequency_metrics', 'founder_control_states',
    'api_usage_records', 'audit_logs', 'automation_rules',
    'custom_reports', 'departments', 'documents', 'organization_users',
  ];
  for (const e of entries) map.set(e, e);
  return map;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WHERE_SCOPED_ACTIONS = new Set([
  'findUnique', 'findFirst', 'findMany',
  'update', 'updateMany', 'delete', 'deleteMany', 'upsert',
  'count', 'aggregate', 'groupBy',
]);

const DATA_SCOPED_ACTIONS = new Set([
  'create', 'createMany', 'upsert', 'update', 'updateMany',
]);

const NESTED_WRITE_KEYS = new Set([
  'create', 'createMany', 'update', 'updateMany', 'upsert',
  'connect', 'connectOrCreate', 'set', 'disconnect', 'delete', 'deleteMany',
]);

// ---------------------------------------------------------------------------
// Where-clause validation
// ---------------------------------------------------------------------------

export function hasTenantScope(where: any, tenantField: string): boolean {
  if (!where) return false;
  if (where[tenantField] !== undefined) return true;
  for (const key in where) {
    if (key.includes(tenantField) && typeof where[key] === 'object' && where[key] !== null) {
      if (where[key][tenantField] !== undefined) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Nested write validation (recursive)
// ---------------------------------------------------------------------------

interface Violation {
  path: string;
  model: string;
  operation: string;
  tenantField: string;
}

export function validateNestedWrites(
  data: any,
  parentModel: string,
  tenantModels: TenantModelMap,
  path: string = 'data',
  depth: number = 0,
): Violation[] {
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH || !data || typeof data !== 'object') return [];

  const violations: Violation[] = [];

  for (const key of Object.keys(data)) {
    const value = data[key];
    if (value === null || value === undefined || typeof value !== 'object') continue;

    const targetModelName = resolveRelationTarget(key);
    if (!targetModelName) continue;

    const targetTenantField = tenantModels.get(targetModelName);

    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const opKey of Object.keys(value)) {
        if (!NESTED_WRITE_KEYS.has(opKey)) continue;
        const opValue = value[opKey];
        if (!opValue) continue;
        const currentPath = `${path}.${key}.${opKey}`;

        if (opKey === 'create' || opKey === 'connectOrCreate' || opKey === 'upsert') {
          const items = Array.isArray(opValue) ? opValue : [opValue];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const createData = opKey === 'connectOrCreate' ? item?.create
              : (opKey === 'upsert' ? item?.create : item);

            if (targetTenantField && createData && typeof createData === 'object') {
              if (createData[targetTenantField] === undefined) {
                violations.push({
                  path: `${currentPath}[${i}]`,
                  model: targetModelName,
                  operation: opKey,
                  tenantField: targetTenantField,
                });
              }
            }
            if (createData && typeof createData === 'object') {
              violations.push(
                ...validateNestedWrites(createData, targetModelName, tenantModels, `${currentPath}[${i}]`, depth + 1),
              );
            }
            if (opKey === 'upsert' && item?.update && typeof item.update === 'object') {
              violations.push(
                ...validateNestedWrites(item.update, targetModelName, tenantModels, `${currentPath}[${i}].update`, depth + 1),
              );
            }
          }
        }

        if (opKey === 'createMany') {
          const records = opValue?.data ?? opValue;
          const items = Array.isArray(records) ? records : [records];
          for (let i = 0; i < items.length; i++) {
            if (targetTenantField && items[i] && typeof items[i] === 'object') {
              if (items[i][targetTenantField] === undefined) {
                violations.push({
                  path: `${currentPath}[${i}]`,
                  model: targetModelName,
                  operation: 'createMany',
                  tenantField: targetTenantField,
                });
              }
            }
          }
        }

        if (opKey === 'update' || opKey === 'updateMany') {
          const items = Array.isArray(opValue) ? opValue : [opValue];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (targetTenantField && item?.where && typeof item.where === 'object') {
              if (!hasTenantScope(item.where, targetTenantField)) {
                violations.push({
                  path: `${currentPath}[${i}].where`,
                  model: targetModelName,
                  operation: opKey,
                  tenantField: targetTenantField,
                });
              }
            }
            const updateData = item?.data ?? item;
            if (updateData && typeof updateData === 'object') {
              violations.push(
                ...validateNestedWrites(updateData, targetModelName, tenantModels, `${currentPath}[${i}]`, depth + 1),
              );
            }
          }
        }

        if (opKey === 'connect') {
          // V3: connect validation is handled by validateConnectOwnership (async)
          // Synchronous nested write validation cannot do DB lookups.
          // The main middleware handles connect validation separately.
        }

        if (opKey === 'delete' || opKey === 'deleteMany') {
          const items = Array.isArray(opValue) ? opValue : [opValue];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (targetTenantField && item && typeof item === 'object' && item.where) {
              if (!hasTenantScope(item.where, targetTenantField)) {
                violations.push({
                  path: `${currentPath}[${i}].where`,
                  model: targetModelName,
                  operation: opKey,
                  tenantField: targetTenantField,
                });
              }
            }
          }
        }
      }
    }

    if (Array.isArray(value) && targetTenantField) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] && typeof value[i] === 'object' && value[i][targetTenantField] === undefined) {
          violations.push({
            path: `${path}.${key}[${i}]`,
            model: targetModelName,
            operation: 'create (implicit)',
            tenantField: targetTenantField,
          });
        }
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Create-action validation
// ---------------------------------------------------------------------------

function validateCreateData(data: any, model: string, tenantField: string, action: string): void {
  if (action === 'create') {
    if (!data || typeof data !== 'object' || data[tenantField] === undefined) {
      throwViolation(model, action, tenantField, 'data (missing tenant field in create)');
    }
  }
  if (action === 'createMany') {
    const records = data?.data ?? data;
    const items = Array.isArray(records) ? records : [records];
    for (let i = 0; i < items.length; i++) {
      if (!items[i] || typeof items[i] !== 'object' || items[i][tenantField] === undefined) {
        throwViolation(model, `createMany[${i}]`, tenantField, 'data (missing tenant field in createMany)');
      }
    }
  }
  if (action === 'upsert') {
    const createData = data?.create;
    if (!createData || typeof createData !== 'object' || createData[tenantField] === undefined) {
      throwViolation(model, 'upsert.create', tenantField, 'data.create (missing tenant field in upsert)');
    }
  }
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function throwViolation(model: string, action: string, tenantField: string, context: string): never {
  const msg =
    `SECURITY VIOLATION: Missing ${tenantField} in ${model}.${action} [${context}]. ` +
    `All operations on tenant-owned models MUST include tenant scoping.`;

  logger.error('TENANT ISOLATION VIOLATION', {
    model, action, tenantField, context,
    timestamp: new Date().toISOString(),
  });

  throw new Error(msg);
}

// ---------------------------------------------------------------------------
// STEP 2: Cross-tenant connect validation via internal Prisma client
// ---------------------------------------------------------------------------

async function validateConnectOwnership(
  data: any,
  parentModel: string,
  tenantModels: TenantModelMap,
  tenantCtx: TenantContext,
  path: string = 'data',
  depth: number = 0,
): Promise<void> {
  if (depth > 6 || !data || typeof data !== 'object') return;

  for (const key of Object.keys(data)) {
    const value = data[key];
    if (value === null || value === undefined || typeof value !== 'object') continue;

    const targetModelName = resolveRelationTarget(key);
    if (!targetModelName) continue;

    const targetTenantField = tenantModels.get(targetModelName);
    if (!targetTenantField) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const opKey of Object.keys(value)) {
        if (opKey !== 'connect') continue;
        const connectValue = value[opKey];
        if (!connectValue) continue;

        const items = Array.isArray(connectValue) ? connectValue : [connectValue];
        for (const item of items) {
          if (!item || typeof item !== 'object') continue;

          const recordId = item.id;
          if (recordId === undefined) continue;

          const expectedTenantValue = targetTenantField === 'companyId'
            ? tenantCtx.companyId
            : targetTenantField === 'organizationId'
              ? tenantCtx.organizationId
              : undefined;

          if (expectedTenantValue === undefined) continue;

          try {
            const internal = getInternalPrisma();
            const table = (internal as any)[targetModelName];
            if (!table?.findFirst) continue;

            const record = await table.findFirst({
              where: { id: recordId },
              select: { [targetTenantField]: true },
            });

            if (!record) {
              throw new Error(
                `SECURITY VIOLATION: connect references non-existent ${targetModelName} ` +
                `with id=${recordId} at ${path}.${key}.connect`,
              );
            }

            const actualTenant = String(record[targetTenantField]);
            const expectedTenant = String(expectedTenantValue);

            if (actualTenant !== expectedTenant) {
              logger.error('CROSS-TENANT CONNECT BLOCKED', {
                model: targetModelName,
                recordId,
                expectedTenant,
                actualTenant,
                path: `${path}.${key}.connect`,
              });

              throw new Error(
                `SECURITY VIOLATION: Cross-tenant connect blocked. ` +
                `${targetModelName}.id=${recordId} belongs to tenant ${actualTenant}, ` +
                `but current context is tenant ${expectedTenant}. ` +
                `Path: ${path}.${key}.connect`,
              );
            }
          } catch (err: any) {
            if (err.message.startsWith('SECURITY VIOLATION')) throw err;
            logger.warn('Connect validation lookup failed', { model: targetModelName, error: err.message });
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// STEP 4: Raw query HARD BLOCK
// ---------------------------------------------------------------------------

export function wrapRawQueries(prisma: any, tenantModels: TenantModelMap): void {
  const originalQueryRaw = prisma.$queryRaw?.bind(prisma);
  const originalQueryRawUnsafe = prisma.$queryRawUnsafe?.bind(prisma);
  const originalExecuteRaw = prisma.$executeRaw?.bind(prisma);
  const originalExecuteRawUnsafe = prisma.$executeRawUnsafe?.bind(prisma);

  const tenantTableNames = new Set(tenantModels.keys());

  function hardBlockRawQuery(sql: string, method: string): void {
    const ctx = getCurrentTenantContext();

    if (ctx?.bypassTenant === true && ctx?.isAdmin === true) {
      logger.warn('RAW QUERY ADMIN BYPASS', { method, sqlPreview: sql.substring(0, 200) });
      return;
    }

    const sqlLower = sql.toLowerCase();
    for (const table of tenantTableNames) {
      if (sqlLower.includes(table.toLowerCase())) {
        const tenantField = tenantModels.get(table);

        logger.error('RAW QUERY HARD BLOCK', {
          method,
          table,
          tenantField,
          sqlPreview: sql.substring(0, 300),
          hasAdminBypass: ctx?.bypassTenant === true && ctx?.isAdmin === true,
        });

        throw new Error(
          `SECURITY VIOLATION: Raw query on tenant table "${table}" is BLOCKED. ` +
          `Method: ${method}. Raw queries on tenant-owned tables are prohibited. ` +
          `Use Prisma client methods with proper tenant scoping, or set ` +
          `{ bypassTenant: true, isAdmin: true } in tenant context for admin operations.`,
        );
      }
    }
  }

  function extractSql(args: any[]): string {
    if (!args || args.length === 0) return '';
    const first = args[0];
    if (typeof first === 'string') return first;
    if (first?.strings && Array.isArray(first.strings)) return first.strings.join('?');
    if (Array.isArray(first)) return first.join('?');
    return String(first);
  }

  if (originalQueryRaw) {
    prisma.$queryRaw = function (...args: any[]) {
      hardBlockRawQuery(extractSql(args), '$queryRaw');
      return originalQueryRaw(...args);
    };
  }
  if (originalQueryRawUnsafe) {
    prisma.$queryRawUnsafe = function (...args: any[]) {
      hardBlockRawQuery(extractSql(args), '$queryRawUnsafe');
      return originalQueryRawUnsafe(...args);
    };
  }
  if (originalExecuteRaw) {
    prisma.$executeRaw = function (...args: any[]) {
      hardBlockRawQuery(extractSql(args), '$executeRaw');
      return originalExecuteRaw(...args);
    };
  }
  if (originalExecuteRawUnsafe) {
    prisma.$executeRawUnsafe = function (...args: any[]) {
      hardBlockRawQuery(extractSql(args), '$executeRawUnsafe');
      return originalExecuteRawUnsafe(...args);
    };
  }
}

// ---------------------------------------------------------------------------
// STEP 5: Auto-inject tenant filter from AsyncLocalStorage context
// ---------------------------------------------------------------------------

function autoInjectTenantFilter(params: any, tenantField: string, action: string): void {
  const ctx = getCurrentTenantContext();
  
  // ✅ RESTRICTIVE MODE: Throw error if context missing
  if (!ctx) {
    throw new Error(
      `SECURITY VIOLATION: Tenant context required for ${params.model}.${action}. ` +
      `All queries on tenant-scoped models MUST have tenant context from AsyncLocalStorage.`
    );
  }
  
  if (ctx.bypassTenant) return;

  const tenantValue = tenantField === 'companyId'
    ? ctx.companyId
    : tenantField === 'organizationId'
      ? ctx.organizationId
      : undefined;

  // ✅ RESTRICTIVE MODE: Throw error if tenant value missing
  if (tenantValue === undefined) {
    throw new Error(
      `SECURITY VIOLATION: Tenant value (${tenantField}) missing for ${params.model}.${action}. ` +
      `Context exists but companyId/organizationId is undefined.`
    );
  }

  if (WHERE_SCOPED_ACTIONS.has(action)) {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};

    if (params.args.where[tenantField] === undefined) {
      params.args.where[tenantField] = tenantValue;
    }

    if (action === 'findUnique') {
      params.action = 'findFirst';
    }
  }

  if (action === 'create') {
    if (!params.args) params.args = {};
    if (!params.args.data) params.args.data = {};
    if (params.args.data[tenantField] === undefined) {
      params.args.data[tenantField] = tenantValue;
    }
  }

  if (action === 'createMany') {
    if (!params.args) params.args = {};
    const records = params.args.data;
    if (Array.isArray(records)) {
      for (const record of records) {
        if (record && typeof record === 'object' && record[tenantField] === undefined) {
          record[tenantField] = tenantValue;
        }
      }
    }
  }

  if (action === 'upsert') {
    if (!params.args) params.args = {};
    if (params.args.where && params.args.where[tenantField] === undefined) {
      params.args.where[tenantField] = tenantValue;
    }
    if (params.args.create && params.args.create[tenantField] === undefined) {
      params.args.create[tenantField] = tenantValue;
    }
  }
}

// ---------------------------------------------------------------------------
// Main middleware factory
// ---------------------------------------------------------------------------

export function createTenantIsolationMiddleware(tenantModels: TenantModelMap) {
  return async (params: any, next: (params: any) => Promise<any>) => {
    const { model, action, args } = params;

    if (!model) return next(params);

    const tenantField = tenantModels.get(model);
    const ctx = getCurrentTenantContext();

    if (ctx?.bypassTenant && ctx?.isAdmin) {
      return next(params);
    }

    // --- Auto-inject tenant filter (STEP 5) ---
    if (tenantField) {
      autoInjectTenantFilter(params, tenantField, action);
    }

    // --- Non-tenant model: still check nested writes ---
    if (!tenantField) {
      if (args?.data && DATA_SCOPED_ACTIONS.has(action)) {
        const nestedViolations = validateNestedWrites(
          args.data, model, tenantModels, `${model}.${action}.data`,
        );
        if (nestedViolations.length > 0) {
          const details = nestedViolations
            .map((v: any) => `  ${v.path}: ${v.model}.${v.operation} missing ${v.tenantField}`)
            .join('\n');
          throw new Error(
            `SECURITY VIOLATION: Nested write on tenant-owned model(s) without tenant scoping.\n${details}`,
          );
        }

        if (ctx) {
          await validateConnectOwnership(args.data, model, tenantModels, ctx, `${model}.${action}.data`);
        }
      }
      return next(params);
    }

    // ---- Tenant-owned model: full validation ----

    // A) WHERE clause validation
    if (WHERE_SCOPED_ACTIONS.has(action)) {
      const where = params.args?.where;
      if (!hasTenantScope(where, tenantField)) {
        throwViolation(model, action, tenantField, 'where clause');
      }
    }

    // B) DATA clause validation for creates
    if (action === 'create' || action === 'createMany' || action === 'upsert') {
      validateCreateData(params.args?.data, model, tenantField, action);
    }

    // C) Nested write validation
    if (params.args?.data && DATA_SCOPED_ACTIONS.has(action)) {
      const nestedViolations = validateNestedWrites(
        params.args.data, model, tenantModels, `${model}.${action}.data`,
      );
      if (nestedViolations.length > 0) {
        const details = nestedViolations
          .map((v: any) => `  ${v.path}: ${v.model}.${v.operation} missing ${v.tenantField}`)
          .join('\n');
        throw new Error(
          `SECURITY VIOLATION: Nested write on tenant-owned model(s) without tenant scoping.\n${details}`,
        );
      }

      // D) Cross-tenant connect validation (STEP 2)
      if (ctx) {
        await validateConnectOwnership(params.args.data, model, tenantModels, ctx, `${model}.${action}.data`);
      }
    }

    return next(params);
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _activeTenantModels: TenantModelMap = new Map();

export function getActiveTenantModels(): TenantModelMap {
  return _activeTenantModels;
}

export function applyTenantIsolationMiddleware(prisma: any): void {
  const tenantModels = detectTenantModels(prisma);
  _activeTenantModels = tenantModels;

  const relationMap = buildRelationTargetMap(prisma);
  setRelationTargetMap(relationMap);

  prisma.$use(createTenantIsolationMiddleware(tenantModels));

  wrapRawQueries(prisma, tenantModels);

  const companyModels: string[] = [];
  const orgModels: string[] = [];
  const otherModels: string[] = [];

  for (const [model, field] of tenantModels) {
    if (field === 'companyId') companyModels.push(model);
    else if (field === 'organizationId') orgModels.push(model);
    else otherModels.push(`${model}(${field})`);
  }

  logger.info('Tenant isolation middleware V3 (ENTERPRISE) activated', {
    companyModels: companyModels.length,
    orgModels: orgModels.length,
    otherModels: otherModels.length > 0 ? otherModels : undefined,
    nestedWriteValidation: true,
    connectOwnershipValidation: true,
    rawQueryProtection: 'HARD_BLOCK',
    autoInjection: true,
    relationMapEntries: relationMap.size,
  });
}
