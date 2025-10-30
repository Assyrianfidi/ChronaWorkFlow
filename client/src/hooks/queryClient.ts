import { QueryClient } from '@tanstack/react-query';

// API request utility function
export async function apiRequest<T = any>(
  method: string,
  endpoint: string,
  data?: any
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${baseUrl}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    // Unauthorized - clear auth and redirect to login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred');
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

// Helper function for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>('GET', endpoint),
  post: <T = any>(endpoint: string, data?: any) => apiRequest<T>('POST', endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => apiRequest<T>('PUT', endpoint, data),
  patch: <T = any>(endpoint: string, data?: any) => apiRequest<T>('PATCH', endpoint, data),
  delete: <T = any>(endpoint: string) => apiRequest<T>('DELETE', endpoint),
};

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
