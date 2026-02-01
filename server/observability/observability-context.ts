import { stableHash } from '../finance/ledger-invariants.js';

export type AdmissionDecision = 'ALLOW' | 'REJECT' | 'DEFER' | 'UNKNOWN';

export interface LedgerContext {
  companyId?: string;
  transactionId?: string;
  transactionNumber?: string;
  periodId?: string;
}

export interface ObservabilityContext {
  correlationId: string;
  requestId: string;
  tenantId: string;
  actorId: string;
  admissionDecision?: AdmissionDecision;
  admissionReason?: string;
  ledger?: LedgerContext;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

let counter = 0;

export function createCorrelationId(input: { prefix: string; requestId: string; tenantId?: string }): string {
  const tenant = input.tenantId || 'system';

  if (isDeterministic()) {
    return `${input.prefix}_${tenant}_${input.requestId}`;
  }

  counter += 1;
  return `${input.prefix}_${stableHash(`${tenant}:${input.requestId}:${counter}`).slice(0, 16)}`;
}

export function createRequestId(prefix: string = 'req'): string {
  if (isDeterministic()) {
    counter += 1;
    return `${prefix}_${counter}`;
  }

  counter += 1;
  return `${prefix}_${stableHash(`${prefix}:${counter}`).slice(0, 16)}`;
}

export function withAdmissionResult(
  ctx: ObservabilityContext,
  input: { decision: AdmissionDecision; reason?: string },
): ObservabilityContext {
  return {
    ...ctx,
    admissionDecision: input.decision,
    admissionReason: input.reason,
  };
}
