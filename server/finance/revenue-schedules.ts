import { stableId, stableHash } from './ledger-invariants.js';

export type RevenueRecognitionMethod = 'CASH' | 'ACCRUAL' | 'DEFERRED';
export type RevenueScheduleType = 'STRAIGHT_LINE' | 'MILESTONE';

export type RevenueSchedule = {
  companyId: string;
  scheduleId: string;
  createdAt: Date;
  createdBy: string;
  method: RevenueRecognitionMethod;
  scheduleType: RevenueScheduleType;
  currency: string;

  totalAmount: string;

  deferredRevenueAccountId: string;
  revenueAccountId: string;

  // Optional: for cash-basis recognition postings into cash-receipt events.
  cashAccountId?: string | null;

  startDate: Date;
  endDate: Date;

  milestones?: Array<{ date: Date; amount: string; label?: string | null }>;

  reference: {
    resourceType: string;
    resourceId: string;
  };

  memo?: string | null;
};

export type RevenueScheduleInput = Omit<RevenueSchedule, 'scheduleId' | 'createdAt'>;

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

export function deterministicScheduleId(companyId: string, reference: RevenueSchedule['reference'], startDate: Date, endDate: Date): string {
  const seed = `${companyId}:${reference.resourceType}:${reference.resourceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
  return isDeterministic() ? stableId('rev_sched', seed) : stableId('rev_sched', seed);
}

export interface RevenueScheduleStore {
  create(input: RevenueScheduleInput): Promise<RevenueSchedule>;
  getById(companyId: string, scheduleId: string): Promise<RevenueSchedule | null>;
  list(companyId: string): Promise<RevenueSchedule[]>;
}

export class MemoryRevenueScheduleStore implements RevenueScheduleStore {
  private schedules: RevenueSchedule[] = [];

  async create(input: RevenueScheduleInput): Promise<RevenueSchedule> {
    const scheduleId = deterministicScheduleId(input.companyId, input.reference, input.startDate, input.endDate);
    const created: RevenueSchedule = {
      ...input,
      scheduleId,
      createdAt: new Date(),
    };

    const existing = this.schedules.find((s) => s.companyId === input.companyId && s.scheduleId === scheduleId);
    if (!existing) {
      this.schedules.push(created);
    }

    return created;
  }

  async getById(companyId: string, scheduleId: string): Promise<RevenueSchedule | null> {
    return this.schedules.find((s) => s.companyId === companyId && s.scheduleId === scheduleId) ?? null;
  }

  async list(companyId: string): Promise<RevenueSchedule[]> {
    return this.schedules.filter((s) => s.companyId === companyId);
  }
}

export function scheduleIntegrityHash(schedule: RevenueSchedule): string {
  const canon = JSON.stringify({
    companyId: schedule.companyId,
    scheduleId: schedule.scheduleId,
    method: schedule.method,
    scheduleType: schedule.scheduleType,
    currency: schedule.currency,
    totalAmount: schedule.totalAmount,
    deferredRevenueAccountId: schedule.deferredRevenueAccountId,
    revenueAccountId: schedule.revenueAccountId,
    cashAccountId: schedule.cashAccountId ?? null,
    startDate: schedule.startDate.toISOString(),
    endDate: schedule.endDate.toISOString(),
    milestones: (schedule.milestones ?? []).map((m) => ({ date: m.date.toISOString(), amount: m.amount, label: m.label ?? null })),
    reference: schedule.reference,
    memo: schedule.memo ?? null,
  });

  return stableHash(canon);
}
