import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  billingApi,
  type BillingStatus,
  type BillingLimits,
} from "../api/billing.api";

interface BillingContextState {
  status: BillingStatus | null;
  limits: BillingLimits | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchBillingStatus: (companyId: string) => Promise<void>;
  fetchBillingLimits: (companyId: string) => Promise<void>;
  refresh: (companyId: string) => Promise<void>;
  clear: () => void;

  // Helpers
  canWrite: () => boolean;
  isOverLimit: (
    resourceType: "invoices" | "users" | "companies" | "aiTokens",
  ) => boolean;
  getUsagePercentage: (
    resourceType: "invoices" | "users" | "companies" | "aiTokens",
  ) => number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Global billing context store
 * Manages billing status, plan limits, and usage enforcement
 */
export const useBillingContext = create<BillingContextState>()(
  persist(
    (set, get) => ({
      status: null,
      limits: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchBillingStatus: async (companyId: string) => {
        const state = get();

        // Use cache if fresh
        if (
          state.status &&
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_DURATION
        ) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await billingApi.getStatus(companyId);
          set({
            status: response.data.data,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch billing status";
          set({
            error: errorMessage,
            isLoading: false,
          });
          console.error("Failed to fetch billing status:", err);
        }
      },

      fetchBillingLimits: async (companyId: string) => {
        const state = get();

        // Use cache if fresh
        if (
          state.limits &&
          state.lastFetched &&
          Date.now() - state.lastFetched < CACHE_DURATION
        ) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await billingApi.getLimits(companyId);
          set({
            limits: response.data.data,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch billing limits";
          set({
            error: errorMessage,
            isLoading: false,
          });
          console.error("Failed to fetch billing limits:", err);
        }
      },

      refresh: async (companyId: string) => {
        set({ lastFetched: null }); // Invalidate cache
        await Promise.all([
          get().fetchBillingStatus(companyId),
          get().fetchBillingLimits(companyId),
        ]);
      },

      clear: () => {
        set({
          status: null,
          limits: null,
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },

      canWrite: () => {
        const { status } = get();
        if (!status) return true; // Allow if not loaded yet (fail open for UX)

        // Block writes if suspended or read-only
        if (status.status === "suspended" || status.readOnly) {
          return false;
        }

        return true;
      },

      isOverLimit: (
        resourceType: "invoices" | "users" | "companies" | "aiTokens",
      ) => {
        const { limits } = get();
        if (!limits) return false;

        switch (resourceType) {
          case "invoices":
            return (
              limits.usage.invoicesThisMonth >= limits.limits.invoicesPerMonth
            );
          case "users":
            return limits.usage.users >= limits.limits.users;
          case "companies":
            return limits.usage.companies >= limits.limits.companies;
          case "aiTokens":
            return (
              limits.usage.aiTokensThisMonth >= limits.limits.aiTokensPerMonth
            );
          default:
            return false;
        }
      },

      getUsagePercentage: (
        resourceType: "invoices" | "users" | "companies" | "aiTokens",
      ) => {
        const { limits } = get();
        if (!limits) return 0;

        let usage = 0;
        let limit = 1;

        switch (resourceType) {
          case "invoices":
            usage = limits.usage.invoicesThisMonth;
            limit = limits.limits.invoicesPerMonth;
            break;
          case "users":
            usage = limits.usage.users;
            limit = limits.limits.users;
            break;
          case "companies":
            usage = limits.usage.companies;
            limit = limits.limits.companies;
            break;
          case "aiTokens":
            usage = limits.usage.aiTokensThisMonth;
            limit = limits.limits.aiTokensPerMonth;
            break;
        }

        if (limit === 0) return 0;
        return Math.min(100, (usage / limit) * 100);
      },
    }),
    {
      name: "accubooks-billing-context",
      partialize: (state) => ({
        status: state.status,
        limits: state.limits,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);

/**
 * Helper to check if write operations are allowed
 */
export function canPerformWrite(): boolean {
  return useBillingContext.getState().canWrite();
}

/**
 * Helper to check if resource limit is exceeded
 */
export function isResourceOverLimit(
  resourceType: "invoices" | "users" | "companies" | "aiTokens",
): boolean {
  return useBillingContext.getState().isOverLimit(resourceType);
}
