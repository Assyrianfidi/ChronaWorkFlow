import api from "@/api";

export interface DashboardKPI {
  totalRevenue: number;
  accountsReceivable: number;
  netProfit: number;
  activeCustomers: number;
  revenueChange: number;
  receivablesChange: number;
  profitChange: number;
}

export interface DashboardMetrics {
  totalInvoices: number;
  totalTransactions: number;
  totalUsers: number;
  openInvoices: number;
  overdueInvoices: number;
  cashBalance: number;
}

export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export class DashboardKpiService {
  async getKPIs(
    companyId: string,
    period: "7-day" | "30-day" | "quarter" = "30-day",
  ): Promise<DashboardKPI> {
    const response = await api.get<DashboardKPI>(
      `/dashboard/kpis?companyId=${companyId}&period=${period}`,
    );
    return response.data;
  }

  async getMetrics(companyId: string): Promise<DashboardMetrics> {
    const response = await api.get<DashboardMetrics>(
      `/dashboard/metrics?companyId=${companyId}`,
    );
    return response.data;
  }

  async getCashFlow(
    companyId: string,
    period: "6-months" | "12-months" | "24-months" = "6-months",
  ): Promise<CashFlowData[]> {
    const response = await api.get<CashFlowData[]>(
      `/dashboard/cash-flow?companyId=${companyId}&period=${period}`,
    );
    return response.data;
  }

  async getRecentTransactions(companyId: string, limit = 10) {
    const response = await api.get(
      `/transactions?companyId=${companyId}&limit=${limit}`,
    );
    return response.data;
  }

  async getOpenInvoices(companyId: string, limit = 10) {
    const response = await api.get(
      `/invoices?companyId=${companyId}&status=open&limit=${limit}`,
    );
    return response.data;
  }
}

export const dashboardKpiService = new DashboardKpiService();
