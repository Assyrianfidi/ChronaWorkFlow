import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Flame,
  LayoutDashboard,
  Minus,
  MoreHorizontal,
  PieChart,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// ========================================
// TYPE DEFINITIONS
// ========================================
interface HealthMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  unit?: string;
  status: "good" | "warning" | "critical" | "neutral";
  drillDownPath?: string;
}

interface RiskItem {
  id: string;
  type: "overdue" | "reconciliation" | "compliance" | "cashflow" | "churn";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  amount?: string;
  count?: number;
  action: string;
  actionPath: string;
  dueDate?: string;
}

interface ModuleStatus {
  id: string;
  name: string;
  icon: React.ElementType;
  status: "healthy" | "warning" | "attention";
  lastActivity: string;
  pendingCount: number;
  path: string;
}

// ========================================
// MOCK DATA - In production, this comes from APIs
// ========================================
const HEALTH_METRICS: HealthMetric[] = [
  {
    id: "cash-runway",
    label: "Cash Runway",
    value: "7.2",
    change: -12,
    trend: "down",
    unit: "months",
    status: "warning",
    drillDownPath: "/cash/forecast",
  },
  {
    id: "burn-rate",
    label: "Monthly Burn",
    value: "$127K",
    change: 8,
    trend: "up",
    status: "neutral",
    drillDownPath: "/expenses/claims",
  },
  {
    id: "mrr",
    label: "MRR",
    value: "$485K",
    change: 18,
    trend: "up",
    unit: "$",
    status: "good",
    drillDownPath: "/revenue/recognition",
  },
  {
    id: "ar-outstanding",
    label: "A/R Outstanding",
    value: "$892K",
    change: 5,
    trend: "up",
    status: "warning",
    drillDownPath: "/ar/aging",
  },
  {
    id: "ap-outstanding",
    label: "A/P Outstanding",
    value: "$634K",
    change: -3,
    trend: "down",
    status: "neutral",
    drillDownPath: "/ap/aging",
  },
  {
    id: "quick-ratio",
    label: "Quick Ratio",
    value: "1.41",
    change: 0.02,
    trend: "up",
    status: "good",
    drillDownPath: "/reports/financial",
  },
];

const RISKS_AND_ACTIONS: RiskItem[] = [
  {
    id: "risk-1",
    type: "overdue",
    severity: "critical",
    title: "Overdue Invoices",
    description: "3 enterprise clients past 60 days",
    amount: "$127,450",
    count: 3,
    action: "View Collections Queue",
    actionPath: "/ar/collections",
    dueDate: "2 days ago",
  },
  {
    id: "risk-2",
    type: "reconciliation",
    severity: "warning",
    title: "Unreconciled Transactions",
    description: "Operating account needs attention",
    count: 12,
    action: "Reconcile Now",
    actionPath: "/reconciliation",
    dueDate: "Last reconciled 3 days ago",
  },
  {
    id: "risk-3",
    type: "compliance",
    severity: "warning",
    title: "Sales Tax Filing",
    description: "Q4 filing due next week",
    action: "Prepare Filing",
    actionPath: "/tax/sales",
    dueDate: "Due in 7 days",
  },
  {
    id: "risk-4",
    type: "cashflow",
    severity: "info",
    title: "Large AP Batch",
    description: "$89K scheduled for payment Friday",
    amount: "$89,000",
    action: "Review & Approve",
    actionPath: "/ap/payments",
    dueDate: "Scheduled for Friday",
  },
];

const MODULE_STATUSES: ModuleStatus[] = [
  {
    id: "ledger",
    name: "General Ledger",
    icon: LayoutDashboard,
    status: "healthy",
    lastActivity: "2 min ago",
    pendingCount: 0,
    path: "/ledger",
  },
  {
    id: "ar",
    name: "Accounts Receivable",
    icon: FileText,
    status: "attention",
    lastActivity: "5 min ago",
    pendingCount: 3,
    path: "/ar",
  },
  {
    id: "ap",
    name: "Accounts Payable",
    icon: Receipt,
    status: "warning",
    lastActivity: "1 hr ago",
    pendingCount: 12,
    path: "/ap",
  },
  {
    id: "cash",
    name: "Cash & Treasury",
    icon: Wallet,
    status: "healthy",
    lastActivity: "Just now",
    pendingCount: 0,
    path: "/cash",
  },
  {
    id: "assets",
    name: "Fixed Assets",
    icon: Building2,
    status: "healthy",
    lastActivity: "2 days ago",
    pendingCount: 0,
    path: "/assets",
  },
  {
    id: "reporting",
    name: "Reporting",
    icon: PieChart,
    status: "healthy",
    lastActivity: "1 hr ago",
    pendingCount: 0,
    path: "/reports",
  },
];

