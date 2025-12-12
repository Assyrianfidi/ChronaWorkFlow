import React from 'react';
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
// @ts-ignore
import { AuthProvider } from '../contexts/AuthContext.js.js';
// @ts-ignore
import { AccountsProvider } from '../contexts/AccountsContext.js.js';
// @ts-ignore
import { TransactionsProvider } from '../contexts/TransactionsContext.js.js';
// @ts-ignore
import { ProtectedRoute } from '../components/ProtectedRoute.js.js';

// Lazy load pages for better performance
// @ts-ignore
// @ts-ignore
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
// @ts-ignore
// @ts-ignore
const LoginPage = lazy(() => import("../pages/LoginPage"));
// @ts-ignore
// @ts-ignore
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
// @ts-ignore
// @ts-ignore
const AccountsPage = lazy(() => import("../pages/AccountsPage"));
// @ts-ignore
// @ts-ignore
const TransactionsPage = lazy(() => import("../pages/TransactionsPage"));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-gray-500">Loading...</div>
  </div>
);

// App wrapper with all providers
const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <AccountsProvider>
      <TransactionsProvider>{children}</TransactionsProvider>
    </AccountsProvider>
  </AuthProvider>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  // Auth routes
  {
    path: "/login",
    element: (
      <AppWrapper>
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage />
        </Suspense>
      </AppWrapper>
    ),
  },
  {
    path: "/register",
    element: (
      <AppWrapper>
        <Suspense fallback={<LoadingFallback />}>
          <RegisterPage />
        </Suspense>
      </AppWrapper>
    ),
  },
  // Protected routes
  {
    path: "/dashboard",
    element: (
      <AppWrapper>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        </ProtectedRoute>
      </AppWrapper>
    ),
  },
  {
    path: "/accounts",
    element: (
      <AppWrapper>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AccountsPage />
          </Suspense>
        </ProtectedRoute>
      </AppWrapper>
    ),
  },
  {
    path: "/transactions",
    element: (
      <AppWrapper>
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <TransactionsPage />
          </Suspense>
        </ProtectedRoute>
      </AppWrapper>
    ),
  },
  // 404 route
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
