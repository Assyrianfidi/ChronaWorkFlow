import * as React from "react";
import { useAuth } from "../../contexts/AuthContext";
import useSWR from "swr";
import { DashboardMetricCard, ActivityFeed } from "../../components/dashboard";
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";

interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass";
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border-gray bg-surface2 shadow-soft transition-transform transition-shadow duration-150",
        {
          "hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "default",
          "hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "elevated",
          "border-2 hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "outlined",
          "bg-surface2/90 backdrop-blur-sm hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "glass",
        },
        className,
      )}
      {...props}
    />
  ),
);

EnterpriseCard.displayName = "EnterpriseCard";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: "compliant" | "warning" | "violation";
  details: string;
}

interface ComplianceMetrics {
  totalAudits: number;
  compliantRate: number;
  violationsFound: number;
  lastAuditDate: string;
  pendingReviews: number;
  criticalAlerts: number;
}

// @ts-ignore
const AuditorDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch compliance metrics
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useSWR<ComplianceMetrics>(
    "/api/dashboard/compliance-metrics",
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch compliance metrics");
      return response.json();
    },
  );

  // Fetch audit logs
  const {
    data: auditLogs,
    error: logsError,
    isLoading: logsLoading,
  } = useSWR<AuditLog[]>("/api/dashboard/audit-logs", async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch audit logs");
    return response.json();
  });

  const complianceMetrics = [
    {
      title: "Total Audits",
      value: metrics?.totalAudits || 0,
      change: "+12",
      changeType: "increase" as const,
      icon: Shield,
      color: "text-muted-foreground",
    },
    {
      title: "Compliance Rate",
      value: `${metrics?.compliantRate || 0}%`,
      change: "+2.1%",
      changeType: "increase" as const,
      icon: CheckCircle,
      color: "text-muted-foreground",
    },
    {
      title: "Violations Found",
      value: metrics?.violationsFound || 0,
      change: "-3",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      color: "text-muted-foreground",
    },
    {
      title: "Pending Reviews",
      value: metrics?.pendingReviews || 0,
      change: "+5",
      changeType: "increase" as const,
      icon: FileText,
      color: "text-orange-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-emerald-50 text-emerald-800 border border-border-gray";
      case "warning":
        return "bg-amber-50 text-amber-800 border border-border-gray";
      case "violation":
        return "bg-rose-50 text-rose-800 border border-border-gray";
      default:
        return "bg-surface1 text-black border border-border-gray";
    }
  };

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Auditor header shell */}
        <header className="bg-surface1 border border-border-gray rounded-2xl shadow-soft px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Auditor Dashboard
            </h1>
            <p className="mt-1 text-sm opacity-80">
              Audit trails, compliance checks, and change logs in one place.
            </p>
          </div>
          <div className="text-xs md:text-sm opacity-80 text-right">
            <div>Signed in as</div>
            <div className="font-medium">{user?.name}</div>
          </div>
        </header>

        {/* Compliance Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsLoading
            ? [0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="bg-surface2 border border-border-gray rounded-2xl shadow-soft p-6 animate-pulse flex flex-col gap-3"
                >
                  <div className="h-4 w-24 bg-surface1 rounded" />
                  <div className="h-7 w-20 bg-surface1 rounded" />
                  <div className="h-3 w-16 bg-surface1 rounded" />
                </div>
              ))
            : complianceMetrics?.map((metric, index) => (
                <DashboardMetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  changeType={metric.changeType}
                  icon={metric.icon}
                  color={metric.color}
                  isLoading={metricsLoading}
                />
              ))}
        </section>

        {/* Critical Alerts */}
        {(metrics?.criticalAlerts || 0) > 0 && (
          <EnterpriseCard className="p-6 border border-border-gray">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Critical Alerts
                </h2>
                <p className="text-sm opacity-80">
                  {metrics?.criticalAlerts || 0} items require immediate
                  attention
                </p>
              </div>
            </div>
          </EnterpriseCard>
        )}

        {/* Main Content Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Audit Summary & Recent Findings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Audit Logs / Findings */}
            <EnterpriseCard className="p-0 overflow-hidden">
              <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Recent Audit Logs
                </h2>
                <button className="text-xs md:text-sm opacity-80 flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
              </div>
              <div className="px-6 pb-6">
                <div className="bg-surface2 border border-border-gray rounded-2xl shadow-soft overflow-hidden">
                  {logsLoading ? (
                    <div className="p-6 space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-4 bg-surface2 border border-border-gray rounded-xl p-4 animate-pulse shadow-soft"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-40 bg-surface1 rounded" />
                            <div className="h-2 w-24 bg-surface1 rounded" />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="h-6 w-20 bg-surface1 rounded-full" />
                            <div className="h-4 w-16 bg-surface1 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : logsError ? (
                    <div className="p-6 text-center text-rose-600">
                      Failed to load audit logs
                    </div>
                  ) : auditLogs && auditLogs.length > 0 ? (
                    <ul className="divide-y divide-border-gray">
                      {auditLogs.map((log) => (
                        <li
                          key={log.id}
                          className="px-6 py-4 bg-surface2 hover:bg-surface1 transition-colors shadow-soft hover:shadow-elevated hover:-translate-y-[1px] duration-150"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {log.action}
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1",
                                    getStatusColor(log.status),
                                  )}
                                >
                                  {log.status}
                                </span>
                              </div>
                              <p className="text-sm opacity-80 mb-1 truncate">
                                {log.details}
                              </p>
                              <p className="text-xs opacity-70">
                                {log.user} • {log.timestamp}
                              </p>
                            </div>
                            <button className="ml-4 opacity-80 hover:opacity-100">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center opacity-70">
                      No audit logs available.
                    </div>
                  )}
                </div>
              </div>
            </EnterpriseCard>
          </div>

          {/* Right: Compliance Status & Quick Actions */}
          <div className="space-y-6">
            {/* Last Audit Info / Compliance Status */}
            <EnterpriseCard className="p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
                Last Audit
              </h2>
              <div className="text-center space-y-2">
                <div className="text-2xl font-semibold">
                  {metrics?.lastAuditDate
                    ? new Date(metrics.lastAuditDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div className="text-xs opacity-70">Completion date</div>
              </div>
            </EnterpriseCard>

            {/* Quick Actions */}
            <EnterpriseCard variant="elevated" className="p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
                Quick Audit Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border-gray bg-surface1 shadow-soft hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span>Generate Report</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border-gray bg-surface1 shadow-soft hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <Eye className="w-4 h-4" />
                  <span>View All Logs</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border-gray bg-surface1 shadow-soft hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </button>
              </div>
            </EnterpriseCard>
          </div>
        </section>

        {/* Compliance Overview */}
        <EnterpriseCard className="p-6">
          <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
            Compliance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Data Protection</span>
                <span className="text-xs opacity-80">98%</span>
              </div>
              <div className="w-full bg-surface1 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: "98%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Access Control</span>
                <span className="text-xs opacity-80">95%</span>
              </div>
              <div className="w-full bg-surface1 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: "95%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Audit Trail</span>
                <span className="text-xs opacity-80">87%</span>
              </div>
              <div className="w-full bg-surface1 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: "87%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Documentation</span>
                <span className="text-xs opacity-80">92%</span>
              </div>
              <div className="w-full bg-surface1 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: "92%" }}
                ></div>
              </div>
            </div>
          </div>
        </EnterpriseCard>
      </div>
    </DashboardShell>
  );
};

export default AuditorDashboard;
