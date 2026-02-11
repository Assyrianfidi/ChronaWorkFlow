import api from './index';
import type { ApiResponse } from './index';

export interface BillingStatus {
  status: 'active' | 'trial' | 'past_due' | 'suspended';
  plan: string;
  readOnly: boolean;
  renewalDate?: string;
  subscriptionId: string | null;
}

export interface BillingLimits {
  limits: {
    invoicesPerMonth: number;
    users: number;
    companies: number;
    aiTokensPerMonth: number;
  };
  usage: {
    invoicesThisMonth: number;
    users: number;
    companies: number;
    aiTokensThisMonth: number;
  };
  planCode: string;
  subscriptionId: string | null;
}

export const billingApi = {
  /**
   * Get current billing status
   * Returns subscription status, plan tier, and read-only flag
   */
  getStatus: (companyId: string) =>
    api.get<ApiResponse<BillingStatus>>('/billing/status', {
      params: { companyId },
    }),

  /**
   * Get plan limits and current usage
   * Returns limits and usage computed from authoritative sources
   */
  getLimits: (companyId: string) =>
    api.get<ApiResponse<BillingLimits>>('/billing/limits', {
      params: { companyId },
    }),
};
