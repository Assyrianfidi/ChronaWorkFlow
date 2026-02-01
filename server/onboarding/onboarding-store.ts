import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db.js';
import * as s from '../../shared/schema.js';
import { storage } from '../storage.js';
import { PeriodEngine } from '../finance/period-engine.js';

export type OnboardingCompanyInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  fiscalYearEnd?: string;
  currency?: string;
};

export type OnboardingRunSteps = Record<string, boolean>;

export type OnboardingRunRow = {
  companyId: string;
  adminUserId: string;
  steps: OnboardingRunSteps;
  status: string;
  integrityHash: string;
};

export interface OnboardingStore {
  findOrCreateCompany(input: OnboardingCompanyInput): Promise<{ id: string; name: string }>;
  getOnboardingRun(companyId: string): Promise<OnboardingRunRow | null>;
  createOnboardingRun(input: OnboardingRunRow): Promise<void>;
  updateOnboardingRun(companyId: string, patch: Partial<OnboardingRunRow> & { steps?: OnboardingRunSteps }): Promise<void>;

  ensureAdminMembership(input: { companyId: string; adminUserId: string }): Promise<void>;
  setUserCurrentCompany(input: { userId: string; companyId: string }): Promise<void>;

  createAccount(input: {
    companyId: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parentId?: string;
    description?: string;
  }): Promise<{ id: string }>; 

  getAccountByCode(input: { companyId: string; code: string }): Promise<{ id: string } | null>;

  getAccountingPeriod(input: { companyId: string; startDate: Date; endDate: Date }): Promise<{ id: string } | null>;
  createAccountingPeriod(input: { companyId: string; startDate: Date; endDate: Date; actorId: string; correlationId: string }): Promise<void>;

  getPlan(input: { code: string; interval: 'month' | 'year' }): Promise<{ id: string } | null>;
  getActiveSubscription(companyId: string): Promise<{ id: string } | null>;
  createTrialSubscription(input: { companyId: string; planId: string; trialStart: Date; trialEnd: Date }): Promise<void>;
}

export class DrizzleOnboardingStore implements OnboardingStore {
  private readonly periodEngine = new PeriodEngine();

  async findOrCreateCompany(input: OnboardingCompanyInput): Promise<{ id: string; name: string }> {
    const existing = await db
      .select()
      .from(s.companies)
      .where(and(eq(s.companies.name, input.name), sql`${s.companies.taxId} is not distinct from ${input.taxId ?? null}`))
      .limit(1);

    const company = existing[0]
      ? existing[0]
      : await storage.createCompany({
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          taxId: input.taxId,
          fiscalYearEnd: input.fiscalYearEnd ?? '12-31',
          currency: input.currency ?? 'USD',
        } as any);

    return { id: company.id, name: company.name };
  }

  async getOnboardingRun(companyId: string): Promise<OnboardingRunRow | null> {
    const [row] = await db.select().from(s.onboardingRuns).where(eq(s.onboardingRuns.companyId, companyId)).limit(1);
    if (!row) return null;
    return {
      companyId: row.companyId,
      adminUserId: row.adminUserId,
      steps: row.steps as any,
      status: String(row.status),
      integrityHash: String(row.integrityHash),
    };
  }

  async createOnboardingRun(input: OnboardingRunRow): Promise<void> {
    await db.insert(s.onboardingRuns).values({
      companyId: input.companyId,
      adminUserId: input.adminUserId,
      steps: input.steps as any,
      status: input.status,
      integrityHash: input.integrityHash,
    } as any);
  }

  async updateOnboardingRun(companyId: string, patch: Partial<OnboardingRunRow> & { steps?: OnboardingRunSteps }): Promise<void> {
    await db
      .update(s.onboardingRuns)
      .set({
        ...(patch.adminUserId ? { adminUserId: patch.adminUserId } : {}),
        ...(patch.steps ? { steps: patch.steps as any } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.integrityHash ? { integrityHash: patch.integrityHash } : {}),
        updatedAt: new Date(),
      } as any)
      .where(eq(s.onboardingRuns.companyId, companyId));
  }

