import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { toast } from "sonner";

interface AccountingPeriod {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  isLocked: boolean;
}

export function useAccountingPeriods(companyId: string) {
  const queryClient = useQueryClient();

  const {
    data: periods,
    isLoading,
    error,
  } = useQuery<AccountingPeriod[]>({
    queryKey: ["accounting-periods", companyId],
    queryFn: async () => {
      const response = await api.get<{ periods: AccountingPeriod[] }>(`/owner/accounting-periods?companyId=${companyId}`);
      return response.data.periods;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const lockPeriod = useMutation({
    mutationFn: async ({ periodId, reason }: { periodId: string; reason: string }) => {
      await api.post(`/owner/accounting-periods/${periodId}/lock`, { companyId, reason });
    },
    onSuccess: () => {
      toast.success("Accounting period locked.");
      queryClient.invalidateQueries({ queryKey: ["accounting-periods", companyId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to lock period.");
    },
  });

  const unlockPeriod = useMutation({
    mutationFn: async ({ periodId, reason }: { periodId: string; reason: string }) => {
      await api.post(`/owner/accounting-periods/${periodId}/unlock`, { companyId, reason });
    },
    onSuccess: () => {
      toast.success("Accounting period unlocked.");
      queryClient.invalidateQueries({ queryKey: ["accounting-periods", companyId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to unlock period.");
    },
  });

  return {
    periods,
    isLoading,
    error,
    lockPeriod,
    unlockPeriod,
  };
}
