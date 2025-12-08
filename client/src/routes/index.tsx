import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import PrivateRoute from './PrivateRoute';
import RoleAllowed from './RoleAllowed';
import { ProtectedRoute, PublicRoute, SuspenseWrapper } from './RouteGuards';

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
        <SuspenseWrapper>
          <LoginPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <RegisterPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <ForgotPasswordPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <ResetPasswordPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  // Protected routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SuspenseWrapper>
            <DashboardRouter />
          </SuspenseWrapper>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <SuspenseWrapper>
        <Unauthorized />
      </SuspenseWrapper>
    ),
  },
  // Role-protected routes
  {
    path: '/invoices',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "USER", "AUDITOR"]}>
        <MainLayout>
          <SuspenseWrapper>
            <InvoicesPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "USER"]}>
        <MainLayout>
          <SuspenseWrapper>
            <CustomersPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "USER", "AUDITOR"]}>
        <MainLayout>
          <SuspenseWrapper>
            <TransactionsPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "AUDITOR"]}>
        <MainLayout>
          <SuspenseWrapper>
            <ReportsPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SuspenseWrapper>
            <NotificationsPage />
          </SuspenseWrapper>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MainLayout>
          <SuspenseWrapper>
            <AdminSettingsPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/inventory',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "INVENTORY_MANAGER"]}>
        <MainLayout>
          <SuspenseWrapper>
            <InventoryPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/audit',
    element: (
      <PrivateRoute requiredRole={["ADMIN", "AUDITOR"]}>
        <MainLayout>
          <SuspenseWrapper>
            <AuditLogsPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MainLayout>
          <SuspenseWrapper>
            <AdminSettingsPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SuspenseWrapper>
            <ProfilePage />
          </SuspenseWrapper>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  // 404 route
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
