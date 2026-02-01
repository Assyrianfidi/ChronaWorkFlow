import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { EvidenceStore, EvidenceRecord } from './evidence-store.js';

export type EvidenceExportBundle = {
  id: string;
  tenantId: string;
  createdAt: string;
  format: 'JSON';
  recordCount: number;
  headHash: string | null;
  bundleHash: string;
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

export class EvidenceExportManager {
  private readonly store: EvidenceStore;
  private readonly exportDir: string;

  constructor(store: EvidenceStore = new EvidenceStore(), exportDir: string = path.resolve(process.cwd(), 'evidence-exports')) {
    this.store = store;
    this.exportDir = exportDir;
    fs.mkdirSync(this.exportDir, { recursive: true });
  }

  exportTenantEvidence(input: { tenantId: string; includeCategories?: EvidenceRecord['category'][] }): EvidenceExportBundle {
    const all = this.store.list(input.tenantId);
    const records = Array.isArray(input.includeCategories) && input.includeCategories.length
      ? all.filter((r) => input.includeCategories!.includes(r.category))
      : all;

    const headHash = records.length ? records[records.length - 1].hash : null;
    const createdAt = nowIso();

    const idSeed = stableStringify({ tenantId: input.tenantId, createdAt, headHash, categories: input.includeCategories || [] });
    const id = `bundle_${sha256Hex(idSeed).slice(0, 16)}`;

    const base = {
      id,
      tenantId: input.tenantId,
      createdAt,
      format: 'JSON' as const,
      recordCount: records.length,
      headHash,
      records,
    };

    const bundleHash = sha256Hex(stableStringify(base));
    const bundle: EvidenceExportBundle = { ...base, bundleHash };

    const out = path.join(this.exportDir, `${id}.json`);
    fs.writeFileSync(out, JSON.stringify(bundle, null, 2));

    return bundle;
  }
}

export const evidenceExportManager = new EvidenceExportManager();
