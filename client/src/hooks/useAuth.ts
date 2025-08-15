import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'business' | 'admin';
  businessId?: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const businessLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/business/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const businessRegisterMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      businessName: string;
      phone?: string;
      address?: string;
      industry?: string;
    }) => {
      const response = await apiRequest("POST", "/api/business/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Account Created",
        description: "Your business account has been created successfully",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });
  
  return {
    user,
    isLoading,
    isAuthenticated,
    isBusinessUser,
    isAdmin,
    error,
    businessLoginMutation,
    businessRegisterMutation,
  };
}