  async ensureAdminMembership(input: { companyId: string; adminUserId: string }): Promise<void> {
    await db
      .insert(s.userCompanyAccess)
      .values({ userId: input.adminUserId, companyId: input.companyId, role: 'admin' } as any)
      .onConflictDoNothing();
  }

  async setUserCurrentCompany(input: { userId: string; companyId: string }): Promise<void> {
    await storage.updateUser(input.userId, { currentCompanyId: input.companyId } as any);
  }

  async createAccount(input: {
    companyId: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parentId?: string;
    description?: string;
  }): Promise<{ id: string }> {
    const created = await storage.createAccount({
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      type: input.type,
      parentId: input.parentId,
      description: input.description,
    } as any);
    return { id: created.id };
  }

  async getAccountByCode(input: { companyId: string; code: string }): Promise<{ id: string } | null> {
    const [row] = await db
      .select()
      .from(s.accounts)
      .where(and(eq(s.accounts.companyId, input.companyId), eq(s.accounts.code, input.code)))
      .limit(1);
    return row ? { id: row.id } : null;
  }

  async getAccountingPeriod(input: { companyId: string; startDate: Date; endDate: Date }): Promise<{ id: string } | null> {
    const [row] = await db
      .select()
      .from(s.accountingPeriods)
      .where(and(eq(s.accountingPeriods.companyId, input.companyId), eq(s.accountingPeriods.startDate, input.startDate), eq(s.accountingPeriods.endDate, input.endDate)) as any)
      .limit(1);
    return row ? { id: row.id } : null;
  }

  async createAccountingPeriod(input: { companyId: string; startDate: Date; endDate: Date; actorId: string; correlationId: string }): Promise<void> {
    await this.periodEngine.createPeriod({
      companyId: input.companyId,
      startDate: input.startDate,
      endDate: input.endDate,
      actorId: input.actorId,
      correlationId: input.correlationId,
    });
  }

  async getPlan(input: { code: string; interval: 'month' | 'year' }): Promise<{ id: string } | null> {
    const [row] = await db
      .select()
      .from(s.plans)
      .where(and(eq(s.plans.code, input.code), eq(s.plans.billingInterval, input.interval), sql`${s.plans.deletedAt} is null`) as any)
      .limit(1);
    return row ? { id: row.id } : null;
  }

  async getActiveSubscription(companyId: string): Promise<{ id: string } | null> {
    const [row] = await db
      .select()
      .from(s.subscriptions)
      .where(and(eq(s.subscriptions.companyId, companyId), sql`${s.subscriptions.deletedAt} is null`, sql`${s.subscriptions.status} IN ('trialing','active','past_due')`) as any)
      .orderBy(sql`${s.subscriptions.createdAt} desc`)
      .limit(1);
    return row ? { id: row.id } : null;
  }

