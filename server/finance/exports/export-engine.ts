import { getImmutableAuditLogger } from '../../compliance/immutable-audit-log.js';
import { PeriodLocks, DrizzlePeriodLocks } from '../period-locks.js';
import { stableHash, stableId } from '../ledger-invariants.js';

import { exportAsCsv } from './formats/csv.js';
import { exportAsJson } from './formats/json.js';
import { exportPdfMetadata } from './formats/pdf-metadata.js';
import { exportXbrlPlaceholder } from './formats/xbrl.js';

export type ExportFormat = 'CSV' | 'JSON' | 'PDF_METADATA' | 'XBRL';

export type FinalizedReportEnvelope = {
  kind: string;
  version: number;
  companyId: string;
  period: { from?: string; to?: string; asOf?: string };
  integrityHash: string;
  payload: unknown;
};

export type ExportResult = {
  companyId: string;
  format: ExportFormat;
  reportKind: string;
  fileExtension: string;
  mimeType: string;
  content: string;
  sourceIntegrityHash: string;
  integrityHash: string;
};

function getAudit() {
  return getImmutableAuditLogger();
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function correlationId(prefix: string, companyId: string, reportKind: string, sourceHash: string): string {
  const seed = `${prefix}:${companyId}:${reportKind}:${sourceHash}`;
  return isDeterministic() ? `exp_${prefix}_${companyId}_${reportKind}` : stableId('exp', seed);
}

export class ExportEngine {
  constructor(private readonly periodLocks: PeriodLocks = new DrizzlePeriodLocks()) {}

  async exportFinalizedReport(input: {
    envelope: FinalizedReportEnvelope;
    actorId: string;
    format: ExportFormat;
    exportMode: 'FINAL' | 'DRAFT';
    correlationId?: string;
  }): Promise<ExportResult> {
    const companyId = input.envelope.companyId;
    const reportKind = input.envelope.kind;
    const sourceIntegrityHash = input.envelope.integrityHash;

    const corr = input.correlationId ?? correlationId('finalized', companyId, reportKind, sourceIntegrityHash);

    if (input.envelope.period.asOf) {
      const asOf = new Date(input.envelope.period.asOf);
      const status = await this.periodLocks.getPeriodStateForDate({ companyId, date: asOf });
      if (status.state === 'HARD_LOCKED' && input.exportMode === 'DRAFT') {
        getAudit().logSecurityEvent({
          tenantId: companyId,
          actorId: input.actorId,
          action: 'EXPORT_DENIED_DRAFT_ON_HARD_LOCK',
          resourceType: 'EXPORT',
          resourceId: status.periodId ?? companyId,
          outcome: 'DENIED',
          correlationId: corr,
          metadata: { reportKind, format: input.format, asOf: input.envelope.period.asOf },
        });
        throw new Error('Draft exports are forbidden for HARD_LOCKED periods');
      }
    }

    const exportIntegrityHashSeed = stableHash(
      JSON.stringify({
        companyId,
        format: input.format,
        reportKind,
        exportMode: input.exportMode,
        sourceIntegrityHash,
      }),
    );

    const built = (() => {
      if (input.format === 'JSON') {
        return exportAsJson({ envelope: input.envelope });
      }

      if (input.format === 'CSV') {
        const envelopeAny = input.envelope as any;
        const payload = envelopeAny.payload as any;
        const rows = Array.isArray(payload?.rows) ? payload.rows : [];
        const columns = Array.isArray(payload?.columns)
          ? payload.columns
          : rows.length
            ? Object.keys(rows[0]).sort()
            : ['empty'];

        return exportAsCsv({
          columns,
          rows: rows.map((r: any) => {
            const out: Record<string, string> = {};
            for (const c of columns) out[c] = String(r[c] ?? '');
            return out;
          }),
        });
      }

      if (input.format === 'PDF_METADATA') {
        const periodLabel = input.envelope.period.asOf
          ? `asOf:${input.envelope.period.asOf}`
          : `from:${input.envelope.period.from ?? ''}-to:${input.envelope.period.to ?? ''}`;

        return exportPdfMetadata({
          title: `${reportKind} Export`,
          subject: reportKind,
          companyId,
          periodLabel,
          sourceIntegrityHash,
          generatedAt: new Date(),
        });
      }

      return exportXbrlPlaceholder({
        companyId,
        reportKind,
        periodLabel: input.envelope.period.asOf
          ? input.envelope.period.asOf
          : `${input.envelope.period.from ?? ''}:${input.envelope.period.to ?? ''}`,
        sourceIntegrityHash,
      });
    })();

    const integrityHash = stableHash(`${built.integrityHash}:${exportIntegrityHashSeed}`);

    getAudit().logSecurityEvent({
      tenantId: companyId,
      actorId: input.actorId,
      action: 'FINALIZED_REPORT_EXPORTED',
      resourceType: 'EXPORT',
      resourceId: companyId,
      outcome: 'SUCCESS',
      correlationId: corr,
      metadata: {
        reportKind,
        format: input.format,
        exportMode: input.exportMode,
        sourceIntegrityHash,
        integrityHash,
      },
    });

    return {
      companyId,
      format: input.format,
      reportKind,
      fileExtension: built.fileExtension,
      mimeType: built.mimeType,
      content: built.content,
      sourceIntegrityHash,
      integrityHash,
    };
  }
}
