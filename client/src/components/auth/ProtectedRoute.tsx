import React from "react";
import { useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/auth-store";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

export const ProtectedRoute = ({
  children,
  requiredRole = [],
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = () => {
      if (!isAuthenticated && !isLoading) {
        // Redirect to login if not authenticated
        router.push("/login");
        return;
      }

      // Check if user has required role
      if (isAuthenticated && requiredRole.length > 0 && user?.role) {
        if (!requiredRole.includes(user.role)) {
          // Redirect to unauthorized or home if role doesn't match
          router.push("/unauthorized");
        }
      }
    };

    verifyAuth();
  }, [isAuthenticated, isLoading, router, requiredRole, user?.role]);

  if (isLoading || (!isAuthenticated && !isLoading)) {
    // Show loading indicator or null while checking auth
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check role if required
  if (
    requiredRole.length > 0 &&
    user?.role &&
    !requiredRole.includes(user.role)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
