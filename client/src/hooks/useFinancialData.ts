/**
 * Financial Data API Hooks
 * React Query hooks for fetching financial dashboard data
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient, handleApiError } from "@/services/api-client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProfitLossData {
  netProfit: number;
  revenue: number;
  expenses: number;
  profitMargin: number;
  trend: number; // percentage change
  period: string;
  previousPeriod: {
    netProfit: number;
    revenue: number;
    expenses: number;
  };
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  change: number; // percentage change
  lastUpdated: string;
  type: "checking" | "savings" | "credit";
}

export interface BankAccountsData {
  accounts: BankAccount[];
  totalBalance: number;
  totalChange: number;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
}

export interface InvoicesData {
  summary: {
    paid: number;
    pending: number;
    overdue: number;
    total: number;
    collectionRate: number; // percentage
  };
  recentInvoices: Invoice[];
  trend: number; // percentage change
}

export interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  change: number;
}

// ============================================================================
// API QUERY KEYS
// ============================================================================

export const financialQueryKeys = {
  all: ["financial"] as const,
  profitLoss: (period?: string) =>
    ["financial", "profit-loss", period] as const,
  bankAccounts: () => ["financial", "bank-accounts"] as const,
  invoices: (status?: string) => ["financial", "invoices", status] as const,
  cashFlow: (months?: number) => ["financial", "cash-flow", months] as const,
  expenses: (period?: string) => ["financial", "expenses", period] as const,
};

// ============================================================================
// API HOOKS
// ============================================================================

/**
 * Fetch Profit & Loss data
 */
export function useProfitLoss(
  period: string = "current-month",
): UseQueryResult<ProfitLossData> {
  return useQuery({
    queryKey: financialQueryKeys.profitLoss(period),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ProfitLossData>(
          "/reports/profit-loss",
          { period },
        );
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Fetch Bank Accounts data
 */
export function useBankAccounts(): UseQueryResult<BankAccountsData> {
  return useQuery({
    queryKey: financialQueryKeys.bankAccounts(),
    queryFn: async () => {
      try {
        const response =
          await apiClient.get<BankAccountsData>("/accounts/balances");
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Fetch Invoices summary
 */
export function useInvoices(status?: string): UseQueryResult<InvoicesData> {
  return useQuery({
    queryKey: financialQueryKeys.invoices(status),
    queryFn: async () => {
      try {
        const response = await apiClient.get<InvoicesData>(
          "/invoices/summary",
          { status },
        );
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
}

/**
 * Fetch Cash Flow data for charts
 */
export function useCashFlow(
  months: number = 6,
): UseQueryResult<CashFlowData[]> {
  return useQuery({
    queryKey: financialQueryKeys.cashFlow(months),
    queryFn: async () => {
      try {
        const response = await apiClient.get<CashFlowData[]>(
          "/reports/cash-flow",
          { months },
        );
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Fetch Top Expenses data
 */
export function useTopExpenses(
  period: string = "current-month",
): UseQueryResult<ExpenseCategory[]> {
  return useQuery({
    queryKey: financialQueryKeys.expenses(period),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ExpenseCategory[]>(
          "/reports/top-expenses",
          { period },
        );
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ============================================================================
// MOCK DATA FALLBACK (for development/testing)
// ============================================================================

export const mockProfitLossData: ProfitLossData = {
  netProfit: 45280,
  revenue: 128450,
  expenses: 83170,
  profitMargin: 35.2,
  trend: 12.5,
  period: "January 2026",
  previousPeriod: {
    netProfit: 40250,
    revenue: 114200,
    expenses: 73950,
  },
};

export const mockBankAccountsData: BankAccountsData = {
  accounts: [
    {
      id: "1",
      name: "Business Checking",
      balance: 125840,
      currency: "USD",
      change: 8.3,
      lastUpdated: new Date().toISOString(),
      type: "checking",
    },
    {
      id: "2",
      name: "Savings Account",
      balance: 78920,
      currency: "USD",
      change: 2.1,
      lastUpdated: new Date().toISOString(),
      type: "savings",
    },
    {
      id: "3",
      name: "Operating Account",
      balance: 42150,
      currency: "USD",
      change: -3.2,
      lastUpdated: new Date().toISOString(),
      type: "checking",
    },
  ],
  totalBalance: 246910,
  totalChange: 5.4,
};

export const mockInvoicesData: InvoicesData = {
  summary: {
    paid: 24,
    pending: 8,
    overdue: 3,
    total: 35,
    collectionRate: 85.7,
  },
  recentInvoices: [
    {
      id: "INV-001",
      number: "INV-2026-001",
      customer: "Acme Corp",
      amount: 12500,
      status: "paid",
      dueDate: "2026-01-15",
      issuedDate: "2026-01-01",
    },
    {
      id: "INV-002",
      number: "INV-2026-002",
      customer: "TechStart Inc",
      amount: 8750,
      status: "pending",
      dueDate: "2026-02-01",
      issuedDate: "2026-01-15",
    },
    {
      id: "INV-003",
      number: "INV-2026-003",
      customer: "Global Solutions",
      amount: 15200,
      status: "overdue",
      dueDate: "2026-01-20",
      issuedDate: "2026-01-05",
    },
  ],
  trend: 18.2,
};

export const mockCashFlowData: CashFlowData[] = [
  { period: "Aug", inflow: 95000, outflow: 72000, net: 23000 },
  { period: "Sep", inflow: 108000, outflow: 78000, net: 30000 },
  { period: "Oct", inflow: 112000, outflow: 82000, net: 30000 },
  { period: "Nov", inflow: 118000, outflow: 85000, net: 33000 },
  { period: "Dec", inflow: 125000, outflow: 88000, net: 37000 },
  { period: "Jan", inflow: 128000, outflow: 83000, net: 45000 },
];

export const mockTopExpensesData: ExpenseCategory[] = [
  { category: "Payroll", amount: 45000, percentage: 54.1, change: 2.3 },
  { category: "Rent & Utilities", amount: 12000, percentage: 14.4, change: 0 },
  { category: "Marketing", amount: 8500, percentage: 10.2, change: 15.8 },
  { category: "Software & Tools", amount: 6200, percentage: 7.5, change: -5.2 },
  { category: "Office Supplies", amount: 4800, percentage: 5.8, change: 8.1 },
  { category: "Other", amount: 6670, percentage: 8.0, change: 3.5 },
];
