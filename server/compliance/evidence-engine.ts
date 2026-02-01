import { EvidenceStore, EvidenceRecord } from './evidence-store.js';

export type TenantScopedActor = {
  tenantId: string;
  actorId: string;
  correlationId: string;
};

export class EvidenceEngine {
  private readonly store: EvidenceStore;

  constructor(store: EvidenceStore = new EvidenceStore()) {
    this.store = store;
  }

  recordRbacDecision(input: TenantScopedActor & { permission: string; authorized: boolean; reason: string; resource?: unknown }): EvidenceRecord {
    return this.store.append({
      tenantId: input.tenantId,
      category: 'RBAC_DECISION',
      payload: {
        actorId: input.actorId,
        correlationId: input.correlationId,
        permission: input.permission,
        authorized: input.authorized,
        reason: input.reason,
        resource: input.resource ?? null,
      },
    });
  }

  recordFeatureFlagChange(input: TenantScopedActor & { flag: string; enabled: boolean; previous?: boolean }): EvidenceRecord {
    return this.store.append({
      tenantId: input.tenantId,
      category: 'FEATURE_FLAG_CHANGE',
      payload: {
        actorId: input.actorId,
        correlationId: input.correlationId,
        flag: input.flag,
        previous: typeof input.previous === 'boolean' ? input.previous : null,
        enabled: input.enabled,
      },
    });
  }

  recordDangerousOperationApproval(input: TenantScopedActor & { operationId: string; decision: 'APPROVE' | 'REJECT'; reason: string }): EvidenceRecord {
    return this.store.append({
      tenantId: input.tenantId,
      category: 'DANGEROUS_OPERATION_APPROVAL',
      payload: {
        actorId: input.actorId,
        correlationId: input.correlationId,
        operationId: input.operationId,
        decision: input.decision,
        reason: input.reason,
      },
    });
  }

  recordAnalyticsDataAccess(input: TenantScopedActor & { module: string; queryType: string }): EvidenceRecord {
    return this.store.append({
      tenantId: input.tenantId,
      category: 'ANALYTICS_DATA_ACCESS',
      payload: {
        actorId: input.actorId,
        correlationId: input.correlationId,
        module: input.module,
        queryType: input.queryType,
      },
    });
  }

  verifyTenantEvidenceChain(tenantId: string): { valid: boolean; violations: string[] } {
    return this.store.verifyChain(tenantId);
  }
}

export const evidenceEngine = new EvidenceEngine();
