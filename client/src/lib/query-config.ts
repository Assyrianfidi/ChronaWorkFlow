import React from "react";
import { QueryClient } from "@tanstack/react-query";

// Production-optimized React Query configuration
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: parseInt(process.env.REACT_QUERY_STALE_TIME || "300000"), // 5 minutes

        // Cache time - how long unused data stays in cache
        gcTime: parseInt(process.env.REACT_QUERY_CACHE_TIME || "900000"), // 15 minutes

        // Retry configuration for failed requests
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }

          // Retry up to 3 times for network/server errors
          return failureCount < 3;
        },

        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (disabled in production for better UX)
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Refetch on mount if data is stale
        refetchOnMount: true,

        // Network mode - online by default
        networkMode: "online",
      },
      mutations: {
        // Retry mutations on network errors
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }

          return failureCount < 2;
        },

        // Retry delay for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // Network mode for mutations
        networkMode: "online",
      },
    },
  });
};

// Query key factories for consistent cache management
export const queryKeys = {
  // Companies
  companies: ["companies"] as const,
  company: (id: string) => ["companies", id] as const,

  // Accounts
  accounts: (companyId?: string) => ["accounts", companyId] as const,
  account: (id: string) => ["accounts", "detail", id] as const,

  // Customers
  customers: (companyId?: string) => ["customers", companyId] as const,
  customer: (id: string) => ["customers", "detail", id] as const,

  // Vendors
  vendors: (companyId?: string) => ["vendors", companyId] as const,
  vendor: (id: string) => ["vendors", "detail", id] as const,

  // Transactions
  transactions: (companyId?: string, limit?: number) =>
    ["transactions", companyId, limit] as const,
  transaction: (id: string) => ["transactions", "detail", id] as const,

  // Invoices
  invoices: (companyId?: string) => ["invoices", companyId] as const,
  invoice: (id: string) => ["invoices", "detail", id] as const,

  // Payroll
  employees: (companyId?: string) =>
    ["payroll", "employees", companyId] as const,
  employee: (id: string) => ["payroll", "employees", "detail", id] as const,
  payrollPeriods: (companyId?: string) =>
    ["payroll", "periods", companyId] as const,
  payRuns: (companyId?: string) => ["payroll", "pay-runs", companyId] as const,

  // Inventory
  inventoryItems: (companyId?: string) =>
    ["inventory", "items", companyId] as const,
  purchaseOrders: (companyId?: string) =>
    ["inventory", "purchase-orders", companyId] as const,

  // Reports
  balanceSheet: (companyId?: string) =>
    ["reports", "balance-sheet", companyId] as const,
  profitLoss: (companyId?: string, startDate?: string, endDate?: string) =>
    ["reports", "profit-loss", companyId, startDate, endDate] as const,
  cashFlow: (companyId?: string) =>
    ["reports", "cash-flow", companyId] as const,

  // Jobs
  jobQueues: () => ["jobs", "queues"] as const,
  jobQueue: (queueName: string) => ["jobs", "queues", queueName] as const,
};

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate all company-related data
  invalidateCompany: (queryClient: QueryClient, companyId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.customers(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.vendors(companyId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.transactions(companyId),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees(companyId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.inventoryItems(companyId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.balanceSheet(companyId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.profitLoss(companyId),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow(companyId) });
  },

  // Invalidate user-specific data
  invalidateUser: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: ["users", userId] });
  },

  // Invalidate all reports
  invalidateReports: (queryClient: QueryClient, companyId?: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.balanceSheet(companyId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.profitLoss(companyId),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.cashFlow(companyId) });
  },
};

// React Query DevTools configuration for development
export const queryClientConfig = {
  // Enable devtools in development
  devtools:
    process.env.NODE_ENV === import.meta.env.MODE
      ? {
          initialIsOpen: false,
        }
      : false,
};
