import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
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
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/login', {
      email,
      password,
    }),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) =>
    api.post<ApiResponse<{ user: any }>>('/auth/register', userData),
  
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken,
    }),
  
  logout: () =>
    api.post<ApiResponse>('/auth/logout'),
  
  getProfile: () =>
    api.get<ApiResponse<{ user: any }>>('/auth/profile'),
};

// Accounts API
export const accountsApi = {
  list: (companyId: string, limit?: number) =>
    api.get<ApiResponse<any[]>>('/accounts', {
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
    api.post<ApiResponse<any>>('/accounts', accountData),
  
  update: (id: string, updateData: Partial<{
    code: string;
    name: string;
    type: string;
    parentId?: string;
    balance?: string;
    description?: string;
    isActive?: boolean;
  }>) =>
    api.put<ApiResponse<any>>(`/accounts/${id}`, updateData),
  
  adjustBalance: (id: string, amount: number) =>
    api.post<ApiResponse<any>>(`/accounts/${id}/adjust-balance`, { amount }),
};

// Transactions API
export const transactionsApi = {
  list: (companyId: string, limit?: number) =>
    api.get<ApiResponse<any[]>>('/transactions', {
      params: { companyId, limit: limit || 50 },
    }),
  
  create: (transactionData: {
    companyId: string;
    transactionNumber: string;
    date: string;
    type: 'journal_entry' | 'invoice' | 'payment' | 'bank';
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
    api.post<ApiResponse<any>>('/transactions', transactionData),
};

export default api;
