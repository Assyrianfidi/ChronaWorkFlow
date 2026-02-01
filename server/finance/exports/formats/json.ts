import { stableHash } from '../../ledger-invariants.js';

export type JsonExport = {
  mimeType: 'application/json';
  fileExtension: 'json';
  content: string;
  integrityHash: string;
};

export function exportAsJson(input: { envelope: unknown }): JsonExport {
  const content = JSON.stringify(input.envelope, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
  return {
    mimeType: 'application/json',
    fileExtension: 'json',
    content,
    integrityHash: stableHash(content),
  };
}
