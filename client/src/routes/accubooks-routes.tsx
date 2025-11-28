import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AccountsProvider } from '../contexts/AccountsContext';
import { TransactionsProvider } from '../contexts/TransactionsContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const AccountsPage = lazy(() => import('../pages/AccountsPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));

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
      <TransactionsProvider>
        {children}
      </TransactionsProvider>
    </AccountsProvider>
  </AuthProvider>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // Auth routes
  {
    path: '/login',
    element: (
      <AppWrapper>
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage />
        </Suspense>
      </AppWrapper>
    ),
  },
  {
    path: '/register',
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
    path: '/dashboard',
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
    path: '/accounts',
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
    path: '/transactions',
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
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
