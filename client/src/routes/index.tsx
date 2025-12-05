import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { FullPageLoading } from '../components/ui/full-page-loading';
import PrivateRoute from './PrivateRoute';
import RoleAllowed from './RoleAllowed';

// Lazy load pages for better performance
const DashboardRouter = lazy(() => import('../pages/DashboardRouter'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const InvoicesPage = lazy(() => import('../pages/InvoicesPage'));
const CustomersPage = lazy(() => import('../pages/CustomersPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const AdminSettingsPage = lazy(() => import('../pages/AdminSettingsPage'));
const AuditLogsPage = lazy(() => import('../pages/AuditLogsPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <FullPageLoading />;
  }
  
  return isAuthenticated ? (
    <Suspense fallback={<FullPageLoading />}>
      {children}
    </Suspense>
  ) : (
    <Navigate to="/login" state={{ from: window.location.pathname }} replace />
  );
};

// Public route component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <FullPageLoading />;
  }
  
  return !isAuthenticated ? (
    <Suspense fallback={<FullPageLoading />}>
      {children}
    </Suspense>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // Auth routes
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicRoute>
        <ResetPasswordPage />
      </PublicRoute>
    ),
  },
  // Protected routes
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <DashboardRouter />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <Suspense fallback={<FullPageLoading />}>
        <Unauthorized />
      </Suspense>
    ),
  },
  // Role-protected routes
  {
    path: '/invoices',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "USER", "AUDITOR"]}>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <InvoicesPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "USER"]}>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <CustomersPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "USER", "AUDITOR"]}>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <TransactionsPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "AUDITOR"]}>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <ReportsPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <PrivateRoute>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <NotificationsPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <AdminSettingsPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/inventory',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "INVENTORY_MANAGER"]}>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <InventoryPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/audit',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "AUDITOR"]}>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <AuditLogsPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <AdminSettingsPage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <MainLayout>
          <Suspense fallback={<FullPageLoading />}>
            <ProfilePage />
          </Suspense>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  // 404 route
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
