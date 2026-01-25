import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export function usePermissions() {
  const {
    data: me,
    isLoading,
    error,
  } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await authApi.getMe();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasPermission = (permission: string): boolean => {
    return me?.permissions.includes(permission) ?? false;
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!me?.role) return false;
    if (Array.isArray(role)) return role.includes(me.role);
    return me.role === role;
  };

  return {
    user: me,
    isLoading,
    error,
    hasPermission,
    hasRole,
    permissions: me?.permissions ?? [],
    role: me?.role,
  };
}
