/**
 * Top Status Bar Component
 * Always-visible system status indicators
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Shield,
  Clock,
  GitCommit,
} from 'lucide-react';
import { SystemStatus } from '../types';

interface TopStatusBarProps {
  status: SystemStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  status,
  onRefresh,
  isRefreshing,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      label: 'Healthy',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: 'Degraded',
    },
    critical: {
      icon: XCircle,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      label: 'Critical',
    },
  };

  const config = statusConfig[status.overall];
  const StatusIcon = config.icon;

  const formatUptime = (uptime: string) => {
    return uptime;
  };

  const formatLastUpdate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
      {/* Left: System Status */}
      <div className="flex items-center gap-4">
        {/* Overall Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border`}>
          <span className={`w-2.5 h-2.5 rounded-full ${config.color} animate-pulse`} />
          <StatusIcon className={`w-4 h-4 ${config.textColor}`} />
          <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
        </div>

        {/* Version Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
          <GitCommit className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-300 font-mono">v{status.version}</span>
        </div>

        {/* Certification Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">
            {status.certification.badge}
          </span>
          <span className="text-xs text-emerald-400/70">
            ({status.certification.passed}/{status.certification.tests})
          </span>
        </div>
      </div>

      {/* Right: Metrics & Actions */}
      <div className="flex items-center gap-4">
        {/* Uptime */}
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatUptime(status.uptime)}</span>
        </div>

        {/* Last Update */}
        <div className="flex items-center gap-2 text-slate-500">
          <Activity className="w-4 h-4" />
          <span className="text-xs">Updated: {formatLastUpdate(status.lastUpdate)}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
