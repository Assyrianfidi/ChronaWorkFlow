import { apiClient } from "./api-client";

export interface User {
  id: number;
  name: string;
  email: string;
  role:
    | "USER"
    | "ADMIN"
    | "MANAGER"
    | "AUDITOR"
    | "INVENTORY_MANAGER"
    | "OWNER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role?: User["role"];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: User["role"];
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ role: string; count: number }>;
  };
}

export const usersService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    order?: "asc" | "desc";
  }) {
    return apiClient.get<UserListResponse>("/users", params);
  },

  async getById(id: number) {
    return apiClient.get<UserResponse>(`/users/${id}`);
  },

  async create(data: CreateUserInput) {
    return apiClient.post<UserResponse>("/users", data);
  },

  async update(id: number, data: UpdateUserInput) {
    return apiClient.put<UserResponse>(`/users/${id}`, data);
  },

  async delete(id: number) {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/users/${id}`,
    );
  },

  async getStats() {
    return apiClient.get<UserStatsResponse>("/users/stats/overview");
  },
};
