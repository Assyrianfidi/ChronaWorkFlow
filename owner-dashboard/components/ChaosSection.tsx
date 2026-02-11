/**
 * Chaos & Disaster Recovery Section
 * Visual scheduler for chaos tests and DR drills
 */

import React, { useState } from 'react';
import {
  Bomb,
  Calendar,
  Clock,
  Play,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  RotateCcw,
  Activity,
  TrendingUp,
  Zap,
  Server,
  Database,
  Wifi,
  Cpu,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ChaosTest, DRStatus } from '../types';

const mockChaosTests: ChaosTest[] = [
  { id: '1', name: 'Random Pod Failure', type: 'failure', schedule: 'weekly', lastRun: new Date(Date.now() - 604800000), lastResult: 'pass', enabled: true },
  { id: '2', name: 'Database Latency Spike', type: 'latency', schedule: 'weekly', lastRun: new Date(Date.now() - 518400000), lastResult: 'pass', enabled: true },
  { id: '3', name: 'CPU Exhaustion', type: 'cpu', schedule: 'monthly', lastRun: new Date(Date.now() - 2592000000), lastResult: 'pass', enabled: true },
  { id: '4', name: 'Memory Pressure', type: 'memory', schedule: 'monthly', lastRun: new Date(Date.now() - 2419200000), lastResult: 'fail', enabled: true },
  { id: '5', name: 'Network Partition', type: 'network', schedule: 'manual', lastRun: undefined, lastResult: undefined, enabled: false },
];

const mockDRStatus: DRStatus = {
  lastTest: new Date(Date.now() - 2592000000),
  lastRTO: 45,
  lastRPO: 5,
  passRate: 95,
  history: [
    { date: new Date(Date.now() - 2592000000), type: 'Full DR Drill', result: 'pass', rto: 45, rpo: 5 },
    { date: new Date(Date.now() - 5184000000), type: 'Partial Failover', result: 'pass', rto: 38, rpo: 3 },
    { date: new Date(Date.now() - 7776000000), type: 'Full DR Drill', result: 'pass', rto: 52, rpo: 7 },
    { date: new Date(Date.now() - 10368000000), type: 'Partial Failover', result: 'fail', rto: 120, rpo: 15 },
  ],
};

export const ChaosSection: React.FC = () => {
  const [tests, setTests] = useState<ChaosTest[]>(mockChaosTests);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const toggleTest = (testId: string) => {
    setTests(prev => prev.map(t =>
      t.id === testId ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const runTestNow = (testId: string) => {
    setIsRunningTest(true);
    // Wire to chaos orchestrator
    setTimeout(() => {
      setIsRunningTest(false);
    }, 3000);
  };

  const typeIcons = {
    failure: Bomb,
    latency: Clock,
    cpu: Cpu,
    memory: Database,
    network: Wifi,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Bomb className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Chaos & Disaster Recovery</h2>
            <p className="text-red-200">Resilience testing and recovery metrics</p>
          </div>
        </div>
      </div>

      {/* DR Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-600 mb-1">Last RTO</p>
          <p className="text-3xl font-bold text-emerald-700">{mockDRStatus.lastRTO}m</p>
          <p className="text-xs text-emerald-600">Recovery Time Objective</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-600 mb-1">Last RPO</p>
          <p className="text-3xl font-bold text-emerald-700">{mockDRStatus.lastRPO}m</p>
          <p className="text-xs text-emerald-600">Recovery Point Objective</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-600 mb-1">Pass Rate</p>
          <p className="text-3xl font-bold text-emerald-700">{mockDRStatus.passRate}%</p>
          <p className="text-xs text-emerald-600">Last 12 months</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 mb-1">Last DR Test</p>
          <p className="text-xl font-bold text-blue-700">{mockDRStatus.lastTest.toLocaleDateString()}</p>
          <p className="text-xs text-blue-600">30 days ago</p>
        </div>
      </div>

      {/* Chaos Test Scheduler */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Chaos Test Scheduler
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                Weekly: {tests.filter(t => t.schedule === 'weekly' && t.enabled).length} active
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Monthly: {tests.filter(t => t.schedule === 'monthly' && t.enabled).length} active
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {tests.map((test) => {
            const Icon = typeIcons[test.type];
            return (
              <div key={test.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${test.enabled ? 'bg-orange-100' : 'bg-slate-100'}`}>
                    <Icon className={`w-5 h-5 ${test.enabled ? 'text-orange-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{test.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="capitalize">{test.type}</span>
                      <span>•</span>
                      <span className="capitalize">{test.schedule}</span>
                      {test.lastRun && (
                        <>
                          <span>•</span>
                          <span>Last: {test.lastRun.toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {test.lastResult && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      test.lastResult === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {test.lastResult === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                  <button
                    onClick={() => toggleTest(test.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      test.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      test.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <button
                    onClick={() => runTestNow(test.id)}
                    disabled={isRunningTest || !test.enabled}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 disabled:opacity-50"
                  >
                    Run Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DR History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-blue-600" />
          DR Test History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Result</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">RTO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">RPO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockDRStatus.history.map((record, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{record.date.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{record.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.result === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {record.result.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{record.rto}m</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{record.rpo}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
          <Play className="w-4 h-4" />
          Run Chaos Test Now
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
          <FileText className="w-4 h-4" />
          Generate DR Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
          <Shield className="w-4 h-4" />
          Schedule DR Drill
        </button>
      </div>
    </div>
  );
};
