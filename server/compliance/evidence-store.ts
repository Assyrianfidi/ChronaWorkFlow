import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export type EvidenceRecord = {
  id: string;
  tenantId: string;
  category:
    | 'RBAC_DECISION'
    | 'FEATURE_FLAG_CHANGE'
    | 'DANGEROUS_OPERATION_APPROVAL'
    | 'BILLING_REVENUE'
    | 'ANALYTICS_DATA_ACCESS'
    | 'AUDITOR_ACTIVITY'
    | 'POLICY_ARTIFACT'
    | 'DATA_RIGHTS_WORKFLOW';
  createdAt: string; // ISO
  payload: unknown;
  prevHash: string | null;
  hash: string;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const props = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',');
  return `{${props}}`;
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function nowIso(): string {
  const forced = process.env.COMPLIANCE_DETERMINISTIC_TIME_ISO;
  return forced && forced.trim() ? forced : new Date().toISOString();
}

export class EvidenceStore {
  private readonly storeDir: string;

  constructor(storeDir: string = path.resolve(process.cwd(), 'evidence-store')) {
    this.storeDir = storeDir;
    fs.mkdirSync(this.storeDir, { recursive: true });
  }

  private tenantFile(tenantId: string): string {
    return path.join(this.storeDir, `evidence-${tenantId}.jsonl`);
  }

  private readLastHash(tenantId: string): string | null {
    const f = this.tenantFile(tenantId);
    if (!fs.existsSync(f)) return null;
    const lines = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean);
    if (!lines.length) return null;
    const last = JSON.parse(lines[lines.length - 1]) as EvidenceRecord;
    return last.hash;
  }

  append(input: Omit<EvidenceRecord, 'id' | 'createdAt' | 'prevHash' | 'hash'>): EvidenceRecord {
    const createdAt = nowIso();
    const prevHash = this.readLastHash(input.tenantId);
    const idSeed = stableStringify({ tenantId: input.tenantId, category: input.category, createdAt, prevHash, payload: input.payload });
    const id = `ev_${sha256Hex(idSeed).slice(0, 16)}`;

    const recordBase = { id, createdAt, prevHash, ...input };
    const hash = sha256Hex(stableStringify(recordBase));
    const record: EvidenceRecord = { ...recordBase, hash } as EvidenceRecord;

    fs.appendFileSync(this.tenantFile(input.tenantId), `${JSON.stringify(record)}\n`);
    return record;
  }

  list(tenantId: string): EvidenceRecord[] {
    const f = this.tenantFile(tenantId);
    if (!fs.existsSync(f)) return [];
    return fs
      .readFileSync(f, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as EvidenceRecord);
  }

  verifyChain(tenantId: string): { valid: boolean; violations: string[] } {
    const records = this.list(tenantId);
    const violations: string[] = [];

    let prev: string | null = null;
    for (const r of records) {
      if (r.prevHash !== prev) violations.push(`prevHash mismatch for ${r.id}`);
      const base = {
        id: r.id,
        createdAt: r.createdAt,
        prevHash: r.prevHash,
        tenantId: r.tenantId,
        category: r.category,
        payload: r.payload,
      };
      const expected = sha256Hex(stableStringify(base));
      if (r.hash !== expected) violations.push(`hash mismatch for ${r.id}`);
      prev = r.hash;
    }

    return { valid: violations.length === 0, violations };
  }
}
