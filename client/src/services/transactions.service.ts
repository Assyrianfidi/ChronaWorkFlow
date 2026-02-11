import { apiClient } from "./api-client";

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  referenceNumber?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface CreateTransactionInput {
  amount: number;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
  referenceNumber?: string;
  companyId: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  description?: string;
  date?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
  referenceNumber?: string;
}

export interface TransactionListResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TransactionResponse {
  success: boolean;
  data: Transaction;
  message?: string;
}

export interface TransactionStatsResponse {
  success: boolean;
  data: {
    total: number;
    totalAmount: number;
    byType: Array<{ type: string; count: number; amount: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
}

export const transactionsService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    companyId?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }) {
    return apiClient.get<TransactionListResponse>("/transactions", params);
  },

  async getById(id: string) {
    return apiClient.get<TransactionResponse>(`/transactions/${id}`);
  },

  async create(data: CreateTransactionInput) {
    return apiClient.post<TransactionResponse>("/transactions", data);
  },

  async update(id: string, data: UpdateTransactionInput) {
    return apiClient.put<TransactionResponse>(`/transactions/${id}`, data);
  },

  async delete(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/transactions/${id}`,
    );
  },

  async getStats(params?: { startDate?: string; endDate?: string }) {
    return apiClient.get<TransactionStatsResponse>(
      "/transactions/stats/overview",
      params,
    );
  },
};
