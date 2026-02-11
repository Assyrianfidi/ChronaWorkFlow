/**
 * Overview Section - System Health Dashboard
 * Visual cards with gauges, subsystem grid, and drill-down modals
 */

import React, { useState } from 'react';
import {
  Activity,
  Server,
  Database,
  Shield,
  Lock,
  Clock,
  FileText,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Power,
  Ban,
  ChevronRight,
  X,
  Terminal,
} from 'lucide-react';
import { SystemHealthGauge, Sparkline } from './SystemHealthGauge';
import { SubsystemStatus } from '../types';

// Mock data for subsystems
const mockSubsystems: SubsystemStatus[] = [
  { id: '1', name: 'API Gateway', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 98, metrics: { cpu: 45, memory: 62, latency: 23 } },
  { id: '2', name: 'Auth Service', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 99, metrics: { cpu: 32, memory: 45, latency: 12 } },
  { id: '3', name: 'Database Primary', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 97, metrics: { cpu: 55, memory: 78, latency: 5 } },
  { id: '4', name: 'Database Replica', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 96, metrics: { cpu: 48, memory: 72, latency: 8 } },
  { id: '5', name: 'Redis Cache', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 99, metrics: { cpu: 25, memory: 85, latency: 2 } },
  { id: '6', name: 'Message Queue', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 98, metrics: { cpu: 38, memory: 55, latency: 15 } },
  { id: '7', name: 'Payment Processor', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 100, metrics: { cpu: 28, memory: 42, latency: 180 } },
  { id: '8', name: 'Email Service', status: 'DEGRADED', lastHeartbeat: new Date(Date.now() - 120000), healthScore: 72, metrics: { cpu: 78, memory: 88, latency: 2500 } },
  { id: '9', name: 'Reporting Engine', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 94, metrics: { cpu: 65, memory: 70, latency: 450 } },
  { id: '10', name: 'Audit Logger', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 99, metrics: { cpu: 15, memory: 35, latency: 8 } },
  { id: '11', name: 'AI/ML Pipeline', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 95, metrics: { cpu: 82, memory: 90, latency: 1200 } },
  { id: '12', name: 'Backup Service', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 98, metrics: { cpu: 20, memory: 30, latency: 50 } },
  { id: '13', name: 'Search Index', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 97, metrics: { cpu: 42, memory: 68, latency: 35 } },
  { id: '14', name: 'Notification Hub', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 96, metrics: { cpu: 35, memory: 52, latency: 28 } },
  { id: '15', name: 'Webhook Handler', status: 'ONLINE', lastHeartbeat: new Date(), healthScore: 99, metrics: { cpu: 30, memory: 48, latency: 18 } },
];

// Sparkline data for error rate
const errorRateData = [0.1, 0.2, 0.1, 0.3, 0.2, 0.4, 0.3, 0.2, 0.1, 0.2, 0.1, 0.2];
const latencyP50Data = [45, 48, 46, 52, 49, 47, 50, 48, 46, 45, 44, 47];
const latencyP95Data = [120, 125, 118, 140, 132, 128, 135, 130, 125, 122, 120, 118];

interface SubsystemModalProps {
  subsystem: SubsystemStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onRestart: (id: string) => void;
  onDisable: (id: string) => void;
}

