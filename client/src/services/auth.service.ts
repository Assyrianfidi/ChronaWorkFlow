import { apiClient } from "./api-client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
      currentCompanyId?: string;
    };
    company?: any;
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  currentCompanyId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    if (response.data.success && response.data.data) {
      this.setTokens(
        response.data.data.accessToken,
        response.data.data.refreshToken,
      );
    }

    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);

    if (response.data.success && response.data.data) {
      this.setTokens(
        response.data.data.accessToken,
        response.data.data.refreshToken,
      );
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {
        refreshToken: this.refreshToken,
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) {
        return null;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: { accessToken: string };
      }>("/auth/refresh", { refreshToken: this.refreshToken });

      if (response.data.success && response.data.data) {
        this.setAccessToken(response.data.data.accessToken);
        return response.data.data.accessToken;
      }

      return null;
    } catch (error) {
      console.error("Token refresh error:", error);
      this.clearTokens();
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: User }>(
        "/auth/me",
      );
      return response.data.data;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>("/auth/forgot-password", { email });
    return response.data;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>("/auth/reset-password", { token, newPassword });
    return response.data;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
    localStorage.setItem("accessToken", accessToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const authService = new AuthService();
export default authService;
