declare global {
  interface Window {
    [key: string]: any;
  }
}

import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  demoAccountsApi,
  demoLedgerApi,
  getDemoCompanyId,
  isDemoModeEnabled,
} from "../lib/demo";

// API base URL from environment
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api");

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accubooks_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("accubooks_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          localStorage.setItem("accubooks_token", accessToken);

          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem("accubooks_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<any>("/auth/login", {
      email,
      password,
    }),

  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<ApiResponse<{ user: any }>>("/auth/register", userData),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>("/auth/refresh", {
      refreshToken,
    }),

  logout: () => api.post<ApiResponse>("/auth/logout"),

  getProfile: () => api.get<ApiResponse<{ user: any }>>("/auth/profile"),
};

export const ownerApi = {
  getOverview: () => api.get<any>("/owner/overview"),
  getPlans: () => api.get<any>("/owner/plans"),
  createPlan: (payload: any) => api.post<any>("/owner/plans", payload),
  updatePlan: (id: string, payload: any) => api.patch<any>(`/owner/plans/${id}`, payload),
  deletePlan: (id: string) => api.delete<any>(`/owner/plans/${id}`),

  getSubscriptions: (params?: { status?: string }) =>
    api.get<any>("/owner/subscriptions", { params }),
  updateSubscription: (id: string, payload: any) =>
    api.patch<any>(`/owner/subscriptions/${id}`, payload),
};

// Accounts API
export const accountsApi = {
  list: (companyId: string, limit?: number) =>
    isDemoModeEnabled()
      ? Promise.resolve({
          data: {
            success: true,
            data: demoAccountsApi().list(companyId || getDemoCompanyId()),
          },
        } as any)
      : api.get<ApiResponse<any[]>>("/accounts", {
          params: { companyId, limit: limit || 50 },
        }),

  create: (accountData: {
    companyId: string;
    code: string;
    name: string;
    type: string;
    parentId?: string;
    balance?: string;
    description?: string;
    isActive?: boolean;
  }) =>
    isDemoModeEnabled()
      ? Promise.resolve({
          data: {
            success: true,
            data: demoAccountsApi().create({
              ...accountData,
              companyId: accountData.companyId || getDemoCompanyId(),
              createdAt: "",
              updatedAt: "",
            } as any),
          },
        } as any)
      : api.post<ApiResponse<any>>("/accounts", accountData),

  update: (
    id: string,
    updateData: Partial<{
      code: string;
      name: string;
      type: string;
      parentId?: string;
      balance?: string;
      description?: string;
      isActive?: boolean;
    }>,
  ) =>
    isDemoModeEnabled()
      ? Promise.resolve({
          data: {
            success: true,
            data: demoAccountsApi().update(id, updateData as any),
          },
        } as any)
      : api.put<ApiResponse<any>>(`/accounts/${id}`, updateData),

  adjustBalance: (id: string, amount: number) =>
    isDemoModeEnabled()
      ? Promise.resolve({
          data: {
            success: true,
            data: demoAccountsApi().adjustBalance(id, amount),
          },
        } as any)
      : api.post<ApiResponse<any>>(`/accounts/${id}/adjust-balance`, {
          amount,
        }),
};

// Transactions API
export const transactionsApi = {
  list: (companyId: string, limit?: number) =>
    isDemoModeEnabled()
      ? Promise.resolve({
          data: {
            success: true,
            data: demoLedgerApi().list(companyId || getDemoCompanyId()),
          },
        } as any)
      : api.get<ApiResponse<any[]>>("/transactions", {
          params: { companyId, limit: limit || 50 },
        }),

  create: (transactionData: {
    companyId: string;
    transactionNumber: string;
    date: string;
    type: "journal_entry" | "invoice" | "payment" | "bank";
    totalAmount: string;
    lines: {
      accountId: string;
      debit: string;
      credit: string;
      description?: string;
    }[];
    description?: string;
    referenceNumber?: string;
  }) =>
    isDemoModeEnabled()
      ? Promise.resolve({
          data: {
            success: true,
            data: demoLedgerApi().create({
              ...transactionData,
              companyId: transactionData.companyId || getDemoCompanyId(),
              createdBy: "demo-user",
              createdAt: "",
              updatedAt: "",
              lines: transactionData.lines.map((l) => ({
                ...l,
                id: "",
                transactionId: "",
              })),
            } as any),
          },
        } as any)
      : api.post<ApiResponse<any>>("/transactions", transactionData),
};

export default api;
