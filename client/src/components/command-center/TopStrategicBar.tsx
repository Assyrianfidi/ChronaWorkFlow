import React from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Shield,
  Lock,
  Radio,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";

interface TopStrategicBarProps {
  companyHealth: number;
  cashPosition: number;
  cashChange: number;
  activeAlerts: number;
  systemStatus: "healthy" | "warning" | "critical";
  onEmergencyStop: () => void;
  onLockSystem: () => void;
  onBroadcast: () => void;
}

const statusConfig = {
  healthy: {
    color: "bg-emerald-500",
    glow: "shadow-emerald-500/50",
    label: "All Systems Operational",
  },
  warning: {
    color: "bg-amber-500",
    glow: "shadow-amber-500/50",
    label: "Attention Required",
  },
  critical: {
    color: "bg-rose-500",
    glow: "shadow-rose-500/50",
    label: "Critical Alert",
  },
};

export const TopStrategicBar: React.FC<TopStrategicBarProps> = ({
  companyHealth,
  cashPosition,
  cashChange,
  activeAlerts,
  systemStatus,
  onEmergencyStop,
  onLockSystem,
  onBroadcast,
}) => {
  const status = statusConfig[systemStatus];
  const isPositiveChange = cashChange >= 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Health & Cash */}
        <div className="flex items-center gap-8">
          {/* Company Health Score */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-3 h-3 rounded-full animate-pulse shadow-lg",
                status.color,
                status.glow,
              )}
            />
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Health Score
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    companyHealth >= 80
                      ? "text-emerald-400"
                      : companyHealth >= 60
                        ? "text-amber-400"
                        : "text-rose-400",
                  )}
                >
                  {companyHealth}
                </span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
            </div>
          </div>

          <div className="w-px h-10 bg-slate-800" />

          {/* Live Cash Position */}
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              Cash Position
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                ${cashPosition.toLocaleString()}
              </span>
              <span
                className={cn(
                  "flex items-center text-sm font-medium",
                  isPositiveChange ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {isPositiveChange ? "+" : ""}
                {cashChange}%
              </span>
            </div>
          </div>

          <div className="w-px h-10 bg-slate-800" />

          {/* Active Alerts */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                activeAlerts > 0
                  ? "bg-rose-500/20 text-rose-400 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-400",
              )}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Alerts
              </span>
              <p
                className={cn(
                  "text-lg font-semibold",
                  activeAlerts > 0 ? "text-rose-400" : "text-emerald-400",
                )}
              >
                {activeAlerts}
              </p>
            </div>
          </div>
        </div>

        {/* Right: System Status & Quick Actions */}
        <div className="flex items-center gap-6">
          {/* System Status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <Radio
              className={cn("w-4 h-4", status.color.replace("bg-", "text-"))}
            />
            <span className="text-sm text-slate-300">{status.label}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEmergencyStop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-200 group"
            >
              <Zap className="w-4 h-4 group-hover:animate-pulse" />
              <span className="text-sm font-medium">Emergency Stop</span>
            </button>

            <button
              onClick={onLockSystem}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all duration-200"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Lock</span>
            </button>

            <button
              onClick={onBroadcast}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopStrategicBar;
