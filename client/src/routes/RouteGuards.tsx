import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FullPageLoading } from '../components/ui/full-page-loading';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoading />;
  }

  return isAuthenticated ? <>{children}</> : (
    <Navigate to="/login" state={{ from: window.location.pathname }} replace />
  );
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoading />;
  }

  return !isAuthenticated ? <>{children}</> : (
    <Navigate to="/dashboard" replace />
  );
};

export const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={<FullPageLoading />}>
    {children}
  </React.Suspense>
);
