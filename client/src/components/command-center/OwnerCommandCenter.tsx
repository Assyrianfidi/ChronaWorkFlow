import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TopStrategicBar } from "./TopStrategicBar";
import { LiveBusinessMap } from "./LiveBusinessMap";
import { DecisionPanels } from "./DecisionPanels";
import { PriorityStack } from "./PriorityStack";
import { BottomControlStrip } from "./BottomControlStrip";
import {
  X,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface CommandCenterProps {
  className?: string;
}

type ViewMode = "overview" | "department" | "decision" | "priority";

interface DepartmentView {
  id: string;
  name: string;
  status: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "stable" }[];
  alerts: string[];
  actions: { label: string; onClick: () => void }[];
}

export const OwnerCommandCenter: React.FC<CommandCenterProps> = ({
  className,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mock data - in production, this would come from APIs
  const healthData = {
    companyHealth: 87,
    cashPosition: 2450000,
    cashChange: 12,
    activeAlerts: 3,
    systemStatus: "healthy" as const,
  };

  const handleEmergencyStop = () => {
    toast.error("Emergency Stop Activated", {
      description: "All non-critical operations have been suspended.",
      duration: 5000,
    });
  };

  const handleLockSystem = () => {
    toast.info("System Locked", {
      description: "Administrative access restricted to owners only.",
    });
  };

  const handleBroadcast = () => {
    toast.success("Broadcast Ready", {
      description: "Message composer opened.",
    });
  };

  const handleNodeClick = (departmentId: string) => {
    setActiveDepartment(departmentId);
    setViewMode("department");
    toast.info(`Viewing ${departmentId.toUpperCase()} Department`, {
      description: "Click the map to return to overview.",
    });
  };

  const handleDecisionAction = (panelId: string) => {
    setViewMode("decision");
    toast.info("Decision Mode Active", {
      description: "Review the impact before proceeding.",
    });
  };

  const handlePriorityClick = (itemId: string) => {
    setViewMode("priority");
    toast.info("Priority Item Selected", {
      description: "Review details in the control strip below.",
    });
  };

  const handlePriorityDismiss = (itemId: string) => {
    toast.success("Item Dismissed", {
      description: "Removed from your priority stack.",
    });
  };

  const handlePriorityResolve = (itemId: string) => {
    toast.success("Item Resolved", {
      description: "Great work! Moving to next priority.",
    });
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setActiveDepartment(null);
  };

  const handleActionClick = (actionId: string) => {
    toast.success(`Action: ${actionId}`, {
      description: "Command executed successfully.",
    });
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-slate-950 transition-all duration-500",
        isFullscreen ? "fixed inset-0 z-50" : "relative",
        className,
      )}
    >
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Subtle Grid Pattern */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Top Strategic Bar */}
      <TopStrategicBar
        {...healthData}
        onEmergencyStop={handleEmergencyStop}
        onLockSystem={handleLockSystem}
        onBroadcast={handleBroadcast}
      />

      {/* Main Command Canvas */}
      <div className="pt-20 pb-24 px-6 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {/* View Navigation (only when not in overview) */}
          {viewMode !== "overview" && (
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Command Center</span>
              </button>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="capitalize">{viewMode}</span>
                {activeDepartment && (
                  <>
                    <span>/</span>
                    <span className="text-slate-300 capitalize">
                      {activeDepartment}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Decision Panels */}
            <div className="col-span-3 space-y-6">
              <DecisionPanels onAction={handleDecisionAction} />
            </div>

            {/* Center: Live Business Map */}
            <div
              className={cn(
                "col-span-6 transition-all duration-500",
                viewMode !== "overview" && "col-span-9",
              )}
            >
              {viewMode === "overview" ? (
                <div className="h-[600px] rounded-2xl bg-slate-900/30 border border-slate-800/50 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      Live Business Map
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <Maximize2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <LiveBusinessMap
                    onNodeClick={handleNodeClick}
                    activeDepartment={activeDepartment}
                  />
                </div>
              ) : (
                <DepartmentDetailView
                  departmentId={activeDepartment}
                  onBack={handleBackToOverview}
                />
              )}
            </div>

            {/* Right: Priority Stack */}
            {viewMode === "overview" && (
              <div className="col-span-3">
                <PriorityStack
                  onItemClick={handlePriorityClick}
                  onDismiss={handlePriorityDismiss}
                  onResolve={handlePriorityResolve}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Control Strip */}
      <BottomControlStrip
        context={viewMode}
        onActionClick={handleActionClick}
        simulations={[
          {
            id: "sim-1",
            title: "Cash Impact",
            currentValue: "$2.45M",
            projectedValue: "$2.38M",
            impact: "negative",
            description: "After pending approvals",
          },
          {
            id: "sim-2",
            title: "Runway",
            currentValue: "18 mo",
            projectedValue: "17 mo",
            impact: "negative",
            description: "If all Q1 expenses approved",
          },
        ]}
        pendingApprovals={[
          {
            id: "app-1",
            title: "Ops Budget Increase",
            amount: "$45,000",
            deadline: "Today",
            onApprove: () => toast.success("Approved"),
            onReject: () => toast.error("Rejected"),
          },
        ]}
      />
    </div>
  );
};

// Department Detail View Component
interface DepartmentDetailViewProps {
  departmentId: string | null;
  onBack: () => void;
}

const DepartmentDetailView: React.FC<DepartmentDetailViewProps> = ({
  departmentId,
  onBack,
}) => {
  if (!departmentId) return null;

  const departmentData: Record<string, DepartmentView> = {
    finance: {
      id: "finance",
      name: "Finance",
      status: "healthy",
      metrics: [
        { label: "Cash on Hand", value: "$2.4M", trend: "up" },
        { label: "Monthly Burn", value: "$145K", trend: "stable" },
        { label: "Runway", value: "16 months", trend: "up" },
        { label: "AR Aging", value: "32 days", trend: "down" },
      ],
      alerts: [],
      actions: [
        { label: "View Cash Flow", onClick: () => {} },
        { label: "Run Forecast", onClick: () => {} },
        { label: "Alert CFO", onClick: () => {} },
      ],
    },
    sales: {
      id: "sales",
      name: "Sales",
      status: "attention",
      metrics: [
        { label: "Active Deals", value: "47", trend: "up" },
        { label: "Pipeline", value: "$890K", trend: "up" },
        { label: "Close Rate", value: "24%", trend: "down" },
        { label: "Avg Deal", value: "$19K", trend: "stable" },
      ],
      alerts: ["2 deals stalled > 30 days"],
      actions: [
        { label: "Review Pipeline", onClick: () => {} },
        { label: "Alert Sales Lead", onClick: () => {} },
      ],
    },
    operations: {
      id: "operations",
      name: "Operations",
      status: "warning",
      metrics: [
        { label: "Capacity", value: "89%", trend: "up" },
        { label: "Efficiency", value: "94%", trend: "stable" },
        { label: "Backlog", value: "12 items", trend: "up" },
        { label: "Quality Score", value: "98%", trend: "stable" },
      ],
      alerts: ["Capacity approaching limit"],
      actions: [
        { label: "Review Capacity", onClick: () => {} },
        { label: "Allocate Resources", onClick: () => {} },
      ],
    },
    hr: {
      id: "hr",
      name: "People",
      status: "healthy",
      metrics: [
        { label: "Team Size", value: "142", trend: "up" },
        { label: "Open Roles", value: "8", trend: "down" },
        { label: "Retention", value: "96%", trend: "up" },
        { label: "Engagement", value: "87%", trend: "stable" },
      ],
      alerts: [],
      actions: [
        { label: "View Org Chart", onClick: () => {} },
        { label: "Review Promotions", onClick: () => {} },
      ],
    },
    tech: {
      id: "tech",
      name: "Technology",
      status: "healthy",
      metrics: [
        { label: "Uptime", value: "99.9%", trend: "stable" },
        { label: "Response", value: "45ms", trend: "up" },
        { label: "Deploys", value: "23/day", trend: "up" },
        { label: "Incidents", value: "0", trend: "stable" },
      ],
      alerts: [],
      actions: [
        { label: "System Status", onClick: () => {} },
        { label: "View Logs", onClick: () => {} },
      ],
    },
  };

  const data = departmentData[departmentId];
  if (!data) return null;

  return (
    <div className="h-[600px] rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{data.name}</h2>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                data.status === "healthy"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : data.status === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-indigo-500/20 text-indigo-400",
              )}
            >
              {data.status === "healthy"
                ? "Healthy"
                : data.status === "warning"
                  ? "Warning"
                  : "Needs Attention"}
            </span>
            {data.alerts.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                {data.alerts[0]}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {data.metrics.map((metric, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          >
            <p className="text-sm text-slate-500 mb-1">{metric.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                {metric.value}
              </span>
              {metric.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : metric.trend === "down" ? (
                <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />
              ) : (
                <Activity className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 mr-2">Quick Actions:</span>
        {data.actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all text-sm font-medium"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OwnerCommandCenter;
