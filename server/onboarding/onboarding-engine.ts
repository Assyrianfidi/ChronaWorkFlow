import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { stableHash } from '../finance/ledger-invariants.js';

import { DEFAULT_COA } from './templates/default-coa.js';
import type { OnboardingStatus, OnboardingStep } from './onboarding-state.js';
import { DrizzleOnboardingStore, type OnboardingStore } from './onboarding-store.js';

function computeIntegrityHash(input: { companyId: string; adminUserId: string; steps: Record<string, boolean> }): string {
  const canonical = {
    companyId: input.companyId,
    adminUserId: input.adminUserId,
    steps: Object.keys(input.steps)
      .sort()
      .reduce((acc, k) => {
        (acc as any)[k] = input.steps[k];
        return acc;
      }, {} as Record<string, boolean>),
  };
  return stableHash(JSON.stringify(canonical));
}

function stepKey(companyId: string, step: OnboardingStep): string {
  return stableHash(`${companyId}:${step}`).slice(0, 24);
}

export class OnboardingEngine {
  constructor(private readonly store: OnboardingStore = new DrizzleOnboardingStore()) {}

  async runFirstRunOnboarding(input: {
    company: { name: string; email?: string; phone?: string; address?: string; taxId?: string; fiscalYearEnd?: string; currency?: string };
    adminUserId: string;
    correlationId: string;
    at?: Date;
  }): Promise<OnboardingStatus> {
    const audit = getImmutableAuditLogger();

    const at = input.at ?? new Date();
    const stepState: Record<OnboardingStep, boolean> = {
      COMPANY_CREATED: false,
      ADMIN_ASSIGNED: false,
      COA_SEEDED: false,
      INITIAL_PERIOD_CREATED: false,
      TRIAL_SUBSCRIPTION_ASSIGNED: false,
    };

    const company = await this.store.findOrCreateCompany(input.company);

    const existingRun = await this.store.getOnboardingRun(company.id);

    const initialSteps = existingRun?.steps
      ? ({ ...(existingRun.steps as any) } as Record<OnboardingStep, boolean>)
      : stepState;

    for (const k of Object.keys(stepState) as OnboardingStep[]) {
      stepState[k] = Boolean((initialSteps as any)[k]);
    }

    const baseIntegrity = computeIntegrityHash({ companyId: company.id, adminUserId: input.adminUserId, steps: stepState as any });

    if (!existingRun) {
      await this.store.createOnboardingRun({
        companyId: company.id,
        adminUserId: input.adminUserId,
        steps: stepState as any,
        status: 'in_progress',
        integrityHash: baseIntegrity,
      });
    }

    if (!stepState.COMPANY_CREATED) {
      stepState.COMPANY_CREATED = true;
      const integrityHash = computeIntegrityHash({ companyId: company.id, adminUserId: input.adminUserId, steps: stepState as any });
      await this.store.updateOnboardingRun(company.id, { steps: stepState as any, integrityHash });

      audit.logSecurityEvent({
        tenantId: company.id,
        actorId: input.adminUserId,
        action: 'ONBOARDING_COMPANY_CREATED',
        resourceType: 'ONBOARDING',
        resourceId: stepKey(company.id, 'COMPANY_CREATED'),
        outcome: 'SUCCESS',
        correlationId: input.correlationId,
        severity: 'MEDIUM',
        metadata: { companyName: company.name, integrityHash },
      });
    }

    // Step 2: admin assignment (idempotent: userCompanyAccess unique index)
    if (!stepState.ADMIN_ASSIGNED) {
      await this.store.ensureAdminMembership({ companyId: company.id, adminUserId: input.adminUserId });
      await this.store.setUserCurrentCompany({ userId: input.adminUserId, companyId: company.id });

      stepState.ADMIN_ASSIGNED = true;
      const integrityHash = computeIntegrityHash({ companyId: company.id, adminUserId: input.adminUserId, steps: stepState as any });
      await this.store.updateOnboardingRun(company.id, { steps: stepState as any, integrityHash });

      audit.logSecurityEvent({
        tenantId: company.id,
        actorId: input.adminUserId,
        action: 'ONBOARDING_ADMIN_ASSIGNED',
        resourceType: 'ONBOARDING',
        resourceId: stepKey(company.id, 'ADMIN_ASSIGNED'),
        outcome: 'SUCCESS',
        correlationId: input.correlationId,
        severity: 'MEDIUM',
        metadata: { integrityHash },
      });
    }

    // Step 3: seed COA (idempotent by uniqueCompanyCode)
    if (!stepState.COA_SEEDED) {
      const codeToId = new Map<string, string>();
      for (const acct of DEFAULT_COA) {
        const parentId = acct.parentCode ? codeToId.get(acct.parentCode) : undefined;
        try {
          const created = await this.store.createAccount({
            companyId: company.id,
            code: acct.code,
            name: acct.name,
            type: acct.type,
            parentId,
            description: acct.description,
          });
          codeToId.set(acct.code, created.id);
        } catch {
          const existing = await this.store.getAccountByCode({ companyId: company.id, code: acct.code });
          if (existing) {
            codeToId.set(acct.code, existing.id);
          } else {
            throw new Error(`Failed to seed account ${acct.code}`);
          }
        }
      }

      stepState.COA_SEEDED = true;
      const integrityHash = computeIntegrityHash({ companyId: company.id, adminUserId: input.adminUserId, steps: stepState as any });
      await this.store.updateOnboardingRun(company.id, { steps: stepState as any, integrityHash });

      audit.logSecurityEvent({
        tenantId: company.id,
        actorId: input.adminUserId,
        action: 'ONBOARDING_COA_SEEDED',
        resourceType: 'ONBOARDING',
        resourceId: stepKey(company.id, 'COA_SEEDED'),
        outcome: 'SUCCESS',
        correlationId: input.correlationId,
        severity: 'LOW',
        metadata: { accounts: DEFAULT_COA.length, integrityHash },
      });
    }

    // Step 4: initial accounting period (idempotent by uniqueCompanyPeriod)
    const today = at;
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

    const existingPeriod = await this.store.getAccountingPeriod({ companyId: company.id, startDate: start, endDate: end });

    if (!stepState.INITIAL_PERIOD_CREATED) {
      if (!existingPeriod) {
        await this.store.createAccountingPeriod({
          companyId: company.id,
          startDate: start,
          endDate: end,
          actorId: input.adminUserId,
          correlationId: input.correlationId,
        });
      }

      stepState.INITIAL_PERIOD_CREATED = true;
      const integrityHash = computeIntegrityHash({ companyId: company.id, adminUserId: input.adminUserId, steps: stepState as any });
      await this.store.updateOnboardingRun(company.id, { steps: stepState as any, integrityHash });

      audit.logSecurityEvent({
        tenantId: company.id,
        actorId: input.adminUserId,
        action: 'ONBOARDING_INITIAL_PERIOD_CREATED',
        resourceType: 'ONBOARDING',
        resourceId: stepKey(company.id, 'INITIAL_PERIOD_CREATED'),
        outcome: 'SUCCESS',
        correlationId: input.correlationId,
        severity: 'LOW',
        metadata: { start: start.toISOString(), end: end.toISOString(), integrityHash },
      });
    }

    // Step 5: trial subscription assignment (idempotent by active subscription existence)
    const plan = await this.store.getPlan({ code: 'team', interval: 'month' });
    if (!plan) {
      throw new Error('Missing required plan: team/month');
    }

    const activeSub = await this.store.getActiveSubscription(company.id);

    if (!stepState.TRIAL_SUBSCRIPTION_ASSIGNED) {
      if (!activeSub) {
        const trialStart = at;
        const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);

        await this.store.createTrialSubscription({ companyId: company.id, planId: plan.id, trialStart, trialEnd });
      }

      stepState.TRIAL_SUBSCRIPTION_ASSIGNED = true;
      const integrityHash = computeIntegrityHash({ companyId: company.id, adminUserId: input.adminUserId, steps: stepState as any });
      await this.store.updateOnboardingRun(company.id, { steps: stepState as any, status: 'completed', integrityHash });

      audit.logSecurityEvent({
        tenantId: company.id,
        actorId: input.adminUserId,
        action: 'ONBOARDING_TRIAL_ASSIGNED',
        resourceType: 'ONBOARDING',
        resourceId: stepKey(company.id, 'TRIAL_SUBSCRIPTION_ASSIGNED'),
        outcome: 'SUCCESS',
        correlationId: input.correlationId,
        severity: 'MEDIUM',
        metadata: { planCode: 'team', trialDays: 14, integrityHash },
      });
    }

    return {
      companyId: company.id,
      steps: {
        COMPANY_CREATED: stepState.COMPANY_CREATED,
        ADMIN_ASSIGNED: stepState.ADMIN_ASSIGNED,
        COA_SEEDED: stepState.COA_SEEDED,
        INITIAL_PERIOD_CREATED: stepState.INITIAL_PERIOD_CREATED,
        TRIAL_SUBSCRIPTION_ASSIGNED: stepState.TRIAL_SUBSCRIPTION_ASSIGNED,
      },
    };
  }
}
