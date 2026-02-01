import { stableHash } from '../ledger-invariants.js';

export type TaxSystem = 'SALES_TAX' | 'VAT' | 'GST_HST';

export type TaxJurisdictionConfig = {
  jurisdictionId: string;
  name: string;
  taxSystem: TaxSystem;
  currency: string;
  taxPayableAccountIds: string[];
  taxReceivableAccountIds?: string[];
  taxRateBps?: number;
};

export type TaxExportConfig = {
  companyId: string;
  periodId: string;
  period: { from: Date; to: Date };
  jurisdictions: TaxJurisdictionConfig[];
};

export type TaxJurisdictionSummary = {
  jurisdictionId: string;
  name: string;
  taxSystem: TaxSystem;
  currency: string;
  taxCollectedCents: bigint;
  taxRefundableCents: bigint;
  netTaxDueCents: bigint;
  accountIds: {
    payable: string[];
    receivable: string[];
  };
};

export type TaxExportResult = {
  companyId: string;
  periodId: string;
  period: { from: Date; to: Date };
  summaries: TaxJurisdictionSummary[];
  trialBalanceHash: string;
  integrityHash: string;
};

export function canonicalizeForHash(obj: unknown): string {
  return JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

export function hashTaxExport(result: Omit<TaxExportResult, 'integrityHash'>): string {
  return stableHash(
    canonicalizeForHash({
      companyId: result.companyId,
      periodId: result.periodId,
      period: { from: result.period.from.toISOString(), to: result.period.to.toISOString() },
      trialBalanceHash: result.trialBalanceHash,
      summaries: result.summaries.map((s) => ({
        jurisdictionId: s.jurisdictionId,
        name: s.name,
        taxSystem: s.taxSystem,
        currency: s.currency,
        taxCollectedCents: s.taxCollectedCents,
        taxRefundableCents: s.taxRefundableCents,
        netTaxDueCents: s.netTaxDueCents,
        accountIds: {
          payable: [...s.accountIds.payable].sort(),
          receivable: [...s.accountIds.receivable].sort(),
        },
      })),
    }),
  );
}
