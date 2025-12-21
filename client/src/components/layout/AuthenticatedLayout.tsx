import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export default function AuthenticatedLayout({
  children,
  requiredRole = [],
}: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
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
  }, [isAuthenticated, isLoading, router, requiredRole, user?.role]);

  // Show loading state while checking auth
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 max-w-md bg-card text-card-foreground rounded-lg shadow-md border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
