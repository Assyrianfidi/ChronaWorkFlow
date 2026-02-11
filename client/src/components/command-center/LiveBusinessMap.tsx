import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Users,
  Package,
  Briefcase,
  Cpu,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Activity,
} from "lucide-react";

interface DepartmentNode {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "healthy" | "warning" | "critical" | "attention";
  metric: string;
  metricLabel: string;
  trend: "up" | "down" | "stable";
  alertCount: number;
  position: { x: number; y: number };
  color: string;
}

interface LiveBusinessMapProps {
  onNodeClick: (departmentId: string) => void;
  activeDepartment: string | null;
}

const departments: DepartmentNode[] = [
  {
    id: "finance",
    name: "Finance",
    icon: <Wallet className="w-6 h-6" />,
    status: "healthy",
    metric: "$2.4M",
    metricLabel: "Cash on Hand",
    trend: "up",
    alertCount: 0,
    position: { x: 50, y: 20 },
    color: "emerald",
  },
  {
    id: "sales",
    name: "Sales",
    icon: <Users className="w-6 h-6" />,
    status: "attention",
    metric: "47",
    metricLabel: "Active Deals",
    trend: "up",
    alertCount: 2,
    position: { x: 75, y: 40 },
    color: "indigo",
  },
  {
    id: "operations",
    name: "Operations",
    icon: <Package className="w-6 h-6" />,
    status: "warning",
    metric: "89%",
    metricLabel: "Capacity",
    trend: "stable",
    alertCount: 1,
    position: { x: 50, y: 60 },
    color: "amber",
  },
  {
    id: "hr",
    name: "People",
    icon: <Briefcase className="w-6 h-6" />,
    status: "healthy",
    metric: "142",
    metricLabel: "Team Members",
    trend: "up",
    alertCount: 0,
    position: { x: 25, y: 40 },
    color: "violet",
  },
  {
    id: "tech",
    name: "Technology",
    icon: <Cpu className="w-6 h-6" />,
    status: "healthy",
    metric: "99.9%",
    metricLabel: "Uptime",
    trend: "stable",
    alertCount: 0,
    position: { x: 50, y: 40 },
    color: "cyan",
  },
];

const statusConfig = {
  healthy: {
    glow: "shadow-emerald-500/40",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    pulse: "bg-emerald-500",
    text: "text-emerald-400",
  },
  warning: {
    glow: "shadow-amber-500/40",
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    pulse: "bg-amber-500",
    text: "text-amber-400",
  },
  critical: {
    glow: "shadow-rose-500/60",
    border: "border-rose-500/70",
    bg: "bg-rose-500/20",
    pulse: "bg-rose-500",
    text: "text-rose-400",
  },
  attention: {
    glow: "shadow-indigo-500/40",
    border: "border-indigo-500/50",
    bg: "bg-indigo-500/10",
    pulse: "bg-indigo-500",
    text: "text-indigo-400",
  },
};

export const LiveBusinessMap: React.FC<LiveBusinessMapProps> = ({
  onNodeClick,
  activeDepartment,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center">
      {/* Connection Lines SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.3)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
          </linearGradient>
        </defs>
        {/* Central Tech Hub connections */}
        {departments
          .filter((d) => d.id !== "tech")
          .map((dept) => (
            <line
              key={`connection-${dept.id}`}
              x1={`${dept.position.x}%`}
              y1={`${dept.position.y}%`}
              x2="50%"
              y2="40%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
              className="animate-pulse"
            />
          ))}
      </svg>

      {/* Department Nodes */}
      {departments.map((dept) => {
        const status = statusConfig[dept.status];
        const isHovered = hoveredNode === dept.id;
        const isActive = activeDepartment === dept.id;

        return (
          <div
            key={dept.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${dept.position.x}%`,
              top: `${dept.position.y}%`,
            }}
            onMouseEnter={() => setHoveredNode(dept.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onNodeClick(dept.id)}
          >
            <div
              className={cn(
                "relative flex flex-col items-center cursor-pointer transition-all duration-500 ease-out",
                isHovered || isActive ? "scale-110" : "scale-100",
              )}
            >
              {/* Pulse Animation Ring */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl animate-ping opacity-20",
                  dept.status === "critical"
                    ? "bg-rose-500"
                    : dept.status === "warning"
                      ? "bg-amber-500"
                      : dept.status === "attention"
                        ? "bg-indigo-500"
                        : "bg-emerald-500",
                )}
                style={{
                  width: "120px",
                  height: "120px",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />

              {/* Main Node Container */}
              <div
                className={cn(
                  "relative w-24 h-24 rounded-2xl backdrop-blur-md border-2 flex flex-col items-center justify-center transition-all duration-300",
                  status.glow,
                  status.border,
                  status.bg,
                  isHovered || isActive ? "shadow-2xl" : "shadow-lg",
                  "hover:shadow-2xl",
                )}
              >
                {/* Status Indicator */}
                <div
                  className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950",
                    status.pulse,
                    dept.status === "critical" && "animate-pulse",
                  )}
                />

                {/* Alert Badge */}
                {dept.alertCount > 0 && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center animate-bounce">
                    {dept.alertCount}
                  </div>
                )}

                {/* Icon */}
                <div className={cn("mb-1", status.text)}>{dept.icon}</div>

                {/* Label */}
                <span className="text-xs font-medium text-slate-300">
                  {dept.name}
                </span>
              </div>

              {/* Metric Card (appears on hover/active) */}
              <div
                className={cn(
                  "absolute top-full mt-3 px-3 py-2 rounded-lg backdrop-blur-md border border-slate-700/50 bg-slate-900/80 transition-all duration-300",
                  isHovered || isActive
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 pointer-events-none",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tabular-nums">
                    {dept.metric}
                  </span>
                  <span className="text-xs text-slate-400">
                    {dept.metricLabel}
                  </span>
                  {dept.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : dept.trend === "down" ? (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Activity className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Center Hub Label */}
      <div className="absolute left-1/2 top-[40%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-4 h-4 rounded-full bg-slate-600/50 animate-pulse" />
      </div>
    </div>
  );
};

export default LiveBusinessMap;
