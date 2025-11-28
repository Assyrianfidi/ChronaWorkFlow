import { QueryClient } from '@tanstack/react-query';

// API request utility function
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  // Use VITE_API_URL from environment variables or default to empty string
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const url = `${baseUrl}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include credentials (cookies) with the request
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  // Handle 401 Unauthorized - clear auth and redirect to login
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Handle other error status codes
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `API request failed with status ${response.status}`,
    }));
    throw new Error(errorData.message || 'API request failed');
  }

  // Handle empty responses (e.g., for 204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  // Try to parse the response as JSON, fall back to text if not JSON
  try {
    return await response.json();
  } catch (error) {
    return await response.text() as unknown as T;
  }
}

// Helper function for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string): Promise<T> => apiRequest<T>('GET', endpoint),
  post: <T = any, D = any>(endpoint: string, data?: D): Promise<T> =>
    apiRequest<T>('POST', endpoint, data),
  put: <T = any, D = any>(endpoint: string, data?: D): Promise<T> =>
    apiRequest<T>('PUT', endpoint, data),
  patch: <T = any, D = any>(endpoint: string, data?: D): Promise<T> =>
    apiRequest<T>('PATCH', endpoint, data),
  delete: <T = any>(endpoint: string): Promise<T> =>
    apiRequest<T>('DELETE', endpoint),
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
