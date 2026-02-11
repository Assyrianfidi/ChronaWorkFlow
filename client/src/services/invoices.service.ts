import { apiClient } from "./api-client";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  customerId?: string;
  customerName: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  invoiceLines?: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status?: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  customerId?: string;
  customerName: string;
  companyId: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
  status?: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  customerName?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InvoiceResponse {
  success: boolean;
  data: Invoice;
  message?: string;
}

export interface InvoiceStatsResponse {
  success: boolean;
  data: {
    total: number;
    totalAmount: number;
    overdue: number;
    byStatus: Array<{ status: string; count: number; amount: number }>;
  };
}

export const invoicesService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    companyId?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }) {
    return apiClient.get<InvoiceListResponse>("/invoices", params);
  },

  async getById(id: string) {
    return apiClient.get<InvoiceResponse>(`/invoices/${id}`);
  },

  async create(data: CreateInvoiceInput) {
    return apiClient.post<InvoiceResponse>("/invoices", data);
  },

  async update(id: string, data: UpdateInvoiceInput) {
    return apiClient.put<InvoiceResponse>(`/invoices/${id}`, data);
  },

  async updateStatus(id: string, status: Invoice["status"]) {
    return apiClient.patch<InvoiceResponse>(`/invoices/${id}/status`, {
      status,
    });
  },

  async delete(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/invoices/${id}`,
    );
  },

  async getStats(params?: { startDate?: string; endDate?: string }) {
    return apiClient.get<InvoiceStatsResponse>(
      "/invoices/stats/overview",
      params,
    );
  },
};
