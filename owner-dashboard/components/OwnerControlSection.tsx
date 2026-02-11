/**
 * Owner Control Section - Executive Command Center
 * Safety controls, deployments, feature flags with visual buttons
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  AlertOctagon,
  GitBranch,
  ArrowLeft,
  Pause,
  Rocket,
  ToggleLeft,
  ToggleRight,
  Percent,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Lock,
  Building2,
  Server,
  Target,
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { DeploymentInfo, FeatureFlagUI } from '../types';

// Mock deployment data
const mockDeployment: DeploymentInfo = {
  currentVersion: '2.5.0-enterprise',
  status: 'stable',
  canaries: [
    { region: 'us-east-1', percentage: 100, health: 'healthy' },
    { region: 'us-west-2', percentage: 100, health: 'healthy' },
    { region: 'eu-west-1', percentage: 75, health: 'healthy' },
    { region: 'ap-southeast-1', percentage: 25, health: 'healthy' },
  ],
};

// Mock feature flags
const mockFeatureFlags: FeatureFlagUI[] = [
  { id: '1', name: 'New Dashboard UI', description: 'Modernized dashboard interface', enabled: true, scope: 'GLOBAL', rolloutPercentage: 100, environments: ['production'], lastModified: new Date(), modifiedBy: 'CEO' },
  { id: '2', name: 'AI Bookkeeping', description: 'Automated transaction categorization', enabled: true, scope: 'COMPANY', rolloutPercentage: 85, environments: ['production'], lastModified: new Date(), modifiedBy: 'CTO' },
  { id: '3', name: 'Multi-Currency', description: 'Support for 50+ currencies', enabled: false, scope: 'GLOBAL', rolloutPercentage: 0, environments: ['staging'], lastModified: new Date(), modifiedBy: 'CEO' },
  { id: '4', name: 'Advanced Reporting', description: 'Custom report builder', enabled: true, scope: 'ROLE', rolloutPercentage: 50, environments: ['production'], lastModified: new Date(), modifiedBy: 'CFO' },
  { id: '5', name: 'API Rate Limiting', description: 'Enhanced API protection', enabled: true, scope: 'GLOBAL', rolloutPercentage: 100, environments: ['production'], lastModified: new Date(), modifiedBy: 'CTO' },
];

// Safety controls configuration
const safetyControls = [
  {
    id: 'freeze-all',
    label: 'Freeze All Writes',
    severity: 'critical' as const,
    icon: ShieldAlert,
    description: 'Immediately halt all write operations across the entire system.',
    impact: 'All users will be unable to create, update, or delete any data. Read operations continue normally.',
    confirmationText: 'FREEZE ALL WRITES',
    actionLabel: 'Freeze System',
  },
  {
    id: 'freeze-company',
    label: 'Freeze Writes (Per Company)',
    severity: 'warning' as const,
    icon: Shield,
    description: 'Selectively freeze write operations for a specific company.',
    impact: 'Only the selected company will be unable to write data. Other companies unaffected.',
    confirmationText: 'FREEZE COMPANY',
    actionLabel: 'Freeze Company',
  },
  {
    id: 'resume-writes',
    label: 'Resume Writes',
    severity: 'info' as const,
    icon: PlayCircle,
    description: 'Restore normal write operations.',
    impact: 'All write operations will resume immediately.',
    confirmationText: 'RESUME WRITES',
    actionLabel: 'Resume Operations',
  },
  {
    id: 'revert-safe',
    label: 'Revert to Safe State',
    severity: 'warning' as const,
    icon: RotateCcw,
    description: 'Rollback to last known stable configuration.',
    impact: 'System will revert to previous stable version. Some recent data may be lost.',
    confirmationText: 'REVERT TO SAFE',
    actionLabel: 'Revert Now',
  },
  {
    id: 'emergency-stop',
    label: 'Emergency Stop',
    severity: 'critical' as const,
    icon: AlertOctagon,
    description: 'IMMEDIATE SYSTEM SHUTDOWN - Use only in life-threatening scenarios.',
    impact: 'Complete system halt. All operations cease. Requires manual restart.',
    confirmationText: 'EMERGENCY STOP NOW',
    actionLabel: 'STOP SYSTEM',
  },
];

export const OwnerControlSection: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [flags, setFlags] = useState<FeatureFlagUI[]>(mockFeatureFlags);
  const [deployment, setDeployment] = useState<DeploymentInfo>(mockDeployment);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleSafetyAction = (controlId: string) => {
    console.log(`Executing safety control: ${controlId}`);
    // Wire to orchestrator
    setActiveModal(null);
  };

  const handleFlagToggle = (flagId: string) => {
    setFlags(prev => prev.map(f =>
      f.id === flagId ? { ...f, enabled: !f.enabled } : f
    ));
    // Wire to FeatureFlagService
  };

  const handleRolloutChange = (flagId: string, value: number) => {
    setFlags(prev => prev.map(f =>
      f.id === flagId ? { ...f, rolloutPercentage: value } : f
    ));
    // Wire to FeatureFlagService
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeployment(prev => ({ ...prev, status: 'deploying' }));
    // Wire to deployment orchestrator
    setTimeout(() => {
      setIsDeploying(false);
      setDeployment(prev => ({ ...prev, status: 'stable' }));
    }, 5000);
  };

  const handleRollback = () => {
    setDeployment(prev => ({ ...prev, status: 'rolling_back' }));
    // Wire to deployment orchestrator
    setTimeout(() => {
      setDeployment(prev => ({ ...prev, status: 'stable' }));
    }, 3000);
  };

  const activeControl = safetyControls.find(c => c.id === activeModal);

  return (
    <div className="space-y-8">
      {/* Safety Controls */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-orange-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900">Safety Controls</h3>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full font-medium">Owner Only</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">Critical system controls with full audit logging</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyControls.map((control) => {
              const Icon = control.icon;
              const colors = {
                critical: 'bg-rose-50 border-rose-200 hover:border-rose-300 text-rose-700',
                warning: 'bg-amber-50 border-amber-200 hover:border-amber-300 text-amber-700',
                info: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-700',
              };

              return (
                <button
                  key={control.id}
                  onClick={() => setActiveModal(control.id)}
                  className={`${colors[control.severity]} border rounded-xl p-4 text-left transition-all hover:shadow-md group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${control.severity === 'critical' ? 'bg-rose-100' : control.severity === 'warning' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                      <Icon className={`w-5 h-5 ${control.severity === 'critical' ? 'text-rose-600' : control.severity === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{control.label}</p>
                      <p className="text-sm opacity-80 mt-1">{control.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deployment Controller */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Deployment Controller</h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">Manage releases, canary deployments, and rollbacks</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <GitBranch className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Current Version</p>
                <p className="text-xl font-bold text-slate-900 font-mono">{deployment.currentVersion}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                deployment.status === 'stable' ? 'bg-emerald-100 text-emerald-700' :
                deployment.status === 'deploying' ? 'bg-blue-100 text-blue-700' :
                deployment.status === 'rolling_back' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {deployment.status === 'stable' ? 'Stable' :
                 deployment.status === 'deploying' ? 'Deploying...' :
                 deployment.status === 'rolling_back' ? 'Rolling Back...' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Canary Progress */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Canary Rollout Progress</h4>
            <div className="space-y-3">
              {deployment.canaries.map((canary) => (
                <div key={canary.region} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-slate-700">{canary.region}</span>
                  <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        canary.health === 'healthy' ? 'bg-emerald-500' :
                        canary.health === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${canary.percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm font-semibold text-slate-900">{canary.percentage}%</span>
                  <span className={`w-20 text-xs px-2 py-1 rounded-full text-center ${
                    canary.health === 'healthy' ? 'bg-emerald-100 text-emerald-700' :
                    canary.health === 'degraded' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {canary.health}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleDeploy}
              disabled={isDeploying || deployment.status !== 'stable'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Rocket className="w-4 h-4" />
              {isDeploying ? 'Deploying...' : 'Deploy New Version'}
            </button>
            <button
              onClick={handleRollback}
              disabled={deployment.status !== 'stable'}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Rollback (&lt;60s)
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
            >
              <Pause className="w-4 h-4" />
              Pause Rollout
            </button>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-2">
            <ToggleRight className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-900">Feature Flags</h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">Control feature rollouts across environments</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Feature</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rollout %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{flag.name}</p>
                        <p className="text-sm text-slate-500">{flag.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flag.scope === 'GLOBAL' ? 'bg-blue-100 text-blue-700' :
                        flag.scope === 'COMPANY' ? 'bg-violet-100 text-violet-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {flag.scope}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleFlagToggle(flag.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          flag.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={flag.rolloutPercentage}
                          onChange={(e) => handleRolloutChange(flag.id, parseInt(e.target.value))}
                          className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                        <span className="text-sm font-medium text-slate-700 w-10">{flag.rolloutPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleRolloutChange(flag.id, 0)}
                        disabled={!flag.enabled}
                        className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Disable Instantly
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {activeControl && (
        <ConfirmationModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          onConfirm={() => handleSafetyAction(activeControl.id)}
          title={activeControl.label}
          description={activeControl.description}
          impact={activeControl.impact}
          severity={activeControl.severity}
          confirmationText={activeControl.confirmationText}
          actionLabel={activeControl.actionLabel}
          ownerName="CEO"
        />
      )}
    </div>
  );
};
