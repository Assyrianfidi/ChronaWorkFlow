/**
 * Regions & Compliance Section
 * Multi-region status and jurisdiction controls
 */

import React from 'react';
import {
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  Shield,
  Lock,
  CreditCard,
  Users,
  Clock,
  Play,
  Pause,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { RegionStatus } from '../types';

const mockRegions: RegionStatus[] = [
  { id: '1', name: 'US East (N. Virginia)', code: 'us-east-1', status: 'active', version: '2.5.0-enterprise', compliance: { gdpr: false, soc2: true, hipaa: false, pci: true }, latency: 23, activeUsers: 4523 },
  { id: '2', name: 'US West (Oregon)', code: 'us-west-2', status: 'active', version: '2.5.0-enterprise', compliance: { gdpr: false, soc2: true, hipaa: false, pci: true }, latency: 35, activeUsers: 3211 },
  { id: '3', name: 'Europe (Ireland)', code: 'eu-west-1', status: 'active', version: '2.5.0-enterprise', compliance: { gdpr: true, soc2: true, hipaa: false, pci: true }, latency: 45, activeUsers: 2890 },
  { id: '4', name: 'Asia Pacific (Singapore)', code: 'ap-southeast-1', status: 'active', version: '2.4.9-enterprise', compliance: { gdpr: true, soc2: true, hipaa: false, pci: true }, latency: 78, activeUsers: 1567 },
  { id: '5', name: 'South America (São Paulo)', code: 'sa-east-1', status: 'maintenance', version: '2.5.0-enterprise', compliance: { gdpr: true, soc2: true, hipaa: false, pci: false }, latency: 120, activeUsers: 423 },
];

const complianceBadges = {
  gdpr: { name: 'GDPR', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  soc2: { name: 'SOC 2', icon: Lock, color: 'bg-emerald-100 text-emerald-700' },
  hipaa: { name: 'HIPAA', icon: Users, color: 'bg-violet-100 text-violet-700' },
  pci: { name: 'PCI DSS', icon: CreditCard, color: 'bg-amber-100 text-amber-700' },
};

export const RegionsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Multi-Region & Compliance</h2>
            <p className="text-blue-200">Global deployment status and jurisdiction controls</p>
          </div>
        </div>
      </div>

      {/* Region Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockRegions.map((region) => {
          const statusConfig = {
            active: { icon: CheckCircle, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
            paused: { icon: Pause, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
            maintenance: { icon: AlertTriangle, color: 'bg-rose-50 border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
          };
          const config = statusConfig[region.status];
          const StatusIcon = config.icon;

          return (
            <div key={region.id} className={`${config.color} border rounded-xl p-4`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className={`w-5 h-5 ${config.text}`} />
                  <h3 className="font-semibold text-slate-900">{region.name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                  {region.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Version</span>
                  <span className="font-mono font-medium text-slate-900">{region.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Latency</span>
                  <span className="font-medium text-slate-900">{region.latency}ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Active Users</span>
                  <span className="font-medium text-slate-900">{region.activeUsers.toLocaleString()}</span>
                </div>
              </div>

              {/* Compliance Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(region.compliance).map(([key, enabled]) => {
                  if (!enabled) return null;
                  const badge = complianceBadges[key as keyof typeof complianceBadges];
                  return (
                    <span key={key} className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} flex items-center gap-1`}>
                      <badge.icon className="w-3 h-3" />
                      {badge.name}
                    </span>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                  Deploy
                </button>
                <button className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                  {region.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Compliance Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(complianceBadges).map(([key, badge]) => (
            <div key={key} className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${badge.color}`}>
                <badge.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{badge.name}</p>
                <p className="text-sm text-slate-500">4/5 regions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
