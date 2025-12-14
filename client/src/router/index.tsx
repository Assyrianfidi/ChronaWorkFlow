import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy loaded components for code splitting
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const SignIn = React.lazy(() => import("@/pages/auth/SignIn"));
const SignUp = React.lazy(() => import("@/pages/auth/SignUp"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const Unauthorized = React.lazy(() => import("@/pages/Unauthorized"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

// Role-specific dashboards
const CFODashboard = React.lazy(
  () => import("@/pages/dashboards/CFODashboard"),
);
const ControllerDashboard = React.lazy(
  () => import("@/pages/dashboards/ControllerDashboard"),
);
const ProjectManagerDashboard = React.lazy(
  () => import("@/pages/dashboards/ProjectManagerDashboard"),
);
const AccountantDashboard = React.lazy(
  () => import("@/pages/dashboards/AccountantDashboard"),
);

// Feature pages
const Customers = React.lazy(() => import("@/pages/Customers"));
const Invoices = React.lazy(() => import("@/pages/Invoices"));
const Reports = React.lazy(() => import("@/pages/Reports"));
const Inventory = React.lazy(() => import("@/pages/Inventory"));
const Transactions = React.lazy(() => import("@/pages/Transactions"));
const Payroll = React.lazy(() => import("@/pages/Payroll"));
const Reconciliation = React.lazy(() => import("@/pages/Reconciliation"));
const Vendors = React.lazy(() => import("@/pages/Vendors"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Role-Specific Dashboards */}
            <Route
              path="/dashboard/cfo"
              element={
                <ProtectedRoute requiredRole="CFO">
                  <CFODashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/controller"
              element={
                <ProtectedRoute requiredRole="Controller">
                  <ControllerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/project-manager"
              element={
                <ProtectedRoute requiredRole="ProjectManager">
                  <ProjectManagerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/accountant"
              element={
                <ProtectedRoute requiredRole="Accountant">
                  <AccountantDashboard />
                </ProtectedRoute>
              }
            />

            {/* Feature Routes */}
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers/:id"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory/:id"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions/:id"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <Payroll />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reconciliation"
              element={
                <ProtectedRoute>
                  <Reconciliation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors"
              element={
                <ProtectedRoute>
                  <Vendors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors/:id"
              element={
                <ProtectedRoute>
                  <Vendors />
                </ProtectedRoute>
              }
            />

            {/* Settings and Profile */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 Route - Must be last */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default AppRouter;
