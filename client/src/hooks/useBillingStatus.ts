import { useQuery } from "@tanstack/react-query";
import api from "@/api";

type BillingMode = "ok" | "warn_past_due" | "read_only" | "suspended";

interface BillingStatusResponse {
  mode: BillingMode;
  subscription: {
    id: string;
    status: string;
    planId: string;
    currentPeriodEnd?: string;
    pastDueSince?: string;
    canceledAt?: string;
    suspendedAt?: string;
  } | null;
}

export function useBillingStatus(companyId: string) {
  const {
    data: billing,
    isLoading,
    error,
  } = useQuery<BillingStatusResponse>({
    queryKey: ["billing-status", companyId],
    queryFn: async () => {
      const response = await api.get<BillingStatusResponse>(
        `/billing/status?companyId=${companyId}`,
      );
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const isReadOnly = billing?.mode === "read_only";
  const isSuspended = billing?.mode === "suspended";
  const isPastDue = billing?.mode === "warn_past_due";
  const isActive = billing?.mode === "ok";

  return {
    billing,
    isLoading,
    error,
    isReadOnly,
    isSuspended,
    isPastDue,
    isActive,
    mode: billing?.mode,
  };
}
