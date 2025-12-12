import { apiClient, handleApiError } from './api-client.js';
import { toast } from "sonner";

// Dashboard Types
export interface DashboardKPI {
  totalRevenue: number;
  accountsReceivable: number;
  netProfit: number;
  activeCustomers: number;
  revenueChange: number;
  receivablesChange: number;
  profitChange: number;
  customersChange: number;
}

export interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  createdAt: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

// Dashboard API Service
export class DashboardService {
  // Health Check
  async getHealth() {
    try {
      const response = await apiClient.get("/health");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // KPI Data
  async getKPIs(
    period: "7-day" | "30-day" | "quarter" = "30-day",
  ): Promise<DashboardKPI> {
    try {
      const response = await apiClient.get<DashboardKPI>("/dashboard/kpis", {
        period,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Invoices
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<{
        invoices: Invoice[];
        total: number;
        page: number;
        totalPages: number;
      }>("/invoices", params);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async getInvoice(id: string): Promise<Invoice> {
    try {
      const response = await apiClient.get<Invoice>(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async createInvoice(
    invoice: Omit<Invoice, "id" | "createdAt">,
  ): Promise<Invoice> {
    try {
      const response = await apiClient.post<Invoice>("/invoices", invoice);
      toast.success("Invoice created successfully");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await apiClient.put<Invoice>(`/invoices/${id}`, invoice);
      toast.success("Invoice updated successfully");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await apiClient.delete(`/invoices/${id}`);
      toast.success("Invoice deleted successfully");
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Transactions
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    search?: string;
  }): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<{
        transactions: Transaction[];
        total: number;
        page: number;
        totalPages: number;
      }>("/transactions", params);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async createTransaction(
    transaction: Omit<Transaction, "id">,
  ): Promise<Transaction> {
    try {
      const response = await apiClient.post<Transaction>(
        "/transactions",
        transaction,
      );
      toast.success("Transaction created successfully");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Customers
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<{
        customers: Customer[];
        total: number;
        page: number;
        totalPages: number;
      }>("/customers", params);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async createCustomer(
    customer: Omit<Customer, "id" | "createdAt">,
  ): Promise<Customer> {
    try {
      const response = await apiClient.post<Customer>("/customers", customer);
      toast.success("Customer created successfully");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async updateCustomer(
    id: string,
    customer: Partial<Customer>,
  ): Promise<Customer> {
    try {
      const response = await apiClient.put<Customer>(
        `/customers/${id}`,
        customer,
      );
      toast.success("Customer updated successfully");
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Analytics
  async getExpenseBreakdown(
    period: "month" | "quarter" | "year" = "month",
  ): Promise<ExpenseCategory[]> {
    try {
      const response = await apiClient.get<ExpenseCategory[]>(
        "/analytics/expenses",
        { period },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async getCashFlow(
    period: "6-months" | "12-months" | "24-months" = "6-months",
  ): Promise<CashFlowData[]> {
    try {
      const response = await apiClient.get<CashFlowData[]>(
        "/analytics/cash-flow",
        { period },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Reports
  async generateReport(
    type: string,
    params?: Record<string, any>,
  ): Promise<Blob> {
    try {
      const response = await apiClient.get(`/reports/${type}`, {
        ...params,
        format: "pdf",
      });
      // Convert response to blob for download
// @ts-ignore
      return new Blob([response.data as BlobPart], { type: "application/pdf" });
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}

// Create singleton instance
export const dashboardService = new DashboardService();
