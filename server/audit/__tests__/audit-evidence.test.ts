import { describe, it, expect } from 'vitest';

import { MemoryPeriodLocks } from '../../finance/period-locks.js';
import { buildAuditEvidenceBundle } from '../audit-evidence.js';

class EmptyLedgerStore {
  async getAccountSnapshots() {
    return [];
  }
  async getAccountBalancesCents() {
    return new Map();
  }
  async getPostedTransactionByNumber() {
    return null;
  }
  async commitAppendOnly() {
    throw new Error('not_supported');
  }
  async listPostedTransactions() {
    return [];
  }
}

describe('STEP16 audit evidence', () => {
  it('is deterministic when DETERMINISTIC_TEST_IDS=true', async () => {
    process.env.DETERMINISTIC_TEST_IDS = 'true';

    const locks = new MemoryPeriodLocks();
    locks.setDateState({ companyId: 'c1', date: new Date('2020-01-31T00:00:00.000Z'), periodId: 'p1', state: 'OPEN' });

    const b1 = await buildAuditEvidenceBundle({
      tenantId: 't1',
      actorId: 'u1',
      requestId: 'r1',
      companyId: 'c1',
      from: new Date('2020-01-01T00:00:00.000Z'),
      to: new Date('2020-01-31T00:00:00.000Z'),
      periodLocks: locks,
      admissionDecision: 'ALLOW',
      ledgerStore: new EmptyLedgerStore() as any,
      prisma: undefined,
    });

    const b2 = await buildAuditEvidenceBundle({
      tenantId: 't1',
      actorId: 'u1',
      requestId: 'r1',
      companyId: 'c1',
      from: new Date('2020-01-01T00:00:00.000Z'),
      to: new Date('2020-01-31T00:00:00.000Z'),
      periodLocks: locks,
      admissionDecision: 'ALLOW',
      ledgerStore: new EmptyLedgerStore() as any,
      prisma: undefined,
    });

    expect(b1.integrityHash).toBe(b2.integrityHash);
    expect(b1.createdAt).toBe(b2.createdAt);
    expect(b1.retention.retain).toBe(true);
  });
});
