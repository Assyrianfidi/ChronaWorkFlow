import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calculator,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  MessageSquare,
} from "lucide-react";

interface SuggestedAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: "primary" | "secondary" | "danger" | "warning";
  onClick: () => void;
}

interface Simulation {
  id: string;
  title: string;
  currentValue: string;
  projectedValue: string;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

interface Approval {
  id: string;
  title: string;
  amount?: string;
  deadline?: string;
  approver?: string;
  onApprove: () => void;
  onReject: () => void;
}

interface BottomControlStripProps {
  context: "overview" | "department" | "decision" | "priority";
  suggestedActions?: SuggestedAction[];
  simulations?: Simulation[];
  pendingApprovals?: Approval[];
  onActionClick: (actionId: string) => void;
}

const defaultActions: Record<string, SuggestedAction[]> = {
  overview: [
    {
      id: "refresh",
      label: "Refresh Data",
      icon: <RefreshCw className="w-4 h-4" />,
      variant: "secondary",
      onClick: () => {},
    },
    {
      id: "reports",
      label: "View Reports",
      icon: <Calculator className="w-4 h-4" />,
      variant: "secondary",
      onClick: () => {},
    },
    {
      id: "alert",
      label: "Alert Team",
      icon: <MessageSquare className="w-4 h-4" />,
      variant: "primary",
      onClick: () => {},
    },
  ],
  department: [
    {
      id: "details",
      label: "View Details",
      icon: <ArrowRight className="w-4 h-4" />,
      variant: "primary",
      onClick: () => {},
    },
    {
      id: "alert-dept",
      label: "Alert Department",
      icon: <MessageSquare className="w-4 h-4" />,
      variant: "warning",
      onClick: () => {},
    },
  ],
  decision: [
    {
      id: "simulate",
      label: "Run Simulation",
      icon: <Calculator className="w-4 h-4" />,
      variant: "secondary",
      onClick: () => {},
    },
    {
      id: "approve",
      label: "Approve Action",
      icon: <CheckCircle2 className="w-4 h-4" />,
      variant: "primary",
      onClick: () => {},
    },
    {
      id: "escalate",
      label: "Escalate",
      icon: <Zap className="w-4 h-4" />,
      variant: "warning",
      onClick: () => {},
    },
  ],
  priority: [
    {
      id: "quick-approve",
      label: "Quick Approve",
      icon: <CheckCircle2 className="w-4 h-4" />,
      variant: "primary",
      onClick: () => {},
    },
    {
      id: "review",
      label: "Review Details",
      icon: <ArrowRight className="w-4 h-4" />,
      variant: "secondary",
      onClick: () => {},
    },
    {
      id: "delegate",
      label: "Delegate",
      icon: <Shield className="w-4 h-4" />,
      variant: "secondary",
      onClick: () => {},
    },
  ],
};

const variantStyles = {
  primary:
    "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25",
  secondary:
    "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
  danger:
    "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25",
  warning:
    "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/25",
};

export const BottomControlStrip: React.FC<BottomControlStripProps> = ({
  context = "overview",
  suggestedActions,
  simulations,
  pendingApprovals,
  onActionClick,
}) => {
  const actions =
    suggestedActions || defaultActions[context] || defaultActions.overview;
  const hasSimulations = simulations && simulations.length > 0;
  const hasApprovals = pendingApprovals && pendingApprovals.length > 0;

  const shouldShow = hasSimulations || hasApprovals || actions.length > 0;

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300">
      <div className="bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Context Info */}
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Context
                </span>
                <span className="ml-2 text-sm font-medium text-slate-300 capitalize">
                  {context}
                </span>
              </div>

              {hasApprovals && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">
                    {pendingApprovals.length} pending approval
                    {pendingApprovals.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Center: Simulations */}
            {hasSimulations && (
              <div className="flex-1 flex items-center justify-center gap-4">
                {simulations.slice(0, 2).map((sim) => (
                  <div
                    key={sim.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg border backdrop-blur-sm",
                      sim.impact === "positive"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : sim.impact === "negative"
                          ? "bg-rose-500/10 border-rose-500/30"
                          : "bg-slate-800/50 border-slate-700",
                    )}
                  >
                    <div className="text-sm">
                      <span className="text-slate-400">{sim.title}:</span>
                      <span className="ml-2 font-medium text-slate-200">
                        {sim.currentValue}
                      </span>
                      <ArrowRight className="inline w-3 h-3 mx-2 text-slate-500" />
                      <span
                        className={cn(
                          "font-bold",
                          sim.impact === "positive"
                            ? "text-emerald-400"
                            : sim.impact === "negative"
                              ? "text-rose-400"
                              : "text-slate-300",
                        )}
                      >
                        {sim.projectedValue}
                      </span>
                    </div>
                    {sim.impact === "positive" && (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    )}
                    {sim.impact === "negative" && (
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Right: Quick Approvals (if any) */}
            {hasApprovals && (
              <div className="flex items-center gap-3">
                {pendingApprovals.slice(0, 1).map((approval) => (
                  <div key={approval.id} className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="text-slate-400">{approval.title}</span>
                      {approval.amount && (
                        <span className="ml-2 font-medium text-slate-200">
                          {approval.amount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={approval.onReject}
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={approval.onApprove}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Approve</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Far Right: Suggested Actions */}
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    onActionClick(action.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    variantStyles[action.variant],
                  )}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomControlStrip;
