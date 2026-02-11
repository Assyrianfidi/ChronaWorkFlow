import * as React from "react";
import { useAuth } from "../../contexts/AuthContext";
import useSWR from "swr";
import { ExplainButton } from "../../components/ledger/ExplainButton";
import { DashboardMetricCard, QuickActions } from "../../components/dashboard";
import {
  TrendingUp,
  DollarSign,
  Target,
  FileText,
  Users,
  Calendar,
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

interface FinancialKPIs {
  monthlyRevenue: number;
  profitMargin: number;
  expensesTotal: number;
  revenueGrowth: number;
  pendingApprovals: number;
  teamPerformance: number;
}

interface TeamActivity {
  id: string;
  type: "approval" | "report" | "expense" | "target";
  message: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch manager dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useSWR<{
    success: boolean;
    data: {
      kpis: FinancialKPIs;
      teamActivity: TeamActivity[];
    };
  }>("/api/dashboard/manager", async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    return response.json();
  });

  const kpis = dashboardData?.data?.kpis;
  const teamActivity = dashboardData?.data?.teamActivity;
  const kpisLoading = isLoading;
  const activityLoading = isLoading;
  const kpisError = error;
  const activityError = error;

  const metrics = [
    {
      title: "Monthly Revenue",
      value: `$${((kpis?.monthlyRevenue || 0) / 1000).toFixed(1)}K`,
      change: `${kpis?.revenueGrowth || 0}%`,
      changeType: (kpis?.revenueGrowth && kpis.revenueGrowth > 0
        ? "increase"
        : "decrease") as "increase" | "decrease",
      icon: DollarSign,
      color: "text-muted-foreground",
    },
    {
      title: "Profit Margin",
      value: `${kpis?.profitMargin || 0}%`,
      change: "+2.1%",
      changeType: "increase" as const,
      icon: TrendingUp,
      color: "text-muted-foreground",
    },
    {
      title: "Total Expenses",
      value: `$${((kpis?.expensesTotal || 0) / 1000).toFixed(1)}K`,
      change: "-5%",
      changeType: "decrease" as const,
      icon: FileText,
      color: "text-muted-foreground",
    },
    {
      title: "Team Performance",
      value: `${kpis?.teamPerformance || 0}%`,
      change: "+8%",
      changeType: "increase" as const,
      icon: Target,
      color: "text-muted-foreground",
    },
  ];

  const quickActions = [
    { label: "Approve Reports", icon: FileText, href: "/reports/approve" },
    { label: "Assign Tasks", icon: Target, href: "/tasks" },
    { label: "Review Team Performance", icon: Users, href: "/team" },
    { label: "Financial Overview", icon: DollarSign, href: "/analytics" },
  ];

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <header className="bg-card border border-border rounded-2xl shadow-soft px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Manager Dashboard
            </h1>
            <p className="mt-1 text-sm opacity-80">
              Financial performance, approvals, and team management for your
              operating area.
            </p>
          </div>
          <div className="text-xs md:text-sm opacity-80 text-right">
            <div>Signed in as</div>
            <div className="font-medium">{user?.name}</div>
          </div>
        </header>

        {/* Manager KPI Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpisLoading
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
                  isLoading={kpisLoading}
                />
              ))}
        </section>

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Manager Quick Actions + Approvals Summary */}
          <div className="space-y-6 xl:col-span-1">
            <EnterpriseCard variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Manager Quick Actions
                </h2>
                <span className="text-xs opacity-60">Day-to-day controls</span>
              </div>
              <QuickActions actions={quickActions} />
            </EnterpriseCard>

            <EnterpriseCard className="p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
                Pending Approvals & Reviews
              </h2>
              <div className="text-center py-4">
                <div className="text-3xl font-semibold mb-1">
                  {kpis?.pendingApprovals || 0}
                </div>
                <div className="text-xs opacity-70">
                  Items awaiting your decision
                </div>
              </div>
            </EnterpriseCard>
          </div>

          {/* Team Activity & Team Financials */}
          <div className="xl:col-span-2 space-y-6">
            {/* Team Activity & Performance Logs */}
            <EnterpriseCard className="p-0 overflow-hidden">
              <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Team Activity & Performance Logs
                </h2>
                <span className="text-xs opacity-60">Last 24 hours</span>
              </div>
              <div className="px-6 pb-6">
                {activityLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((key) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 bg-muted border border-border rounded-xl p-3 animate-pulse shadow-soft"
                      >
                        <div className="w-2 h-2 rounded-full bg-background mt-2" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 bg-background rounded" />
                          <div className="h-2 w-24 bg-background rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activityError ? (
                  <div className="text-center py-8 text-destructive dark:text-destructive-500">
                    Failed to load team activity
                  </div>
                ) : teamActivity && teamActivity.length > 0 ? (
                  <div className="space-y-2">
                    {teamActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted hover:-translate-y-[1px] hover:shadow-elevated transition-transform transition-shadow duration-150"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-2",
                            item.priority === "high"
                              ? "bg-destructive"
                              : item.priority === "medium"
                                ? "bg-warning"
                                : "bg-success",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.message}
                          </div>
                          <div className="text-xs opacity-70">
                            {item.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 opacity-70">
                    No recent team activity
                  </div>
                )}
              </div>
            </EnterpriseCard>

            {/* Team Financials & KPIs Panel */}
            <EnterpriseCard className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                    Team Financials Overview
                  </h2>
                  <p className="mt-1 text-sm opacity-80 max-w-xl">
                    Track your teams revenue, budget utilization, and output
                    metrics at a glance.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs opacity-70">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Rolling 30 days
                  </span>
                  <span>Manager view</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Revenue
                  </span>
                  <span className="text-xl font-semibold">
                    {kpis?.monthlyRevenue
                      ? `$${((kpis.monthlyRevenue || 0) / 1000).toFixed(1)}K`
                      : "$0.0K"}
                  </span>
                  <span className="text-xs opacity-70">
                    Current month billings
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Budget Usage
                  </span>
                  <span className="text-xl font-semibold">
                    {kpis?.expensesTotal
                      ? `${Math.min(100, Math.round((kpis.expensesTotal / (kpis.monthlyRevenue || 1)) * 100))}%`
                      : "0%"}
                  </span>
                  <span className="text-xs opacity-70">
                    Of allocated spend consumed
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Expense Flags
                  </span>
                  <span className="text-xl font-semibold">
                    {kpisError ? "—" : (kpis?.pendingApprovals ?? 0)}
                  </span>
                  <span className="text-xs opacity-70">
                    Items requiring financial review
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Team Output
                  </span>
                  <span className="text-xl font-semibold">
                    {kpis?.teamPerformance ?? 0}%
                  </span>
                  <span className="text-xs opacity-70">
                    Goal attainment this period
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

export default ManagerDashboard;
