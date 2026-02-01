import crypto from 'crypto';

import { LedgerInvariantError, stableHash } from './ledger-invariants.js';
import { LedgerStore } from './ledger-engine.js';

export type ExportFormat = 'json' | 'csv';

export type ExportArtifact = {
  format: ExportFormat;
  contentType: string;
  content: string;
  chainHash: string;
};

function hashLine(prev: string, line: string): string {
  return crypto.createHash('sha256').update(`${prev}|${line}`).digest('hex');
}

export async function exportLedger(input: {
  companyId: string;
  store: LedgerStore;
  format: ExportFormat;
  from?: Date;
  to?: Date;
}): Promise<ExportArtifact> {
  const rows = await input.store.listPostedTransactions(input.companyId, input.from, input.to);

  const flat = rows.flatMap((r) => {
    const t = r.transaction;
    return (r.lines ?? []).map((l: any) => ({
      companyId: t.companyId,
      transactionId: t.id,
      transactionNumber: t.transactionNumber,
      date: new Date(t.date as any).toISOString(),
      type: t.type,
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      description: l.description ?? null,
      lineId: l.id,
    }));
  });

  let chain = stableHash(`ledger_export:${input.companyId}:${input.format}:${input.from?.toISOString() ?? ''}:${input.to?.toISOString() ?? ''}`);

  if (input.format === 'json') {
    const content = JSON.stringify({ rows: flat, generatedAt: new Date().toISOString() });
    chain = hashLine(chain, content);
    return { format: 'json', contentType: 'application/json', content, chainHash: chain };
  }

  const header = 'companyId,transactionId,transactionNumber,date,type,accountId,debit,credit,description,lineId';
  let csv = header;
  chain = hashLine(chain, header);

  for (const r of flat) {
    const line = [
      r.companyId,
      r.transactionId,
      r.transactionNumber,
      r.date,
      r.type,
      r.accountId,
      (r.debit ?? '').toString(),
      (r.credit ?? '').toString(),
      JSON.stringify((r.description ?? '').toString()),
      r.lineId,
    ].join(',');

    csv += `\n${line}`;
    chain = hashLine(chain, line);
  }

  if (!csv) {
    throw new LedgerInvariantError('MISSING_REQUIRED_FIELDS', 'Failed to export ledger');
  }

  return { format: 'csv', contentType: 'text/csv', content: csv, chainHash: chain };
}
