import { stableHash } from '../../ledger-invariants.js';

export type PdfMetadataExport = {
  mimeType: 'application/json';
  fileExtension: 'pdf.metadata.json';
  content: string;
  integrityHash: string;
};

export function exportPdfMetadata(input: {
  title: string;
  subject: string;
  companyId: string;
  periodLabel: string;
  sourceIntegrityHash: string;
  generatedAt: Date;
}): PdfMetadataExport {
  const payload = {
    kind: 'PDF_METADATA',
    version: 1,
    title: input.title,
    subject: input.subject,
    companyId: input.companyId,
    periodLabel: input.periodLabel,
    sourceIntegrityHash: input.sourceIntegrityHash,
    generatedAt: input.generatedAt.toISOString(),
  };

  const content = JSON.stringify(payload, null, 2);
  return {
    mimeType: 'application/json',
    fileExtension: 'pdf.metadata.json',
    content,
    integrityHash: stableHash(content),
  };
}
