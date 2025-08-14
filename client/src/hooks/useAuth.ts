import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    retryOnMount: false,
    staleTime: 0,
  });

  // Handle authentication errors
  const isAuthenticated = !!user && !error;
  
  // If we get a 401 error, redirect to login
  if (error && !isLoading) {
    const errorMessage = error.message || '';
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 100);
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}
