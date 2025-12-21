// Secure API client with comprehensive security measures
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { securityConfig, apiConfig } from "@/config/env";
import { sanitizeInput, generateCSRFToken } from "@/security/utils";

// Secure request interceptor
const secureRequestInterceptor = (config: InternalAxiosRequestConfig) => {
  // Sanitize input data
  if (config.data && typeof config.data === "object") {
    config.data = sanitizeRequestData(config.data);
  }

  // Add CSRF token for state-changing requests
  if (
    config.method &&
    ["post", "put", "delete", "patch"].includes(config.method.toLowerCase())
  ) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      const headers: any = config.headers ?? {};
      headers["X-CSRF-Token"] = csrfToken;
      config.headers = headers;
    }
  }

  // Add security headers
  {
    const headers: any = config.headers ?? {};
    headers["X-Requested-With"] = "XMLHttpRequest";
    headers["Cache-Control"] = "no-cache";
    headers.Pragma = "no-cache";
    config.headers = headers;
  }

  return config;
};

// Secure response interceptor
const secureResponseInterceptor = (response: AxiosResponse) => {
  // Validate response data
  if (response.data) {
    response.data = sanitizeResponseData(response.data);
  }

  return response;
};

// Error interceptor with security handling
const errorInterceptor = (error: any) => {
  // Log security-relevant errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    console.warn("Security error detected:", error.response?.status);
  }

  // Handle CSRF errors
  if (
    error.response?.status === 403 &&
    error.response?.data?.error === "Invalid CSRF token"
  ) {
    // Refresh CSRF token and retry request
    refreshCSRFToken();
    return Promise.reject(error);
  }

  return Promise.reject(error);
};

// Sanitize request data
const sanitizeRequestData = (data: any): any => {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Sanitize response data
const sanitizeResponseData = (data: any): any => {
  // Remove sensitive fields from response
  const sensitiveFields = ["password", "ssn", "creditCard", "secret", "token"];

  if (typeof data !== "object" || data === null) {
    return data;
  }

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeResponseData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// CSRF token management
const getCSRFToken = (): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrf-token="))
      ?.split("=")[1] || null
  );
};

const refreshCSRFToken = (): void => {
  const newToken = generateCSRFToken();
  document.cookie = `csrf-token=${newToken}; path=/; secure; samesite=strict`;
};

// Create secure API instance
const createSecureApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${apiConfig.baseUrl}/${apiConfig.version}`,
    timeout: apiConfig.timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  // Add interceptors
  client.interceptors.request.use(secureRequestInterceptor);
  client.interceptors.response.use(secureResponseInterceptor, errorInterceptor);

  return client;
};

// API client instance
export const apiClient = createSecureApiClient();

// Secure API methods
export const secureApi = {
  // GET requests
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  // POST requests
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT requests
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  // DELETE requests
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },

  // PATCH requests
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },
};

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private windowStart = Date.now();

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();

      // Reset window if needed
      if (now - this.windowStart > securityConfig.rateLimitWindow) {
        this.requestCount = 0;
        this.windowStart = now;
      }

      // Check rate limit
      if (this.requestCount >= securityConfig.rateLimitMax) {
        const waitTime =
          securityConfig.rateLimitWindow - (now - this.windowStart);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      const request = this.queue.shift();
      if (request) {
        this.requestCount++;
        await request();
      }
    }

    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();

// Rate-limited API methods
export const rateLimitedApi = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.get<T>(url, config));
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return requestQueue.add(() => secureApi.post<T>(url, data, config));
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return requestQueue.add(() => secureApi.put<T>(url, data, config));
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return requestQueue.add(() => secureApi.delete<T>(url, config));
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return requestQueue.add(() => secureApi.patch<T>(url, data, config));
  },
};

export default {
  apiClient,
  secureApi,
  rateLimitedApi,
  requestQueue,
};
