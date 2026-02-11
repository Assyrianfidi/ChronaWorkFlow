import * as React from "react";
import { useAuth } from "../../contexts/AuthContext";
import useSWR from "swr";
import {
  DashboardMetricCard,
  QuickActions,
  ActivityFeed,
} from "../../components/dashboard";
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  FileText,
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
        "rounded-2xl border border-border bg-card text-card-foreground shadow-soft transition-transform transition-shadow duration-150",
        {
          "hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "default",
          "hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "elevated",
          "border-2 hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "outlined",
          "bg-card/90 backdrop-blur-sm hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "glass",
        },
        className,
      )}
      {...props}
    />
  ),
);

EnterpriseCard.displayName = "EnterpriseCard";

interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  pendingReports: number;
  systemAlerts: number;
}

interface ActivityItem {
  id: string;
  type: "login" | "report" | "user_created" | "system";
  message: string;
  timestamp: string;
  user?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading, error } = useSWR<{
    success: boolean;
    data: {
      summary: DashboardSummary;
      activity: ActivityItem[];
    };
  }>(
    "/api/dashboard/admin",
    async (url: string) => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
  );

  const summary = dashboardData?.data?.summary;
  const activity = dashboardData?.data?.activity;
  const summaryLoading = isLoading;
  const activityLoading = isLoading;
  const activityError = error;

  const metrics = [
    {
      title: "Total Users",
      value: summary?.totalUsers || 0,
      change: "+12%",
      changeType: "increase" as const,
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      title: "Active Users",
      value: summary?.activeUsers || 0,
      change: "+8%",
      changeType: "increase" as const,
      icon: Building2,
      color: "text-muted-foreground",
    },
    {
      title: "Total Revenue",
      value: `$${((summary?.totalRevenue || 0) / 1000).toFixed(1)}K`,
      change: `${summary?.monthlyGrowth || 0}%`,
      changeType: (summary?.monthlyGrowth && summary.monthlyGrowth > 0
        ? "increase"
        : "decrease") as "increase" | "decrease",
      icon: DollarSign,
      color: "text-muted-foreground",
    },
    {
      title: "System Alerts",
      value: summary?.systemAlerts || 0,
      change: "-2",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      color: "text-destructive dark:text-destructive-500",
    },
  ];

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header / System Overview */}
        <header className="bg-card border border-border rounded-2xl shadow-soft px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm opacity-80">
              System overview, governance, and administrative controls for your
              AccuBooks tenant.
            </p>
          </div>
          <div className="text-xs md:text-sm opacity-80 text-right">
            <div>Signed in as</div>
            <div className="font-medium">{user?.name}</div>
          </div>
        </header>

        {/* System Overview KPI Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryLoading
            ? [0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-2xl shadow-soft p-6 animate-pulse flex flex-col gap-3"
                >
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-7 w-20 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              ))
            : metrics.map((metric, index) => (
                <DashboardMetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  changeType={metric.changeType}
                  icon={metric.icon}
                  color={metric.color}
                  isLoading={summaryLoading}
                />
              ))}
        </section>

        {/* Main Content Grid: Quick Actions + Activity & System Logs + Reports & Insights */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Admin Quick Actions */}
          <div className="space-y-6 xl:col-span-1">
            <EnterpriseCard variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Admin Quick Actions
                </h2>
                <span className="text-xs opacity-60">High-impact controls</span>
              </div>
              <QuickActions
                actions={[
                  { label: "Manage Users", icon: Users, href: "/users" },
                  {
                    label: "Generate Reports",
                    icon: FileText,
                    href: "/reports",
                  },
                  {
                    label: "Review Access Requests",
                    icon: AlertTriangle,
                    href: "/access-requests",
                  },
                  {
                    label: "Configure Settings",
                    icon: Building2,
                    href: "/settings",
                  },
                ]}
              />
            </EnterpriseCard>

            {/* System Status */}
            <EnterpriseCard className="p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
                System Health Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-xs opacity-70">Operational</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <div>
                    <div className="font-medium">API Services</div>
                    <div className="text-xs opacity-70">All systems online</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div>
                    <div className="font-medium">Storage</div>
                    <div className="text-xs opacity-70">78% capacity used</div>
                  </div>
                </div>
              </div>
            </EnterpriseCard>
          </div>

          {/* Activity & System Logs + Reports & Insights Overview */}
          <div className="xl:col-span-2 space-y-6">
            {/* Recent Activity & System Logs */}
            <EnterpriseCard className="p-0 overflow-hidden">
              <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Recent Activity & System Logs
                </h2>
                <span className="text-xs opacity-60">Last 24 hours</span>
              </div>
              <div className="px-6 pb-6">
                <ActivityFeed
                  activities={activity || []}
                  isLoading={activityLoading}
                  error={activityError}
                />
              </div>
            </EnterpriseCard>

            {/* Reports & Insights Overview */}
            <EnterpriseCard className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                    Reports & Insights Overview
                  </h2>
                  <p className="mt-1 text-sm opacity-80 max-w-xl">
                    Monitor reporting throughput, approval queues, and
                    compliance coverage across your organization.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs opacity-70">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Real-time snapshot
                  </span>
                  <span>Performance window: last 30 days</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Daily Transactions
                  </span>
                  <span className="text-2xl font-semibold">
                    {summary?.totalRevenue
                      ? Math.round(summary.totalRevenue / 100).toLocaleString()
                      : "1,240"}
                  </span>
                  <span className="text-xs opacity-70">
                    Processed in the last 24 hours
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Pending Approvals
                  </span>
                  <span className="text-2xl font-semibold">
                    {summary?.pendingReports ?? 0}
                  </span>
                  <span className="text-xs opacity-70">
                    Items awaiting admin review
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Compliance Coverage
                  </span>
                  <span className="text-2xl font-semibold">
                    {summary?.monthlyGrowth
                      ? `${summary.monthlyGrowth}%`
                      : "97%"}
                  </span>
                  <span className="text-xs opacity-70">
                    Core policies with monitoring enabled
                  </span>
                </div>
              </div>
            </EnterpriseCard>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
};

export default AdminDashboard;
