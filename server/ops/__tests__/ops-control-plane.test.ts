import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { evaluateSlo } from '../slo-engine.js';
import { setKillSwitch, getKillSwitchState, isKillSwitchEnabled } from '../kill-switch.js';
import { runReadinessGates } from '../readiness-gates.js';
import { getHealthSnapshot } from '../health-checks.js';
import { validateRestore } from '../restore-validation.js';

const makeTenantContext = () => ({
  tenantId: 'tn_test',
  userRole: 'OWNER',
  user: { id: 'user_test' },
} as any);

describe('Ops Control Plane', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'accubooks-ops-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('slo-engine should evaluate PASS/WARN/FAIL correctly', () => {
    const pass = evaluateSlo(
      { totalRequests: 1000, errorRequests: 0, p95LatencyMs: 120 },
      { maxErrorRatePct: 1, maxP95LatencyMs: 250 }
    );
    expect(pass.status).toBe('PASS');

    const warn = evaluateSlo(
      { totalRequests: 100, errorRequests: 2, p95LatencyMs: 120 },
      { maxErrorRatePct: 1, maxP95LatencyMs: 250 }
    );
    expect(warn.status).toBe('WARN');

    const fail = evaluateSlo(
      { totalRequests: 100, errorRequests: 2, p95LatencyMs: 500 },
      { maxErrorRatePct: 1, maxP95LatencyMs: 250 }
    );
    expect(fail.status).toBe('FAIL');
  });

  it('kill-switch should toggle state and be queryable', () => {
    const tenantContext = makeTenantContext();

    expect(isKillSwitchEnabled('GLOBAL_WRITE')).toBe(false);

    setKillSwitch('GLOBAL_WRITE', true, 'maintenance', tenantContext, 'req_1');
    expect(isKillSwitchEnabled('GLOBAL_WRITE')).toBe(true);

    const state = getKillSwitchState('GLOBAL_WRITE');
    expect(state.enabled).toBe(true);
    expect(state.reason).toBe('maintenance');
  });

  it('readiness-gates should fail when GLOBAL_WRITE kill switch enabled', async () => {
    const prisma = {
      $queryRaw: async () => [{ ok: 1 }],
    } as any;

    const tenantContext = makeTenantContext();
    setKillSwitch('GLOBAL_WRITE', true, 'test', tenantContext, 'req_2');

    const snapshot = await runReadinessGates(prisma);
    expect(snapshot.status).toBe('not_ready');
    expect(snapshot.results.find(r => r.gate === 'kill_switch_global_write')?.ok).toBe(false);
  });

  it('health-checks should include database + memory + uptime checks', async () => {
    const prisma = {
      $queryRaw: async () => [{ ok: 1 }],
    } as any;

    const snapshot = await getHealthSnapshot(prisma);
    expect(snapshot.checks.database).toBeTruthy();
    expect(snapshot.checks.memory).toBeTruthy();
    expect(snapshot.checks.uptime).toBeTruthy();
    expect(['ok', 'degraded', 'error']).toContain(snapshot.status);
  });

  it('restore-validation should validate isolated backup file + checksum format', async () => {
    const tenantContext = makeTenantContext();
    const isolatedDir = join(tempDir, 'isolated');

    // create isolated backup file
    const backupId = 'backup-test-1';
    const encPath = join(isolatedDir, `${backupId}.sql.enc`);
    const checksumPath = `${encPath}.sha256`;

    mkdirSync(isolatedDir, { recursive: true });

    writeFileSync(encPath, Buffer.from('deadbeef', 'hex'));
    writeFileSync(checksumPath, 'a'.repeat(64));

    const verification = await validateRestore({
      config: {
        databaseUrl: 'postgresql://example',
        backupDirectory: tempDir,
        encryptionKey: 'a'.repeat(64),
        retentionDays: 1,
        backupIntervalHours: 24,
        maxBackupSizeGB: 1,
        compressionEnabled: true,
        verificationEnabled: true,
        isolationEnabled: true,
      },
      tenantContext,
      requestId: 'req_3',
      backupId,
    });

    expect(verification.isValid).toBe(true);
    expect(verification.checksumMatches).toBe(true);
    expect(verification.canRestore).toBe(true);
  });
});
