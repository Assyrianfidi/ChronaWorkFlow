import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { EnterpriseLayout } from "../components/layout/EnterpriseLayout";
import PrivateRoute from "./PrivateRoute";
import { ProtectedRoute, PublicRoute, SuspenseWrapper } from "./RouteGuards";
import { FeatureRoute } from "./FeatureRoute";

const DashboardRouter = lazy(() => import("../pages/DashboardRouter"));
const ExecutiveCommandCenter = lazy(
  () => import("../components/dashboards/ExecutiveCommandCenter"),
);
const LedgerPage = lazy(() => import("../pages/ledger/LedgerPage"));
const APPage = lazy(() => import("../pages/ap/APPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const InvoicesPage = lazy(() => import("../pages/InvoicesPage"));
const CustomersPage = lazy(() => import("../pages/CustomersPage"));
const TransactionsPage = lazy(() => import("../pages/TransactionsPage"));
const InventoryPage = lazy(() => import("../pages/InventoryPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const EntitiesPage = lazy(() => import("../pages/EntitiesPage"));
const AICFOCopilotPage = lazy(() => import("../pages/AICFOCopilotPage"));
const CashFlowForecastPage = lazy(
  () => import("../pages/CashFlowForecastPage"),
);
const AIAssistantPage = lazy(() => import("../pages/AIAssistantPage"));
const QuickBooksMigrationPage = lazy(
  () => import("../pages/QuickBooksMigrationPage"),
);
const AdminSettingsPage = lazy(() => import("../pages/AdminSettingsPage"));
const AuditLogsPage = lazy(() => import("../pages/AuditLogsPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const FeatureManagementPage = lazy(
  () => import("../pages/FeatureManagementPage"),
);
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
const OwnerDashboardPage = lazy(
  () => import("../pages/owner/OwnerDashboardPage"),
);
const OwnerPlansPage = lazy(() => import("../pages/owner/OwnerPlansPage"));
const OwnerSubscriptionsPage = lazy(
  () => import("../pages/owner/OwnerSubscriptionsPage"),
);
const OwnerPlaceholderPage = lazy(
  () => import("../pages/owner/OwnerPlaceholderPage"),
);
const NewFeaturePage = lazy(() => import("../pages/NewFeaturePage"));
const FinancialDashboard = lazy(() => import("../pages/FinancialDashboard"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  // Auth routes
  {
    path: "/login",
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <LoginPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <RegisterPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <ForgotPasswordPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <ResetPasswordPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  // Protected routes - Executive Command Center with Enterprise Layout
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <EnterpriseLayout>
          <SuspenseWrapper>
            <ExecutiveCommandCenter />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </ProtectedRoute>
    ),
  },
  // General Ledger Routes
  {
    path: "/ledger",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <LedgerPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ledger/accounts",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <LedgerPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ledger/journal",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <LedgerPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  // Accounts Payable Routes
  {
    path: "/ap",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AP_CLERK"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <APPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ap/bills",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AP_CLERK"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <APPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ap/payments",
    element: (
      <PrivateRoute
        requiredRole={[
          "ADMIN",
          "MANAGER",
          "ACCOUNTANT",
          "AP_CLERK",
          "TREASURER",
        ]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <APPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/vendors",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AP_CLERK"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <CustomersPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  // Accounts Receivable Routes
  {
    path: "/ar",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AR_CLERK"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <InvoicesPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ar/collections",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AR_CLERK"]}
      >
        <EnterpriseLayout>
          <SuspenseWrapper>
            <InvoicesPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ar/aging",
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT"]}>
        <EnterpriseLayout>
          <SuspenseWrapper>
            <InvoicesPage />
          </SuspenseWrapper>
        </EnterpriseLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/unauthorized",
    element: (
      <SuspenseWrapper>
        <Unauthorized />
      </SuspenseWrapper>
    ),
  },
  // Role-protected routes
  {
    path: "/invoices",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <FeatureRoute feature="INVOICING">
          <EnterpriseLayout>
            <SuspenseWrapper>
              <InvoicesPage />
            </SuspenseWrapper>
          </EnterpriseLayout>
        </FeatureRoute>
      </PrivateRoute>
    ),
  },
  {
    path: "/customers",
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT"]}>
        <FeatureRoute feature="CUSTOMERS">
          <EnterpriseLayout>
            <SuspenseWrapper>
              <CustomersPage />
            </SuspenseWrapper>
          </EnterpriseLayout>
        </FeatureRoute>
      </PrivateRoute>
    ),
  },
  {
    path: "/transactions",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <FeatureRoute feature="TRANSACTIONS">
          <EnterpriseLayout>
            <SuspenseWrapper>
              <TransactionsPage />
            </SuspenseWrapper>
          </EnterpriseLayout>
        </FeatureRoute>
      </PrivateRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <PrivateRoute requiredRole={["ADMIN", "MANAGER", "AUDITOR"]}>
        <FeatureRoute feature="REPORTS">
          <EnterpriseLayout>
            <SuspenseWrapper>
              <ReportsPage />
            </SuspenseWrapper>
          </EnterpriseLayout>
        </FeatureRoute>
      </PrivateRoute>
    ),
  },
  {
    path: "/entities",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <MainLayout>
          <SuspenseWrapper>
            <EntitiesPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ai/copilot",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <MainLayout>
          <SuspenseWrapper>
            <AICFOCopilotPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ai/forecast",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <MainLayout>
          <SuspenseWrapper>
            <CashFlowForecastPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/ai/assistant",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <MainLayout>
          <SuspenseWrapper>
            <AIAssistantPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/migration/quickbooks",
    element: (
      <PrivateRoute
        requiredRole={["ADMIN", "MANAGER", "ACCOUNTANT", "AUDITOR"]}
      >
        <MainLayout>
          <SuspenseWrapper>
            <QuickBooksMigrationPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/notifications",
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
    path: "/users",
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
    path: "/admin/features",
    element: (
      <PrivateRoute requiredRole="ADMIN">
        <MainLayout>
          <SuspenseWrapper>
            <FeatureManagementPage />
          </SuspenseWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: "/inventory",
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
    path: "/audit",
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
    path: "/settings",
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
    path: "/profile",
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
  {
    path: "/new-feature",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SuspenseWrapper>
            <NewFeaturePage />
          </SuspenseWrapper>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/financial-dashboard",
    element: (
      <ProtectedRoute>
        <SuspenseWrapper>
          <FinancialDashboard />
        </SuspenseWrapper>
      </ProtectedRoute>
    ),
  },
  // Owner Console (super-admin)
  {
    path: "/owner",
    element: (
      <PrivateRoute requiredRole="OWNER">
        <SuspenseWrapper>
          <OwnerDashboardPage />
        </SuspenseWrapper>
      </PrivateRoute>
    ),
  },
  {
    path: "/owner/plans",
    element: (
      <PrivateRoute requiredRole="OWNER">
        <SuspenseWrapper>
          <OwnerPlansPage />
        </SuspenseWrapper>
      </PrivateRoute>
    ),
  },
  {
    path: "/owner/subscriptions",
    element: (
      <PrivateRoute requiredRole="OWNER">
        <SuspenseWrapper>
          <OwnerSubscriptionsPage />
        </SuspenseWrapper>
      </PrivateRoute>
    ),
  },
  {
    path: "/owner/:section",
    element: (
      <PrivateRoute requiredRole="OWNER">
        <SuspenseWrapper>
          <OwnerPlaceholderPage />
        </SuspenseWrapper>
      </PrivateRoute>
    ),
  },
  // 404 route
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
