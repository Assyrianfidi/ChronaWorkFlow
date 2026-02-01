import { stableHash } from '../../ledger-invariants.js';

export type XbrlExport = {
  mimeType: 'application/xml';
  fileExtension: 'xbrl.xml';
  content: string;
  integrityHash: string;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportXbrlPlaceholder(input: {
  companyId: string;
  reportKind: string;
  periodLabel: string;
  sourceIntegrityHash: string;
}): XbrlExport {
  const content = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<xbrl>',
    `  <companyId>${escapeXml(input.companyId)}</companyId>`,
    `  <reportKind>${escapeXml(input.reportKind)}</reportKind>`,
    `  <period>${escapeXml(input.periodLabel)}</period>`,
    `  <sourceIntegrityHash>${escapeXml(input.sourceIntegrityHash)}</sourceIntegrityHash>`,
    '</xbrl>',
    '',
  ].join('\n');

  return {
    mimeType: 'application/xml',
    fileExtension: 'xbrl.xml',
    content,
    integrityHash: stableHash(content),
  };
}