const SubsystemModal: React.FC<SubsystemModalProps> = ({
  subsystem,
  isOpen,
  onClose,
  onRestart,
  onDisable,
}) => {
  if (!isOpen || !subsystem) return null;

  const statusConfig = {
    ONLINE: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    DEGRADED: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    OFFLINE: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  };

  const config = statusConfig[subsystem.status];
  const StatusIcon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`${config.bg} ${config.border} border-b px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
            <h3 className="text-xl font-bold text-slate-900">{subsystem.name}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.color} border ${config.border}`}>
              {subsystem.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Health Score */}
          <div className="flex items-center gap-4">
            <div className={`w-24 h-24 rounded-full ${subsystem.healthScore >= 80 ? 'bg-emerald-100 border-emerald-400' : subsystem.healthScore >= 60 ? 'bg-amber-100 border-amber-400' : 'bg-rose-100 border-rose-400'} border-4 flex items-center justify-center`}>
              <span className={`text-3xl font-bold ${subsystem.healthScore >= 80 ? 'text-emerald-700' : subsystem.healthScore >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                {subsystem.healthScore}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Health Score</p>
              <p className="text-lg font-semibold text-slate-900">
                {subsystem.healthScore >= 80 ? 'Excellent' : subsystem.healthScore >= 60 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">CPU Usage</p>
              <p className="text-2xl font-bold text-slate-900">{subsystem.metrics.cpu}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">Memory</p>
              <p className="text-2xl font-bold text-slate-900">{subsystem.metrics.memory}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">Latency</p>
              <p className="text-2xl font-bold text-slate-900">{subsystem.metrics.latency}ms</p>
            </div>
          </div>

          {/* Last Heartbeat */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Last heartbeat: {subsystem.lastHeartbeat.toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => onRestart(subsystem.id)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Restart Service
            </button>
            <button
              onClick={() => onDisable(subsystem.id)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-medium"
            >
              <Ban className="w-4 h-4" />
              Disable (Owner Only)
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium ml-auto">
              <Terminal className="w-4 h-4" />
              View Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OverviewSection: React.FC = () => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubsystemClick = (subsystem: SubsystemStatus) => {
    setSelectedSubsystem(subsystem);
    setIsModalOpen(true);
  };

  const handleRestart = (id: string) => {
    console.log(`Restarting subsystem ${id}`);
    // Wire to orchestrator
  };

  const handleDisable = (id: string) => {
    console.log(`Disabling subsystem ${id}`);
    // Wire to orchestrator with confirmation
  };

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => console.log('CPU drill-down')}
        >
          <SystemHealthGauge
            value={42.5}
            label="CPU Usage"
            icon="cpu"
            warningThreshold={70}
            criticalThreshold={90}
          />
        </div>
        <div
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => console.log('Memory drill-down')}
        >
          <SystemHealthGauge
            value={68.2}
            label="Memory Usage"
            icon="memory"
            warningThreshold={80}
            criticalThreshold={95}
          />
        </div>
        <div
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => console.log('Latency drill-down')}
        >
          <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-blue-600">47<span className="text-sm">ms</span></p>
              <p className="text-xs text-blue-500">P50</p>
              <Sparkline data={latencyP50Data} color="#3b82f6" height={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 font-medium">Latency (P50)</p>
              <p className="text-xs text-slate-400">P95: 128ms</p>
            </div>
          </div>
        </div>
        <div
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => console.log('Error rate drill-down')}
        >
          <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-emerald-600">0.2<span className="text-sm">%</span></p>
              <Sparkline data={errorRateData} color="#10b981" height={20} threshold={0.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 font-medium">Error Rate</p>
              <p className="text-xs text-slate-400">Threshold: 0.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* TB Integrity & Data Integrity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">TB Integrity</p>
            <p className="text-sm text-emerald-700">All trial balances verified and balanced</p>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">Data Integrity</p>
            <p className="text-sm text-emerald-700">Zero data corruption detected</p>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      {/* Subsystems Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Subsystems (15/15 Online)</h3>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {mockSubsystems.map((subsystem) => {
              const statusColors = {
                ONLINE: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
                DEGRADED: 'bg-amber-50 border-amber-200 hover:border-amber-300',
                OFFLINE: 'bg-rose-50 border-rose-200 hover:border-rose-300',
              };
              const statusIcon = {
                ONLINE: CheckCircle,
                DEGRADED: AlertTriangle,
                OFFLINE: XCircle,
              };
              const StatusIcon = statusIcon[subsystem.status];

              return (
                <button
                  key={subsystem.id}
                  onClick={() => handleSubsystemClick(subsystem)}
                  className={`${statusColors[subsystem.status]} border rounded-xl p-3 text-left transition-all hover:shadow-md group`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <StatusIcon className={`w-4 h-4 ${subsystem.status === 'ONLINE' ? 'text-emerald-600' : subsystem.status === 'DEGRADED' ? 'text-amber-600' : 'text-rose-600'}`} />
                    <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="font-medium text-slate-900 text-sm truncate">{subsystem.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {subsystem.lastHeartbeat.toLocaleTimeString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors">
          <Activity className="w-4 h-4" />
          View System Metrics
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors">
          <FileText className="w-4 h-4" />
          Download Health Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors">
          <Database className="w-4 h-4" />
          Database Status
        </button>
      </div>

      {/* Modal */}
      <SubsystemModal
        subsystem={selectedSubsystem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRestart={handleRestart}
        onDisable={handleDisable}
      />
    </div>
  );
};
