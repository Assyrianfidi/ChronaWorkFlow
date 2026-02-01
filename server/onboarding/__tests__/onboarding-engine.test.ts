import { describe, expect, it } from 'vitest';

import { OnboardingEngine } from '../onboarding-engine.js';
import { MemoryOnboardingStore } from '../onboarding-store.js';

describe('STEP 17: onboarding engine (idempotent + resumable)', () => {
  it('is idempotent: a second run does not re-mutate completed steps', async () => {
    const store = new MemoryOnboardingStore();
    const engine = new OnboardingEngine(store);

    const at = new Date('2026-01-15T00:00:00.000Z');

    const first = await engine.runFirstRunOnboarding({
      company: { name: 'TestCo', taxId: '12-3456789' },
      adminUserId: 'u_admin',
      correlationId: 'corr1',
      at,
    });

    expect(first.steps.TRIAL_SUBSCRIPTION_ASSIGNED).toBe(true);

    const callsAfterFirst = { ...store.calls };

    const second = await engine.runFirstRunOnboarding({
      company: { name: 'TestCo', taxId: '12-3456789' },
      adminUserId: 'u_admin',
      correlationId: 'corr2',
      at,
    });

    expect(second.steps).toEqual(first.steps);

    // No additional mutations should occur on re-run.
    expect(store.calls.createCompany).toBe(callsAfterFirst.createCompany);
    expect(store.calls.createAccount).toBe(callsAfterFirst.createAccount);
    expect(store.calls.createAccountingPeriod).toBe(callsAfterFirst.createAccountingPeriod);
    expect(store.calls.createTrialSubscription).toBe(callsAfterFirst.createTrialSubscription);
  });

  it('resumes from partial state and completes remaining steps', async () => {
    const store = new MemoryOnboardingStore();
    // Seed an onboarding run that is mid-flight.
    await store.findOrCreateCompany({ name: 'PartialCo' });
    await store.createOnboardingRun({
      companyId: 'company_test',
      adminUserId: 'u_admin',
      status: 'in_progress',
      steps: {
        COMPANY_CREATED: true,
        ADMIN_ASSIGNED: true,
        COA_SEEDED: false,
        INITIAL_PERIOD_CREATED: false,
        TRIAL_SUBSCRIPTION_ASSIGNED: false,
      },
      integrityHash: 'x',
    });

    const engine = new OnboardingEngine(store);

    const res = await engine.runFirstRunOnboarding({
      company: { name: 'PartialCo' },
      adminUserId: 'u_admin',
      correlationId: 'corr',
      at: new Date('2026-03-05T00:00:00.000Z'),
    });

    expect(res.steps.COA_SEEDED).toBe(true);
    expect(res.steps.INITIAL_PERIOD_CREATED).toBe(true);
    expect(res.steps.TRIAL_SUBSCRIPTION_ASSIGNED).toBe(true);

    const run = await store.getOnboardingRun('company_test');
    expect(run?.status).toBe('completed');
    expect(typeof run?.integrityHash).toBe('string');
    expect((run?.integrityHash ?? '').length).toBeGreaterThan(0);
  });
});
