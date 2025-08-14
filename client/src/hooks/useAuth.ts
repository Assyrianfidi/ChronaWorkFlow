import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'business' | 'admin';
  businessId?: string;
}

export function useAuth() {
  const { data: response, isLoading, error } = useQuery<{user: AuthUser}>({
    queryKey: ["/api/user"],
    retry: false,
    retryOnMount: false,
    staleTime: 0,
  });

  const user = response?.user;
  const isAuthenticated = !!user && !error;
  const isBusinessUser = user?.userType === 'business';
  const isAdmin = user?.userType === 'admin';
  
  return {
    user,
    isLoading,
    isAuthenticated,
    isBusinessUser,
    isAdmin,
    error,
  };
}
