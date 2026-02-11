import React from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Clock,
  Zap,
  Users,
  DollarSign,
  Shield,
} from "lucide-react";

interface DecisionPanel {
  id: string;
  insight: string;
  impact: string;
  action: string;
  priority: "high" | "medium" | "low";
  icon: React.ReactNode;
  metric?: string;
}

interface DecisionPanelsProps {
  panels?: DecisionPanel[];
  onAction?: (panelId: string) => void;
}

const defaultPanels: DecisionPanel[] = [
  {
    id: "cash-1",
    insight: "Cash runway dropped 12% this week",
    impact: "6 months runway remaining",
    action: "Review burn rate",
    priority: "high",
    icon: <TrendingDown className="w-5 h-5" />,
    metric: "12%",
  },
  {
    id: "payroll-1",
    insight: "Payroll exceeds 50% of revenue",
    impact: "Higher than industry standard",
    action: "Analyze staffing",
    priority: "medium",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "ar-1",
    insight: "Outstanding invoices: $89K",
    impact: "45 days average collection",
    action: "Send reminders",
    priority: "high",
    icon: <DollarSign className="w-5 h-5" />,
    metric: "$89K",
  },
  {
    id: "tax-1",
    insight: "Quarterly tax due in 14 days",
    impact: "Estimated: $24,500",
    action: "Prepare payment",
    priority: "medium",
    icon: <Clock className="w-5 h-5" />,
    metric: "14d",
  },
];

const priorityConfig = {
  high: {
    border: "border-rose-500/50",
    bg: "bg-rose-500/10",
    glow: "shadow-rose-500/20",
    icon: "text-rose-400",
  },
  medium: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
    icon: "text-amber-400",
  },
  low: {
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    glow: "shadow-blue-500/20",
    icon: "text-blue-400",
  },
};

export const DecisionPanels: React.FC<DecisionPanelsProps> = ({
  panels = defaultPanels,
  onAction,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Insights & Decisions
        </h3>
        <span className="text-xs text-slate-500">{panels.length} items</span>
      </div>

      <div className="space-y-3">
        {panels.map((panel) => {
          const config = priorityConfig[panel.priority];

          return (
            <div
              key={panel.id}
              className={cn(
                "group relative p-4 rounded-xl backdrop-blur-md border transition-all duration-300",
                "hover:scale-[1.02] cursor-pointer",
                config.border,
                config.bg,
                config.glow,
              )}
              onClick={() => onAction(panel.id)}
            >
              {/* Priority Indicator */}
              <div
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full",
                  panel.priority === "high"
                    ? "bg-rose-500"
                    : panel.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-blue-500",
                )}
              />

              <div className="flex items-start gap-4 pl-3">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-slate-800/50",
                    config.icon,
                  )}
                >
                  {panel.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 leading-snug">
                    {panel.insight}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{panel.impact}</p>

                  {/* Action Button */}
                  <button
                    className={cn(
                      "mt-3 flex items-center gap-2 text-xs font-medium transition-all duration-200",
                      "group-hover:gap-3",
                      panel.priority === "high"
                        ? "text-rose-400 hover:text-rose-300"
                        : panel.priority === "medium"
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-blue-400 hover:text-blue-300",
                    )}
                  >
                    {panel.action}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Metric Badge (if present) */}
                {panel.metric && (
                  <div className="flex-shrink-0">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold tabular-nums",
                        panel.priority === "high"
                          ? "bg-rose-500/20 text-rose-400"
                          : panel.priority === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400",
                      )}
                    >
                      {panel.metric}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DecisionPanels;
