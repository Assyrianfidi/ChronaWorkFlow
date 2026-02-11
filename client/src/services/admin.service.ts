import { apiClient } from "./api-client";

export interface GlobalStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    growth: any[];
  };
  companies: {
    total: number;
    active: number;
    inactive: number;
    growth: any[];
  };
  transactions: {
    total: number;
  };
  invoices: {
    total: number;
  };
  subscriptions: any[];
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnedLast30Days: number;
  churnRate: number;
  revenueByPlan: {
    [key: string]: {
      count: number;
      revenue: number;
    };
  };
}

export interface SystemHealth {
  database: string;
  server: {
    uptime: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  };
  metrics: {
    recentErrors: number;
    suspiciousActivities: number;
    activeSessions: number;
    apiCallsToday: number;
  };
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: number;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface FeatureUsage {
  topFeatures: Array<{
    feature: string;
    totalUses: number;
    uniqueUsers: number;
  }>;
  topCompanies: Array<{
    companyId: string;
    totalUsage: number;
  }>;
}

class AdminService {
  async getGlobalStats(): Promise<GlobalStats> {
    const response = await apiClient.get<GlobalStats>("/admin/global-stats");
    return response.data;
  }

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const response = await apiClient.get<RevenueMetrics>(
      "/admin/revenue-metrics",
    );
    return response.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>("/admin/system-health");
    return response.data;
  }

  async getAuditTrail(params?: {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: AuditLog[]; pagination: any }> {
    const response = await apiClient.get<{ data: AuditLog[]; pagination: any }>(
      "/admin/audit-trail",
      params,
    );
    return response.data;
  }

  async getFeatureUsage(): Promise<FeatureUsage> {
    const response = await apiClient.get<FeatureUsage>("/admin/feature-usage");
    return response.data;
  }

  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: any[]; pagination: any }> {
    const response = await apiClient.get<{ data: any[]; pagination: any }>(
      "/admin/companies",
      params,
    );
    return response.data;
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{ data: any[]; pagination: any }> {
    const response = await apiClient.get<{ data: any[]; pagination: any }>(
      "/admin/users",
      params,
    );
    return response.data;
  }

  async impersonateUser(userId: number): Promise<any> {
    const response = await apiClient.post<any>("/admin/impersonate", {
      userId,
    });
    return response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
