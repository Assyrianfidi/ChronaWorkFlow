/**
 * CEO Dashboard Visual Enhancements
 * AI Operator - Strategic Step 6
 * 
 * - Regional risk meter widgets
 * - Color-coded regional heat maps
 * - One-click emergency rollback buttons
 * - Enhanced voice commands
 */

import React from 'react';
import { 
  Globe, AlertTriangle, Shield, Activity, Pause, RotateCcw, 
  Mic, TrendingUp, Users, Server, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

export interface RegionalRiskMeterProps {
  region: string;
  riskScore: number;
  status: 'safe' | 'medium' | 'high' | 'critical';
  onFreeze: () => void;
  onRollback: () => void;
}

export const RegionalRiskMeter: React.FC<RegionalRiskMeterProps> = ({
  region,
  riskScore,
  status,
  onFreeze,
  onRollback,
}) => {
  const getColor = () => {
    switch (status) {
      case 'safe': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'medium': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-slate-600" />
          <span className="font-semibold text-slate-900">{region}</span>
        </div>
        {getStatusIcon()}
      </div>

      {/* Risk Score Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-500">Risk Score</span>
          <span className={`font-bold ${
            status === 'safe' ? 'text-emerald-600' :
            status === 'medium' ? 'text-amber-600' :
            status === 'high' ? 'text-orange-600' : 'text-red-600'
          }`}>
            {riskScore}/100
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColor()} transition-all duration-500`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Safe</span>
          <span>Medium</span>
          <span>High</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onFreeze}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Pause className="w-4 h-4" />
          Freeze
        </button>
        <button
          onClick={onRollback}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Rollback
        </button>
      </div>
    </div>
  );
};

export interface RegionalHeatMapProps {
  regions: {
    name: string;
    status: 'safe' | 'medium' | 'high' | 'critical';
    riskScore: number;
    users: number;
    metrics: {
      cpu: number;
      memory: number;
      latency: number;
    };
  }[];
}

export const RegionalHeatMap: React.FC<RegionalHeatMapProps> = ({ regions }) => {
  const getColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-emerald-500/20 border-emerald-500';
      case 'medium': return 'bg-amber-500/20 border-amber-500';
      case 'high': return 'bg-orange-500/20 border-orange-500';
      case 'critical': return 'bg-red-500/20 border-red-500';
      default: return 'bg-slate-500/20 border-slate-500';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Regional Heat Map
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-slate-600">Safe</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span className="text-slate-600">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span className="text-slate-600">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-slate-600">Critical</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {regions.map((region) => (
          <div
            key={region.name}
            className={`p-4 rounded-xl border-2 ${getColor(region.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">{region.name}</span>
              <span className={`text-sm font-medium ${
                region.status === 'safe' ? 'text-emerald-700' :
                region.status === 'medium' ? 'text-amber-700' :
                region.status === 'high' ? 'text-orange-700' : 'text-red-700'
              }`}>
                {region.status.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Score</span>
                <span className="font-medium">{region.riskScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Users</span>
                <span className="font-medium">{region.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CPU</span>
                <span className="font-medium">{region.metrics.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Memory</span>
                <span className="font-medium">{region.metrics.memory.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latency</span>
                <span className="font-medium">{region.metrics.latency.toFixed(0)}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface VoiceCommandPanelProps {
  onCommand: (command: string) => void;
}

export const EnhancedVoiceCommands: React.FC<VoiceCommandPanelProps> = ({ onCommand }) => {
  const commands = [
    { phrase: 'Freeze APAC writes', action: 'FREEZE_APAC', icon: Pause },
    { phrase: 'Rollback EU deployment', action: 'ROLLBACK_EU', icon: RotateCcw },
    { phrase: 'Generate board report now', action: 'GENERATE_BOARD_REPORT', icon: TrendingUp },
    { phrase: 'Show regional status', action: 'SHOW_REGIONS', icon: Globe },
    { phrase: 'Emergency stop all', action: 'EMERGENCY_STOP', icon: AlertTriangle },
  ];

  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <Mic className="w-6 h-6 text-violet-400" />
        <h3 className="font-semibold">Voice Commands</h3>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.action}
              onClick={() => onCommand(cmd.action)}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left"
            >
              <Icon className="w-5 h-5 text-slate-400" />
              <span className="text-sm">"{cmd.phrase}"</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Export configuration for dashboard integration
export const DASHBOARD_ENHANCEMENTS = {
  regionalRiskMeters: {
    enabled: true,
    regions: ['US', 'EU', 'APAC'],
    refreshInterval: 30000, // 30s
  },
  regionalHeatMap: {
    enabled: true,
    showMetrics: true,
    colorCoding: true,
  },
  voiceCommands: {
    enabled: true,
    commands: [
      'Freeze APAC writes',
      'Rollback EU deployment',
      'Generate board report now',
      'Show regional status',
      'Emergency stop all',
    ],
  },
  emergencyControls: {
    enabled: true,
    oneClickRollback: true,
    confirmationRequired: true,
    responseTime: '<60s',
  },
};
