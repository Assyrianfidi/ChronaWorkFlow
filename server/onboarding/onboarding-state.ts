export type OnboardingStep =
  | 'COMPANY_CREATED'
  | 'ADMIN_ASSIGNED'
  | 'COA_SEEDED'
  | 'INITIAL_PERIOD_CREATED'
  | 'TRIAL_SUBSCRIPTION_ASSIGNED';

export type OnboardingStatus = {
  companyId: string;
  steps: Record<OnboardingStep, boolean>;
};
