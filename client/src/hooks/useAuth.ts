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
  
  // Don't automatically redirect on 401 errors - let user manually choose to login
  // This prevents automatic OAuth redirects that get blocked by Replit

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}
