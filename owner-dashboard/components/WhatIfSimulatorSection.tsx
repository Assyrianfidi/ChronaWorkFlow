/**
 * What-If Simulator Section
 * Interactive simulation panel with risk scoring
 */

import React, { useState } from 'react';
import {
  FlaskConical,
  Users,
  ArrowRightLeft,
  Globe,
  ToggleLeft,
  DollarSign,
  Play,
  Save,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Activity,
} from 'lucide-react';
import { WhatIfScenario } from '../types';

const initialScenario: WhatIfScenario = {
  id: '1',
  name: 'New Scenario',
  parameters: {
    users: 10000,
    transactions: 50000,
    regions: ['us-east-1', 'us-west-2'],
    features: ['new-dashboard'],
    pricingTier: 'professional',
  },
};

export const WhatIfSimulatorSection: React.FC = () => {
  const [scenario, setScenario] = useState<WhatIfScenario>(initialScenario);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    // Simulate API call
    setTimeout(() => {
      setScenario(prev => ({
        ...prev,
        results: {
          riskScore: scenario.parameters.users > 50000 ? 'high' : scenario.parameters.users > 20000 ? 'medium' : 'low',
          predictedLatency: Math.round(50 + scenario.parameters.transactions / 1000),
          financialImpact: Math.round(scenario.parameters.users * 50),
          complianceImpact: 'No compliance issues detected',
        },
      }));
      setIsSimulating(false);
      setShowResults(true);
    }, 2000);
  };

  const riskConfig = {
    low: { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
    medium: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
    high: { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', icon: AlertTriangle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">What-If Simulator</h2>
            <p className="text-violet-200">Test scenarios before deployment</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            Input Parameters
          </h3>

          <div className="space-y-6">
            {/* Users Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users className="w-4 h-4" />
                  Concurrent Users
                </label>
                <span className="text-sm font-semibold text-slate-900">{scenario.parameters.users.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={scenario.parameters.users}
                onChange={(e) => setScenario(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, users: parseInt(e.target.value) }
                }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1K</span>
                <span>100K</span>
              </div>
            </div>

            {/* Transactions Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transactions/Hour
                </label>
                <span className="text-sm font-semibold text-slate-900">{scenario.parameters.transactions.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={scenario.parameters.transactions}
                onChange={(e) => setScenario(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, transactions: parseInt(e.target.value) }
                }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>10K</span>
                <span>500K</span>
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                <Globe className="w-4 h-4" />
                Active Regions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'].map((region) => (
                  <button
                    key={region}
                    onClick={() => setScenario(prev => ({
                      ...prev,
                      parameters: {
                        ...prev.parameters,
                        regions: prev.parameters.regions.includes(region)
                          ? prev.parameters.regions.filter(r => r !== region)
                          : [...prev.parameters.regions, region]
                      }
                    }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scenario.parameters.regions.includes(region)
                        ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Tier */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                <DollarSign className="w-4 h-4" />
                Pricing Tier
              </label>
              <select
                value={scenario.parameters.pricingTier}
                onChange={(e) => setScenario(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, pricingTier: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-semibold"
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Simulation
                </>
              )}
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Simulation Results
          </h3>

          {!showResults ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <FlaskConical className="w-16 h-16 mb-4 opacity-30" />
              <p>Run a simulation to see results</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Risk Score */}
              {scenario.results && (
                <div className={`${riskConfig[scenario.results.riskScore].bg} rounded-xl p-4`}>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = riskConfig[scenario.results!.riskScore].icon;
                      return <Icon className={`w-8 h-8 ${riskConfig[scenario.results.riskScore].text}`} />;
                    })()}
                    <div>
                      <p className="text-sm text-slate-600">Risk Score</p>
                      <p className={`text-2xl font-bold ${riskConfig[scenario.results.riskScore].text}`}>
                        {scenario.results.riskScore.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Predicted Latency</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {scenario.results?.predictedLatency}ms
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Financial Impact</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    ${scenario.results?.financialImpact.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Compliance Impact */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Compliance Impact</span>
                </div>
                <p className="text-emerald-700">{scenario.results?.complianceImpact}</p>
              </div>

              {/* Convert to Deployment */}
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold">
                <Rocket className="w-4 h-4" />
                Convert to Deployment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
