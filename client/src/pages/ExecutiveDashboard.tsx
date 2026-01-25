import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { dashboardKpiService } from "@/services/dashboard-kpi.service";
import { ProtectedComponent } from "@/components/ui/ProtectedComponent";
import { BillingBanner } from "@/components/ui/BillingBanner";
import { useAuth } from "@/contexts/AuthContext";

const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const companyId = "demo-company"; // TODO: pull from context
  const { isReadOnly, isSuspended } = useBillingStatus(companyId);

  // Example: single source of truth KPIs
  const { data: kpis } = dashboardKpiService.getKPIs(companyId);
  const { data: metrics } = dashboardKpiService.getMetrics(companyId);
  const { data: cashFlow } = dashboardKpiService.getCashFlow(companyId);

  return (
    <div className="p-6 space-y-6">
      {companyId && <BillingBanner companyId={companyId} />}

      <h1 className="text-3xl font-bold">Executive Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold">${kpis?.totalRevenue?.toFixed(2) ?? "0.00"}</p>
          <p className="text-sm text-green-600">+{kpis?.revenueChange ?? 0}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          <p className="text-2xl font-bold">${kpis?.netProfit?.toFixed(2) ?? "0.00"}</p>
          <p className="text-sm text-green-600">+{kpis?.profitChange ?? 0}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">A/R</h3>
          <p className="text-2xl font-bold">${kpis?.accountsReceivable?.toFixed(2) ?? "0.00"}</p>
          <p className="text-sm text-orange-600">{kpis?.receivablesChange ?? 0}%</p>
        </div>
      </div>

      {/* Role-Based Sections */}
      <ProtectedComponent role={["OWNER", "ADMIN", "MANAGER"]}>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Operations Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{metrics?.totalInvoices ?? 0}</p>
              <p className="text-sm text-gray-500">Invoices</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics?.totalTransactions ?? 0}</p>
              <p className="text-sm text-gray-500">Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics?.openInvoices ?? 0}</p>
              <p className="text-sm text-gray-500">Open</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics?.overdueInvoices ?? 0}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </ProtectedComponent>

      <ProtectedComponent role={["OWNER", "ADMIN"]}>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Cash Flow (6mo)</h2>
          <div className="space-y-2">
            {cashFlow?.slice(0, 6).map((cf, i) => (
              <div key={i} className="flex justify-between">
                <span>{cf.month}</span>
                <span className={cf.net >= 0 ? "text-green-600" : "text-red-600"}>
                  ${cf.net.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ProtectedComponent>

      <ProtectedComponent permission="owner:access">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Owner Tools</h2>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={isReadOnly || isSuspended}
              onClick={() => (window.location.href = "/owner-controls")}
            >
              Accounting Periods
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              disabled={isReadOnly || isSuspended}
              onClick={() => (window.location.href = "/owner/plans")}
            >
              Billing Plans
            </button>
          </div>
        </div>
      </ProtectedComponent>
    </div>
  );
};

export default ExecutiveDashboard;
