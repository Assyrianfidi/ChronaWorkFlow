import { describe, it, expect } from 'vitest';

import { validateDisasterRecoveryReadiness } from '../disaster-recovery.js';

describe('STEP16 disaster recovery readiness', () => {
  it('is deterministic when DETERMINISTIC_TEST_IDS=true (timestamp + hash)', async () => {
    process.env.DETERMINISTIC_TEST_IDS = 'true';

    const tenantContext = { tenantId: 't1', user: { id: 'u1' } } as any;

    const reportA = await validateDisasterRecoveryReadiness({
      tenantContext,
      requestId: 'r1',
      backupConfig: {
        databaseUrl: 'db',
        backupDirectory: 'C:\\nonexistent',
        encryptionKey: '00',
        retentionDays: 1,
        backupIntervalHours: 1,
        maxBackupSizeGB: 1,
        compressionEnabled: false,
        verificationEnabled: false,
        isolationEnabled: true,
      },
      backupId: 'b1',
    });

    const reportB = await validateDisasterRecoveryReadiness({
      tenantContext,
      requestId: 'r1',
      backupConfig: {
        databaseUrl: 'db',
        backupDirectory: 'C:\\nonexistent',
        encryptionKey: '00',
        retentionDays: 1,
        backupIntervalHours: 1,
        maxBackupSizeGB: 1,
        compressionEnabled: false,
        verificationEnabled: false,
        isolationEnabled: true,
      },
      backupId: 'b1',
    });

    expect(reportA.generatedAt).toBe(reportB.generatedAt);
    expect(reportA.integrityHash).toBe(reportB.integrityHash);
    expect(reportA.ready).toBe(false);
    expect(reportA.reasons.length).toBeGreaterThan(0);
  });
});
