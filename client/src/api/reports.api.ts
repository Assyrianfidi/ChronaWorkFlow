import api from "./index";
import type { ApiResponse } from "./index";

export interface ProfitLossReport {
  companyId: string;
  startDate: string;
  endDate: string;
  revenue: {
    total: number;
    accounts: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    accounts: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
  };
  netIncome: number;
  integrityHash?: string;
  generatedAt: string;
}

export interface BalanceSheetReport {
  companyId: string;
  asOfDate: string;
  assets: {
    total: number;
    current: number;
    nonCurrent: number;
    accounts: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
  };
  liabilities: {
    total: number;
    current: number;
    nonCurrent: number;
    accounts: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
  };
  equity: {
    total: number;
    accounts: Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      amount: number;
    }>;
  };
  integrityHash?: string;
  generatedAt: string;
}

export interface CashFlowReport {
  companyId: string;
  startDate: string;
  endDate: string;
  operating: {
    total: number;
    items: Array<{
      description: string;
      amount: number;
    }>;
  };
  investing: {
    total: number;
    items: Array<{
      description: string;
      amount: number;
    }>;
  };
  financing: {
    total: number;
    items: Array<{
      description: string;
      amount: number;
    }>;
  };
  netCashFlow: number;
  integrityHash?: string;
  generatedAt: string;
}

export interface ReportParams {
  companyId: string;
  startDate?: string;
  endDate?: string;
  asOfDate?: string;
}

export const reportsApi = {
  /**
   * Get Profit & Loss report (ledger-derived)
   */
  getProfitLoss: (params: ReportParams) =>
    api.get<ApiResponse<ProfitLossReport>>("/reports/profit-loss", { params }),

  /**
   * Get Balance Sheet report (ledger-derived)
   */
  getBalanceSheet: (params: ReportParams) =>
    api.get<ApiResponse<BalanceSheetReport>>("/reports/balance-sheet", {
      params,
    }),

  /**
   * Get Cash Flow report (ledger-derived)
   */
  getCashFlow: (params: ReportParams) =>
    api.get<ApiResponse<CashFlowReport>>("/reports/cash-flow", { params }),

  /**
   * Export report to PDF
   */
  exportPDF: (
    reportType: "profit-loss" | "balance-sheet" | "cash-flow",
    params: ReportParams,
  ) =>
    api.get<Blob>(`/reports/${reportType}/pdf`, {
      params,
      responseType: "blob",
    }),

  /**
   * Export report to Excel
   */
  exportExcel: (
    reportType: "profit-loss" | "balance-sheet" | "cash-flow",
    params: ReportParams,
  ) =>
    api.get<Blob>(`/reports/${reportType}/excel`, {
      params,
      responseType: "blob",
    }),
};
