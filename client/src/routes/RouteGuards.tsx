
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext.js';
import { FullPageLoading } from '../components/ui/full-page-loading.js';

// @ts-ignore
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log(
    "ProtectedRoute - isLoading:",
    isLoading,
    "isAuthenticated:",
    isAuthenticated,
    "user:",
    !!user,
  );

  if (isLoading) {
    console.log("ProtectedRoute - showing loading");
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

  console.log(
    "PublicRoute - isLoading:",
    isLoading,
    "isAuthenticated:",
    isAuthenticated,
  );

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
