import { TaxExportResult } from './tax-schemas.js';

export type TaxExportEnvelope = {
  kind: 'TAX_EXPORT';
  version: 1;
  companyId: string;
  periodId: string;
  period: { from: string; to: string };
  trialBalanceHash: string;
  integrityHash: string;
  payload: TaxExportResult;
};

export function buildTaxExportEnvelope(result: TaxExportResult): TaxExportEnvelope {
  return {
    kind: 'TAX_EXPORT',
    version: 1,
    companyId: result.companyId,
    periodId: result.periodId,
    period: { from: result.period.from.toISOString(), to: result.period.to.toISOString() },
    trialBalanceHash: result.trialBalanceHash,
    integrityHash: result.integrityHash,
    payload: result,
  };
}
