import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '../store/auth-store';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FullPageLoading } from '../components/ui/full-page-loading';

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('../pages/settings/ProfilePage'));

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
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
  const { isAuthenticated, isLoading } = useAuthStore();
  
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
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      // Add more protected routes here
    ],
  },
  // 404 route
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
