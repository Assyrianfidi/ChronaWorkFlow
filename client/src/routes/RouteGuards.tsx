declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FullPageLoading } from "../components/ui/EnterpriseLoading";

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

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

export const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <React.Suspense fallback={<FullPageLoading />}>{children}</React.Suspense>
);
