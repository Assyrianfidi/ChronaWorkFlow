import useSWR, { SWRConfiguration } from "swr";
import {
  dashboardService,
  type DashboardKPI,
  type Invoice,
  type Transaction,
  type Customer,
  type ExpenseCategory,
  type CashFlowData,
} from '../services/dashboard.service.js';

// Generic fetcher for SWR
const fetcher = async (key: string) => {
  const [service, method, ...params] = key.split(":");
  const serviceInstance = dashboardService;

  if (!serviceInstance[method as keyof typeof dashboardService]) {
    throw new Error(`Method ${method} not found on service`);
  }

   - Dynamic method call
  return await serviceInstance[method as keyof typeof dashboardService](
    ...params,
  );
};

// Configuration for SWR
const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 30000, // 30 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 10000,
};

// Dashboard KPIs Hook
export function useDashboardKPIs(
  period: "7-day" | "30-day" | "quarter" = "30-day",
) {
  const { data, error, isLoading, mutate } = useSWR<DashboardKPI>(
    `dashboard:getKPIs:${period}`,
    () => dashboardService.getKPIs(period),
    {
      ...swrConfig,
      refreshInterval: 5000, // Refresh KPIs every 5 seconds
    },
  );

  return {
    kpis: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Invoices Hooks
export function useInvoices(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const paramString = params ? JSON.stringify(params) : "";
  const { data, error, isLoading, mutate } = useSWR(
    `dashboard:getInvoices:${paramString}`,
    () => dashboardService.getInvoices(params),
    swrConfig,
  );

  return {
    invoices: data?.invoices || [],
    pagination: data
      ? {
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
        }
      : { total: 0, page: 1, totalPages: 0 },
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useInvoice(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Invoice>(
    id ? `dashboard:getInvoice:${id}` : null,
    () => dashboardService.getInvoice(id),
    swrConfig,
  );

  return {
    invoice: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Transactions Hooks
export function useTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  search?: string;
}) {
  const paramString = params ? JSON.stringify(params) : "";
  const { data, error, isLoading, mutate } = useSWR(
    `dashboard:getTransactions:${paramString}`,
    () => dashboardService.getTransactions(params),
    swrConfig,
  );

  return {
    transactions: data?.transactions || [],
    pagination: data
      ? {
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
        }
      : { total: 0, page: 1, totalPages: 0 },
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Customers Hooks
export function useCustomers(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const paramString = params ? JSON.stringify(params) : "";
  const { data, error, isLoading, mutate } = useSWR(
    `dashboard:getCustomers:${paramString}`,
    () => dashboardService.getCustomers(params),
    swrConfig,
  );

  return {
    customers: data?.customers || [],
    pagination: data
      ? {
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
        }
      : { total: 0, page: 1, totalPages: 0 },
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Analytics Hooks
export function useExpenseBreakdown(
  period: "month" | "quarter" | "year" = "month",
) {
  const { data, error, isLoading, mutate } = useSWR<ExpenseCategory[]>(
    `dashboard:getExpenseBreakdown:${period}`,
    () => dashboardService.getExpenseBreakdown(period),
    {
      ...swrConfig,
      refreshInterval: 60000, // Refresh analytics every minute
    },
  );

  return {
    expenses: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useCashFlow(
  period: "6-months" | "12-months" | "24-months" = "6-months",
) {
  const { data, error, isLoading, mutate } = useSWR<CashFlowData[]>(
    `dashboard:getCashFlow:${period}`,
    () => dashboardService.getCashFlow(period),
    {
      ...swrConfig,
      refreshInterval: 60000, // Refresh analytics every minute
    },
  );

  return {
    cashFlow: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Health Check Hook
export function useHealthCheck() {
  const { data, error, isLoading, mutate } = useSWR(
    "dashboard:getHealth",
    () => dashboardService.getHealth(),
    {
      ...swrConfig,
      refreshInterval: 10000, // Check health every 10 seconds
      revalidateOnMount: true,
    },
  );

  return {
    health: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
    isHealthy: !error && data,
  };
}

// Utility hook for real-time updates
export function useRealTimeData<T>(
  key: string,
  fetcher: () => Promise<T>,
  interval: number = 5000,
) {
  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher, {
    ...swrConfig,
    refreshInterval: interval,
    dedupingInterval: interval / 2,
  });

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook for optimistic updates
export function useOptimisticMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  swrKey: string,
) {
  const { mutate } = useSWR(swrKey);

  const execute = async (params: P) => {
    try {
      // Optimistically update
      mutate(async () => await mutationFn(params), {
        optimisticData: (current: T) => current,
        rollbackOnError: true,
        populateCache: true,
      });
    } catch (error) {
      console.error("Mutation failed:", error);
      throw error;
    }
  };

  return { execute };
}
