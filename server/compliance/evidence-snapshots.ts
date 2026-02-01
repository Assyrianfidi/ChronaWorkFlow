import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { EvidenceStore, EvidenceRecord } from './evidence-store.js';

export type EvidenceSnapshot = {
  id: string;
  tenantId: string;
  period: { startIso: string; endIso: string };
  createdAt: string;
  recordCount: number;
  headHash: string | null;
  manifestHash: string;
  records: EvidenceRecord[];
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function nowIso(): string {
  const forced = process.env.COMPLIANCE_DETERMINISTIC_TIME_ISO;
  return forced && forced.trim() ? forced : new Date().toISOString();
}

export class EvidenceSnapshots {
  private readonly store: EvidenceStore;
  private readonly snapshotDir: string;

  constructor(store: EvidenceStore = new EvidenceStore(), snapshotDir: string = path.resolve(process.cwd(), 'evidence-snapshots')) {
    this.store = store;
    this.snapshotDir = snapshotDir;
    fs.mkdirSync(this.snapshotDir, { recursive: true });
  }

  createSnapshot(input: { tenantId: string; startIso: string; endIso: string }): EvidenceSnapshot {
    const records = this.store
      .list(input.tenantId)
      .filter((r) => r.createdAt >= input.startIso && r.createdAt <= input.endIso);

    const headHash = records.length ? records[records.length - 1].hash : null;
    const createdAt = nowIso();

    const snapshotIdSeed = stableStringify({ tenantId: input.tenantId, startIso: input.startIso, endIso: input.endIso, headHash, createdAt });
    const id = `snap_${sha256Hex(snapshotIdSeed).slice(0, 16)}`;

    const manifest = {
      id,
      tenantId: input.tenantId,
      period: { startIso: input.startIso, endIso: input.endIso },
      createdAt,
      recordCount: records.length,
      headHash,
    };

    const manifestHash = sha256Hex(stableStringify(manifest));

    const snapshot: EvidenceSnapshot = {
      ...manifest,
      manifestHash,
      records,
    };

    const filePath = path.join(this.snapshotDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));

    return snapshot;
  }
}

export const evidenceSnapshots = new EvidenceSnapshots();
