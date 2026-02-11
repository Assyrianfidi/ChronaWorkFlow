import { apiClient } from "./api-client";

export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    transactions: number;
  };
}

export interface CreateCompanyInput {
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface CompanyListResponse {
  success: boolean;
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CompanyResponse {
  success: boolean;
  data: Company;
  message?: string;
}

export interface CompanyStatsResponse {
  success: boolean;
  data: {
    total: number;
    byIndustry: Array<{ industry: string; count: number }>;
  };
}

export const companiesService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }) {
    return apiClient.get<CompanyListResponse>("/companies", params);
  },

  async getById(id: string) {
    return apiClient.get<CompanyResponse>(`/companies/${id}`);
  },

  async create(data: CreateCompanyInput) {
    return apiClient.post<CompanyResponse>("/companies", data);
  },

  async update(id: string, data: UpdateCompanyInput) {
    return apiClient.put<CompanyResponse>(`/companies/${id}`, data);
  },

  async delete(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/companies/${id}`,
    );
  },

  async getStats() {
    return apiClient.get<CompanyStatsResponse>("/companies/stats/overview");
  },
};
