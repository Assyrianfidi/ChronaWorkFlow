import type { PrismaClient } from '@prisma/client';

import { stableHash } from '../finance/ledger-invariants.js';
import { getPermissionRegistry } from '../auth/tenant-permissions.js';
import { getCapacityConfig } from '../performance/capacity-config.js';
import { getKillSwitchState, type KillSwitchName } from '../ops/kill-switch.js';
import { getCurrentDegradationLevel } from '../ops/degradation-wrapper.js';
import { runReadinessGates } from '../ops/readiness-gates.js';

export interface ComplianceSnapshot {
  generatedAt: string;
  environment: {
    nodeEnv: string;
    ci: boolean;
    deterministicTestIds: boolean;
    version: string;
    nodeVersion: string;
    platform: string;
  };
  permissions: {
    domainCount: number;
    permissionCount: number;
    roleCount: number;
    roles: Array<{ role: string; permissionCount: number }>;
  };
  performance: {
    capacity: ReturnType<typeof getCapacityConfig>;
  };
  ops: {
    degradation: ReturnType<typeof getCurrentDegradationLevel>;
    killSwitches: Record<KillSwitchName, { enabled: boolean; reason?: string; updatedAt: string; updatedBy?: string }>;
    readiness?: {
      status: string;
      results: Array<{ gate: string; ok: boolean; message?: string }>;
      timestamp: string;
    };
  };
  integrityHash: string;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function now(): Date {
  return isDeterministic() ? new Date(0) : new Date();
}

function toBool(v: unknown): boolean {
  return v === true || v === 'true';
}

function canonicalizeSnapshot(s: Omit<ComplianceSnapshot, 'integrityHash'>): string {
  return JSON.stringify(s);
}

const KILL_SWITCH_NAMES: KillSwitchName[] = ['GLOBAL_WRITE', 'BILLING', 'WEBHOOKS', 'BACKGROUND_JOBS', 'EXTERNAL_INTEGRATIONS'];

export async function buildComplianceSnapshot(input: { prisma?: PrismaClient; includeReadiness?: boolean }): Promise<ComplianceSnapshot> {
  const ts = now();
  const registry = getPermissionRegistry();

  const roles = Array.from(registry.rolePermissions.entries())
    .map(([role, perms]) => ({ role: String(role), permissionCount: (perms || []).length }))
    .sort((a, b) => a.role.localeCompare(b.role));

  const killSwitches = Object.fromEntries(
    KILL_SWITCH_NAMES.map((name) => {
      const s = getKillSwitchState(name);
      return [
        name,
        {
          enabled: s.enabled,
          reason: s.reason,
          updatedAt: s.updatedAt.toISOString(),
          updatedBy: s.updatedBy,
        },
      ];
    }),
  ) as ComplianceSnapshot['ops']['killSwitches'];

  const readiness = input.includeReadiness && input.prisma ? await runReadinessGates(input.prisma) : undefined;

  const base: Omit<ComplianceSnapshot, 'integrityHash'> = {
    generatedAt: ts.toISOString(),
    environment: {
      nodeEnv: String(process.env.NODE_ENV || 'unknown'),
      ci: toBool(process.env.CI),
      deterministicTestIds: toBool(process.env.DETERMINISTIC_TEST_IDS),
      version: String(process.env.npm_package_version || process.env.APP_VERSION || 'unknown'),
      nodeVersion: process.version,
      platform: process.platform,
    },
    permissions: {
      domainCount: registry.domains.size,
      permissionCount: registry.permissions.size,
      roleCount: registry.rolePermissions.size,
      roles,
    },
    performance: {
      capacity: getCapacityConfig(),
    },
    ops: {
      degradation: getCurrentDegradationLevel(),
      killSwitches,
      readiness: readiness
        ? {
            status: readiness.status,
            results: readiness.results.map((r) => ({ gate: r.gate, ok: r.ok, message: r.message })),
            timestamp: readiness.timestamp,
          }
        : undefined,
    },
  };

  const integrityHash = stableHash(canonicalizeSnapshot(base));

  return {
    ...base,
    integrityHash,
  };
}