  async createTrialSubscription(input: { companyId: string; planId: string; trialStart: Date; trialEnd: Date }): Promise<void> {
    await db.insert(s.subscriptions).values({
      companyId: input.companyId,
      planId: input.planId,
      status: 'trialing',
      trialStart: input.trialStart,
      trialEnd: input.trialEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }
}

export class MemoryOnboardingStore implements OnboardingStore {
  public calls = {
    createCompany: 0,
    createOnboardingRun: 0,
    updateOnboardingRun: 0,
    ensureAdminMembership: 0,
    setUserCurrentCompany: 0,
    createAccount: 0,
    createAccountingPeriod: 0,
    createTrialSubscription: 0,
  };

  private company: { id: string; name: string } | null = null;
  private run: OnboardingRunRow | null = null;
  private memberships = new Set<string>();
  private userCurrentCompany = new Map<string, string>();
  private accounts = new Map<string, { id: string; code: string }>();
  private periods = new Map<string, { id: string; start: string; end: string }>();
  private plans = new Map<string, { id: string; code: string; interval: 'month' | 'year' }>();
  private subscriptions = new Map<string, { id: string; status: string }>();

  constructor() {
    this.plans.set('team:month', { id: 'plan_team_month', code: 'team', interval: 'month' });
  }

  async findOrCreateCompany(input: OnboardingCompanyInput): Promise<{ id: string; name: string }> {
    if (!this.company) {
      this.calls.createCompany += 1;
      this.company = { id: 'company_test', name: input.name };
    }
    return this.company;
  }

  async getOnboardingRun(companyId: string): Promise<OnboardingRunRow | null> {
    if (!this.run) return null;
    if (this.run.companyId !== companyId) return null;
    return this.run;
  }

  async createOnboardingRun(input: OnboardingRunRow): Promise<void> {
    this.calls.createOnboardingRun += 1;
    this.run = { ...input, steps: { ...input.steps } };
  }

  async updateOnboardingRun(companyId: string, patch: Partial<OnboardingRunRow> & { steps?: OnboardingRunSteps }): Promise<void> {
    this.calls.updateOnboardingRun += 1;
    if (!this.run || this.run.companyId !== companyId) throw new Error('run not found');
    this.run = {
      ...this.run,
      ...patch,
      steps: patch.steps ? { ...patch.steps } : this.run.steps,
    };
  }

  async ensureAdminMembership(input: { companyId: string; adminUserId: string }): Promise<void> {
    this.calls.ensureAdminMembership += 1;
    this.memberships.add(`${input.adminUserId}:${input.companyId}`);
  }

  async setUserCurrentCompany(input: { userId: string; companyId: string }): Promise<void> {
    this.calls.setUserCurrentCompany += 1;
    this.userCurrentCompany.set(input.userId, input.companyId);
  }

  async createAccount(input: {
    companyId: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parentId?: string;
    description?: string;
  }): Promise<{ id: string }> {
    this.calls.createAccount += 1;
    const key = `${input.companyId}:${input.code}`;
    if (this.accounts.has(key)) {
      throw new Error('duplicate');
    }
    const id = `acct_${input.code}`;
    this.accounts.set(key, { id, code: input.code });
    return { id };
  }

  async getAccountByCode(input: { companyId: string; code: string }): Promise<{ id: string } | null> {
    const row = this.accounts.get(`${input.companyId}:${input.code}`);
    return row ? { id: row.id } : null;
  }

  async getAccountingPeriod(input: { companyId: string; startDate: Date; endDate: Date }): Promise<{ id: string } | null> {
    const key = `${input.companyId}:${input.startDate.toISOString()}:${input.endDate.toISOString()}`;
    const row = this.periods.get(key);
    return row ? { id: row.id } : null;
  }

  async createAccountingPeriod(input: { companyId: string; startDate: Date; endDate: Date; actorId: string; correlationId: string }): Promise<void> {
    this.calls.createAccountingPeriod += 1;
    const key = `${input.companyId}:${input.startDate.toISOString()}:${input.endDate.toISOString()}`;
    if (!this.periods.has(key)) {
      this.periods.set(key, { id: 'period_1', start: input.startDate.toISOString(), end: input.endDate.toISOString() });
    }
  }

  async getPlan(input: { code: string; interval: 'month' | 'year' }): Promise<{ id: string } | null> {
    const row = this.plans.get(`${input.code}:${input.interval}`);
    return row ? { id: row.id } : null;
  }

  async getActiveSubscription(companyId: string): Promise<{ id: string } | null> {
    const row = this.subscriptions.get(companyId);
    return row ? { id: row.id } : null;
  }

  async createTrialSubscription(input: { companyId: string; planId: string; trialStart: Date; trialEnd: Date }): Promise<void> {
    this.calls.createTrialSubscription += 1;
    if (!this.subscriptions.has(input.companyId)) {
      this.subscriptions.set(input.companyId, { id: 'sub_1', status: 'trialing' });
    }
  }
}
