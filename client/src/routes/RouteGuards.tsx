
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FullPageLoading } from "../components/ui/EnterpriseLoading";

// @ts-ignore
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageLoading />;
  }

  const allowed = isAuthenticated && !!user;

  return allowed ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: window.location.pathname }} replace />
  );
};

// @ts-ignore
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Temporarily bypass loading check to test
  // if (isLoading) {
  //   console.log('PublicRoute - showing loading');
  //   return <FullPageLoading />;
  // }

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// @ts-ignore
export const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <React.Suspense fallback={<FullPageLoading />}>{children}</React.Suspense>
);
