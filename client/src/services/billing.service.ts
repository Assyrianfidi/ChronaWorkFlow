import { apiClient } from "./api-client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxCompanies: number;
  features: string[];
}

export interface SubscriptionStatus {
  status: string;
  plan: string | null;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  trialDaysRemaining: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

class BillingService {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: SubscriptionPlan[];
    }>("/billing/plans");
    return response.data.data;
  }

  async createCheckoutSession(
    plan: string,
    companyId: string,
  ): Promise<CheckoutSession> {
    const response = await apiClient.post<{
      success: boolean;
      data: CheckoutSession;
    }>("/billing/create-checkout-session", { plan, companyId });
    return response.data.data;
  }

  async getSubscriptionStatus(companyId: string): Promise<SubscriptionStatus> {
    const response = await apiClient.get<{
      success: boolean;
      data: SubscriptionStatus;
    }>(`/billing/subscription-status?companyId=${companyId}`);
    return response.data.data;
  }

  async createPortalSession(companyId: string): Promise<{ url: string }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { url: string };
    }>("/billing/portal", { companyId });
    return response.data.data;
  }
}

export const billingService = new BillingService();
export default billingService;
