import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/components/store/auth-store";
import { Loader2 } from "lucide-react";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export default function AuthenticatedLayout({
  children,
  requiredRole = [],
}: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();

      if (!isLoading && !isAuthenticated) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
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
  }, [isAuthenticated, isLoading, checkAuth, router, requiredRole, user?.role]);

  // Show loading state while checking auth
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
