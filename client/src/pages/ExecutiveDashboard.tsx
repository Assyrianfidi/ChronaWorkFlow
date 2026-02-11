import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { dashboardKpiService } from "@/services/dashboard-kpi.service";
import { ProtectedComponent } from "@/components/ui/ProtectedComponent";
import { BillingBanner } from "@/components/ui/BillingBanner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Wallet,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";

// Skeleton Loader Component
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-secondary rounded", className)} />
);

// KPI Card Component - Executive Level
interface ExecutiveKPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "highlight" | "success" | "warning" | "error";
  loading?: boolean;
  onClick?: () => void;
}

const ExecutiveKPICard: React.FC<ExecutiveKPICardProps> = ({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  variant = "default",
  loading = false,
  onClick,
}) => {
  const trendIcon =
    change?.trend === "up" ? (
      <ArrowUpRight className="w-3 h-3" />
    ) : change?.trend === "down" ? (
      <ArrowDownRight className="w-3 h-3" />
    ) : (
      <Minus className="w-3 h-3" />
    );

  const cardStyles = {
    default: "bg-card border border-border",
    highlight:
      "bg-card border-l-4 border-l-primary border-y border-r border-border",
    success:
      "bg-card border-l-4 border-l-success-500 border-y border-r border-border",
    warning:
      "bg-card border-l-4 border-l-warning-500 border-y border-r border-border",
    error:
      "bg-card border-l-4 border-l-error-500 border-y border-r border-border",
  };

  if (loading) {
    return (
      <div className={cn("p-6 rounded-lg", cardStyles[variant])}>
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-6 rounded-lg transition-all duration-200",
        cardStyles[variant],
        onClick && "cursor-pointer hover:shadow-md hover:border-border-light",
        "group",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-[family-name:var(--font-tabular)] tracking-tight">
              {value}
            </span>
            {change && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
                  change.trend === "up" && "bg-success-100 text-success-700",
                  change.trend === "down" && "bg-error-100 text-error-700",
                  change.trend === "neutral" &&
                    "bg-secondary text-muted-foreground",
                )}
              >
                {trendIcon}
                {change.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-md bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Row Component
interface MetricRowProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

const MetricRow: React.FC<MetricRowProps> = ({
  label,
  value,
  change,
  trend,
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium font-[family-name:var(--font-tabular)]">
        {value}
      </span>
      {change && (
        <span
          className={cn(
            "text-xs",
            trend === "up" && "text-success-600",
            trend === "down" && "text-error-600",
            trend === "neutral" && "text-muted-foreground",
          )}
        >
          {change}
        </span>
      )}
    </div>
  </div>
);

const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const companyId = "demo-company";
  const { isReadOnly, isSuspended } = useBillingStatus(companyId);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const { data: kpis } = dashboardKpiService.getKPIs(companyId);
  const { data: metrics } = dashboardKpiService.getMetrics(companyId);
  const { data: cashFlow } = dashboardKpiService.getCashFlow(companyId);

  const handleAction = (action: string) => {
    toast.info(`${action} - Opening details...`);
  };

  return (
    <div className="min-h-screen bg-background">
      {companyId && <BillingBanner companyId={companyId} />}

      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Company overview and key performance indicators
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* TOP LAYER: Critical Metrics */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Company Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <ExecutiveKPICard
              title="MRR"
              value={`$${(kpis?.mrr || 8540).toLocaleString()}`}
              change={{ value: "12.5%", trend: "up" }}
              subtitle="vs last month"
              icon={DollarSign}
              variant="highlight"
              loading={isLoading}
              onClick={() => handleAction("MRR Details")}
            />
            <ExecutiveKPICard
              title="ARR"
              value={`$${((kpis?.mrr || 8540) * 12).toLocaleString()}`}
              change={{ value: "8.3%", trend: "up" }}
              subtitle="Annual recurring"
              icon={BarChart3}
              loading={isLoading}
              onClick={() => handleAction("ARR Details")}
            />
            <ExecutiveKPICard
              title="Cash Position"
              value={`$${(kpis?.cashPosition || 124563).toLocaleString()}`}
              change={{ value: "5.2%", trend: "up" }}
              subtitle="Available funds"
              icon={Wallet}
              variant="success"
              loading={isLoading}
              onClick={() => handleAction("Cash Flow")}
            />
            <ExecutiveKPICard
              title="Active Customers"
              value={kpis?.activeCustomers || 1234}
              change={{ value: "24", trend: "up" }}
              subtitle="This month"
              icon={Users}
              loading={isLoading}
              onClick={() => handleAction("Customer List")}
            />
            <ExecutiveKPICard
              title="Churn Rate"
              value={`${kpis?.churnRate || 2.4}%`}
              change={{ value: "0.3%", trend: "down" }}
              subtitle="Monthly churn"
              icon={TrendingDown}
              variant="warning"
              loading={isLoading}
              onClick={() => handleAction("Churn Analysis")}
            />
            <ExecutiveKPICard
              title="System Health"
              value="99.9%"
              change={{ value: "Operational", trend: "neutral" }}
              subtitle="Uptime (30d)"
              icon={CheckCircle2}
              variant="success"
              loading={isLoading}
            />
          </div>
        </section>

        {/* MIDDLE LAYER: Decision Making */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trends */}
          <section className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Revenue Trends
              </h2>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                onClick={() => handleAction("Full Revenue Report")}
              >
                View Report <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="h-48 bg-secondary/50 rounded-md flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Revenue visualization
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        This Month
                      </p>
                      <p className="text-lg font-semibold font-[family-name:var(--font-tabular)]">
                        $85,400
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Growth</p>
                      <p className="text-lg font-semibold font-[family-name:var(--font-tabular)] text-success-600">
                        +12.5%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Forecast</p>
                      <p className="text-lg font-semibold font-[family-name:var(--font-tabular)]">
                        $92,100
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Cash Flow Forecast */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cash Flow (6mo)
            </h2>
            <div className="bg-card border border-border rounded-lg p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {(
                    cashFlow || [
                      { month: "Jan", net: 12500 },
                      { month: "Feb", net: 15200 },
                      { month: "Mar", net: 14800 },
                      { month: "Apr", net: 18900 },
                      { month: "May", net: 22400 },
                      { month: "Jun", net: 26800 },
                    ]
                  ).map((cf, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {cf.month}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium font-[family-name:var(--font-tabular)]",
                          cf.net >= 0 ? "text-success-600" : "text-error-600",
                        )}
                      >
                        ${cf.net.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 mt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">6-Month Total</span>
                      <span className="text-lg font-semibold font-[family-name:var(--font-tabular)] text-success-600">
                        $110,600
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* LOWER LAYER: Optional Depth */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations Overview */}
          <ProtectedComponent role={["OWNER", "ADMIN", "MANAGER"]}>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operations Overview
              </h2>
              <div className="bg-card border border-border rounded-lg p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <MetricRow
                      label="Total Invoices"
                      value={metrics?.totalInvoices || 456}
                      change="+12"
                      trend="up"
                    />
                    <MetricRow
                      label="Transactions"
                      value={metrics?.totalTransactions || 1234}
                      change="+89"
                      trend="up"
                    />
                    <MetricRow
                      label="Open Invoices"
                      value={metrics?.openInvoices || 23}
                      change="-5"
                      trend="down"
                    />
                    <MetricRow
                      label="Overdue"
                      value={metrics?.overdueInvoices || 7}
                      change="+2"
                      trend="up"
                    />
                  </div>
                )}
              </div>
            </section>
          </ProtectedComponent>

          {/* Subscription Movement */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subscription Movement
            </h2>
            <div className="bg-card border border-border rounded-lg p-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success-600" />
                      <span className="text-sm font-medium">Upgrades</span>
                    </div>
                    <span className="text-sm font-semibold text-success-600">
                      +12
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-error-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-error-600" />
                      <span className="text-sm font-medium">Downgrades</span>
                    </div>
                    <span className="text-sm font-semibold text-error-600">
                      -3
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-warning-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-warning-600" />
                      <span className="text-sm font-medium">Churned</span>
                    </div>
                    <span className="text-sm font-semibold text-warning-600">
                      -5
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-medium">New</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      +24
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Owner Tools */}
          <ProtectedComponent permission="owner:access">
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Owner Controls
              </h2>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => (window.location.href = "/owner-controls")}
                    disabled={isReadOnly || isSuspended}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md border transition-all duration-200",
                      "border-border hover:border-border-light hover:bg-secondary",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary-100">
                        <Clock className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          Accounting Periods
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Manage fiscal periods
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => (window.location.href = "/owner/plans")}
                    disabled={isReadOnly || isSuspended}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md border transition-all duration-200",
                      "border-border hover:border-border-light hover:bg-secondary",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-success-100">
                        <CreditCard className="w-4 h-4 text-success-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Billing Plans</p>
                        <p className="text-xs text-muted-foreground">
                          Configure pricing
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <button
                    onClick={() => handleAction("System Settings")}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md border transition-all duration-200",
                      "border-border hover:border-border-light hover:bg-secondary",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-accent-100">
                        <PieChart className="w-4 h-4 text-accent-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Reports</p>
                        <p className="text-xs text-muted-foreground">
                          Financial summaries
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </section>
          </ProtectedComponent>
        </div>

        {/* Alerts & Anomalies */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Alerts & Anomalies
          </h2>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning-100">
                <AlertCircle className="w-4 h-4 text-warning-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">2 invoices overdue</p>
                <p className="text-xs text-muted-foreground">
                  Consider sending payment reminders to affected customers
                </p>
              </div>
              <button
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => handleAction("View Overdue Invoices")}
              >
                Review
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
