import { stableHash } from '../../ledger-invariants.js';

export type CsvExport = {
  mimeType: 'text/csv';
  fileExtension: 'csv';
  content: string;
  integrityHash: string;
};

function escapeCell(v: string): string {
  const s = v ?? '';
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportAsCsv(input: { rows: Array<Record<string, string>>; columns: string[] }): CsvExport {
  const header = input.columns.map(escapeCell).join(',');
  const lines = input.rows.map((r) => input.columns.map((c) => escapeCell(String(r[c] ?? ''))).join(','));
  const content = [header, ...lines].join('\n') + '\n';
  return {
    mimeType: 'text/csv',
    fileExtension: 'csv',
    content,
    integrityHash: stableHash(content),
  };
}