// ========================================
// HELPER COMPONENTS
// ========================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants = {
    good: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
    neutral: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    healthy: "bg-emerald-500/10 text-emerald-600",
    attention: "bg-red-500/10 text-red-600",
  };

  const labels = {
    good: "Good",
    warning: "Warning",
    critical: "Critical",
    neutral: "Neutral",
    healthy: "Healthy",
    attention: "Attention",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border",
        variants[status as keyof typeof variants] || variants.neutral
      )}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

const TrendIndicator: React.FC<{ trend: string; change: number }> = ({ trend, change }) => {
  if (trend === "neutral" || change === 0) {
    return <Minus className="w-4 h-4 text-slate-400" />;
  }

  const isUp = trend === "up";
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? "text-emerald-600" : "text-red-600";

  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", color)}>
      <Icon className="w-3 h-3" />
      <span>{Math.abs(change)}%</span>
    </div>
  );
};

// ========================================
// LAYER 1: COMPANY HEALTH
// ========================================
const CompanyHealthLayer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {HEALTH_METRICS.map((metric) => (
        <button
          key={metric.id}
          onClick={() => metric.drillDownPath && navigate(metric.drillDownPath)}
          className={cn(
            "p-4 rounded-xl border bg-card text-left transition-all duration-200",
            "hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {metric.label}
            </span>
            <StatusBadge status={metric.status} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{metric.value}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TrendIndicator trend={metric.trend} change={metric.change} />
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </button>
      ))}
    </div>
  );
};

// ========================================
// LAYER 2: RISKS & ACTIONS
// ========================================
const RisksAndActionsLayer: React.FC = () => {
  const navigate = useNavigate();

  const getRiskIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "reconciliation":
        return <RefreshCw className="w-5 h-5 text-amber-500" />;
      case "compliance":
        return <Shield className="w-5 h-5 text-blue-500" />;
      case "cashflow":
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case "churn":
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500/30 bg-red-500/5";
      case "warning":
        return "border-amber-500/30 bg-amber-500/5";
      case "info":
        return "border-blue-500/30 bg-blue-500/5";
      default:
        return "border-border bg-muted/30";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {RISKS_AND_ACTIONS.map((risk) => (
        <div
          key={risk.id}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
            getSeverityStyles(risk.severity),
            "hover:shadow-sm"
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{getRiskIcon(risk.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm">{risk.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{risk.description}</p>
              </div>
              {risk.amount && (
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {risk.amount}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{risk.dueDate}</span>
                {risk.count && (
                  <>
                    <span className="text-border">|</span>
                    <span>{risk.count} items</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant={risk.severity === "critical" ? "default" : "outline"}
                onClick={() => navigate(risk.actionPath)}
                className="h-7 text-xs"
              >
                {risk.action}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ========================================
// LAYER 3: DRILL-DOWN MODULE ACCESS
// ========================================
const ModuleAccessLayer: React.FC = () => {
  const navigate = useNavigate();

  const getStatusIndicator = (status: string, pendingCount: number) => {
    if (pendingCount > 0) {
      return (
        <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {pendingCount}
        </span>
      );
    }

    if (status === "healthy") {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }

    return <AlertCircle className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {MODULE_STATUSES.map((module) => {
        const Icon = module.icon;
        return (
          <button
            key={module.id}
            onClick={() => navigate(module.path)}
            className={cn(
              "group p-4 rounded-xl border bg-card text-left transition-all duration-200",
              "hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              {getStatusIndicator(module.status, module.pendingCount)}
            </div>
            <h4 className="font-medium text-sm">{module.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {module.pendingCount > 0
                ? `${module.pendingCount} pending`
                : `Last activity ${module.lastActivity}`}
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ========================================
// MAIN EXECUTIVE COMMAND CENTER
// ========================================
export const ExecutiveCommandCenter: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "quarter">("month");

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Executive Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Company health, risks, and operational overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {(["today", "week", "month", "quarter"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    timeRange === range
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Custom Range
            </Button>
          </div>
        </div>

        {/* Layer 1: Company Health */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Layer 1: Company Health
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          <CompanyHealthLayer />
        </section>

        {/* Layer 2: Risks & Actions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Layer 2: Risks & Actions Needed
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge status="critical" />
              <span className="text-sm text-muted-foreground">1 Critical</span>
              <StatusBadge status="warning" />
              <span className="text-sm text-muted-foreground">2 Warnings</span>
            </div>
          </div>
          <RisksAndActionsLayer />
        </section>

        {/* Layer 3: Module Access */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-500" />
              Layer 3: Module Drill-Down
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
          <ModuleAccessLayer />
        </section>

        {/* Quick Actions Footer */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Quick Actions:</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Journal Entry
            </Button>
            <Button variant="outline" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveCommandCenter;
