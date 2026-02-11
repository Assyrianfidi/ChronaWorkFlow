import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { toast } from "sonner";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  billingInterval: "month" | "year";
  stripeProductId?: string;
  stripePriceId?: string;
  includedUsers: number;
  includedInvoices: number;
  includedAiTokens: number;
  includedApiCalls: number;
  maxUsers?: number;
  maxInvoices?: number;
  maxAiTokens?: number;
  maxApiCalls?: number;
  allowApiAccess: boolean;
  allowAuditExports: boolean;
  allowAdvancedAnalytics: boolean;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  pastDueSince?: string;
  suspendedAt?: string;
  ownerGrantedFree: boolean;
  ownerNotes?: string;
}

interface Entitlements {
  maxUsers: number;
  maxEntities: number;
  maxWorkflowsPerMonth: number;
  maxApiCallsPerMonth: number;
  maxAiTokensPerMonth: number;
  allowAccountingPeriodLocks: boolean;
  allowAccountingExports: boolean;
  allowAuditExports: boolean;
  allowAdvancedAnalytics: boolean;
  allowApiAccess: boolean;
  allowCustomReports: boolean;
  allowMultiEntityConsolidation: boolean;
  allowHoldingCompanyView: boolean;
  allowCustomWorkflowDefinitions: boolean;
  allowWorkflowApprovals: boolean;
  allowWorkflowScheduling: boolean;
  supportLevel: "community" | "business" | "priority" | "white-glove";
  slaUptime: string;
}

export function useBillingPlans() {
  const {
    data: plans,
    isLoading,
    error,
  } = useQuery<Plan[]>({
    queryKey: ["billing-plans"],
    queryFn: async () => {
      const response = await api.get<Plan[]>("/billing/plans");
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return { plans, isLoading, error };
}

export function useCurrentSubscription(companyId: string) {
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery<{ plan: Plan; entitlements: Entitlements }>({
    queryKey: ["billing-subscription", companyId],
    queryFn: async () => {
      const response = await api.get<{
        plan: Plan;
        entitlements: Entitlements;
      }>(`/billing/subscription?companyId=${companyId}`);
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const queryClient = useQueryClient();

  const upgrade = useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const response = await api.post("/billing/upgrade", {
        planId,
        companyId,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        "Upgrade request received. You will be redirected to payment.",
      );
      queryClient.invalidateQueries({ queryKey: ["billing-subscription"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Upgrade failed.");
    },
  });

  return { subscription, isLoading, error, upgrade };
}
