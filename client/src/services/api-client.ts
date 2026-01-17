import { toast } from "sonner";

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

interface ApiErrorData {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = "import.meta.env.VITE_API_URL/api") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || "Request failed",
          response.status,
          data.code,
          data,
        );
      }

      return {
        data: data.data || data,
        message: data.message,
        status: response.status,
        success: true,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors or other issues
      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0,
        "NETWORK_ERROR",
      );
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(endpoint + url.search, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // File upload
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse, ApiError };
export { ApiClient };

// Utility functions
export const handleApiError = (error: unknown): void => {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      toast.error("Network error. Please check your connection.");
    } else if (error.status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (error.status === 401) {
      toast.error("Unauthorized. Please log in again.");
    } else if (error.status === 403) {
      toast.error("Access denied. You don't have permission for this action.");
    } else if (error.status === 404) {
      toast.error("Resource not found.");
    } else {
      toast.error(error.message || "An error occurred.");
    }
  } else {
    toast.error("An unexpected error occurred.");
  }
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};
