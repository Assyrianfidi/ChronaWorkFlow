import { getImmutableAuditLogger } from '../../compliance/immutable-audit-log.js';
import { stableHash, stableId } from '../ledger-invariants.js';

export type TaxAttestation = {
  attestationId: string;
  companyId: string;
  periodId: string;
  from: Date;
  to: Date;
  trialBalanceHash: string;
  incomeStatementHash: string;
  balanceSheetHash: string;
  cashFlowHash: string;
  taxExportHash: string;
  createdAt: Date;
  createdBy: string;
  correlationId: string;
  integrityHash: string;
};

export type TaxAttestationStore = {
  put(att: TaxAttestation): Promise<void>;
  get(companyId: string, attestationId: string): Promise<TaxAttestation | null>;
  listByPeriod(companyId: string, periodId: string): Promise<TaxAttestation[]>;
};

export class MemoryTaxAttestationStore implements TaxAttestationStore {
  private byId = new Map<string, TaxAttestation>();

  async put(att: TaxAttestation): Promise<void> {
    this.byId.set(`${att.companyId}:${att.attestationId}`, att);
  }

  async get(companyId: string, attestationId: string): Promise<TaxAttestation | null> {
    return this.byId.get(`${companyId}:${attestationId}`) ?? null;
  }

  async listByPeriod(companyId: string, periodId: string): Promise<TaxAttestation[]> {
    return Array.from(this.byId.values())
      .filter((a) => a.companyId === companyId && a.periodId === periodId)
      .sort((a, b) => a.attestationId.localeCompare(b.attestationId));
  }
}

function getAudit() {
  return getImmutableAuditLogger();
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function computeIntegrityHash(att: Omit<TaxAttestation, 'integrityHash'>): string {
  return stableHash(
    JSON.stringify({
      companyId: att.companyId,
      periodId: att.periodId,
      from: att.from.toISOString(),
      to: att.to.toISOString(),
      trialBalanceHash: att.trialBalanceHash,
      incomeStatementHash: att.incomeStatementHash,
      balanceSheetHash: att.balanceSheetHash,
      cashFlowHash: att.cashFlowHash,
      taxExportHash: att.taxExportHash,
      createdAt: att.createdAt.toISOString(),
      createdBy: att.createdBy,
      correlationId: att.correlationId,
    }),
  );
}

export class TaxAttestationService {
  constructor(private readonly store: TaxAttestationStore = new MemoryTaxAttestationStore()) {}

  async attest(input: {
    companyId: string;
    actorId: string;
    correlationId: string;
    permissionAsserted: boolean;
    period: { periodId: string; from: Date; to: Date };
    hashes: {
      trialBalanceHash: string;
      incomeStatementHash: string;
      balanceSheetHash: string;
      cashFlowHash: string;
      taxExportHash: string;
    };
  }): Promise<TaxAttestation> {
    if (!input.permissionAsserted) {
      getAudit().logSecurityEvent({
        tenantId: input.companyId,
        actorId: input.actorId,
        action: 'TAX_ATTESTATION_DENIED_MISSING_PERMISSION',
        resourceType: 'TAX_ATTESTATION',
        resourceId: input.period.periodId,
        outcome: 'DENIED',
        correlationId: input.correlationId,
        metadata: {},
      });
      throw new Error('Missing required permission: finance:attest');
    }

    const seed = `attest:${input.companyId}:${input.period.periodId}:${input.hashes.trialBalanceHash}:${input.hashes.taxExportHash}`;
    const attestationId = isDeterministic() ? `att_${stableHash(seed).slice(0, 16)}` : stableId('att', seed);

    const unsigned: Omit<TaxAttestation, 'integrityHash'> = {
      attestationId,
      companyId: input.companyId,
      periodId: input.period.periodId,
      from: input.period.from,
      to: input.period.to,
      trialBalanceHash: input.hashes.trialBalanceHash,
      incomeStatementHash: input.hashes.incomeStatementHash,
      balanceSheetHash: input.hashes.balanceSheetHash,
      cashFlowHash: input.hashes.cashFlowHash,
      taxExportHash: input.hashes.taxExportHash,
      createdAt: new Date(),
      createdBy: input.actorId,
      correlationId: input.correlationId,
    };

    const integrityHash = computeIntegrityHash(unsigned);
    const attestation: TaxAttestation = { ...unsigned, integrityHash };

    await this.store.put(attestation);

    getAudit().logSecurityEvent({
      tenantId: input.companyId,
      actorId: input.actorId,
      action: 'TAX_PERIOD_ATTESTED',
      resourceType: 'TAX_ATTESTATION',
      resourceId: attestationId,
      outcome: 'SUCCESS',
      correlationId: input.correlationId,
      metadata: {
        periodId: input.period.periodId,
        from: input.period.from.toISOString(),
        to: input.period.to.toISOString(),
        integrityHash,
        trialBalanceHash: input.hashes.trialBalanceHash,
        taxExportHash: input.hashes.taxExportHash,
      },
    });

    return attestation;
  }
}
