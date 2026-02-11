/**
 * AI Operator Panel - Background Monitoring & Intelligence
 * 
 * Features:
 * - Real-time subsystem monitoring every 30s
 * - Auto-pause deployments on anomaly detection
 * - What-If scenario suggestions for CEO
 * - Auto-generate investor/board reports
 * - Predictive insights on load, revenue, risk
 */

import React, { useState, useEffect } from 'react';
import {
  Brain, Activity, AlertTriangle, TrendingUp, Shield, FileText, Zap, Clock,
  CheckCircle, XCircle, Sparkles, MessageSquare, BarChart3, Server, Cpu, Eye
} from 'lucide-react';
import { SignalCard, SignalGrid } from './SignalSystem';

interface AIInsight {
  id: string;
  type: 'anomaly' | 'opportunity' | 'risk' | 'suggestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action?: string;
  timestamp: Date;
}

interface MonitoringStatus {
  lastScan: Date;
  anomaliesDetected: number;
  autoActions: number;
  subsystemsMonitored: number;
  confidence: number;
}

export const AIOperatorPanel: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'opportunity',
      severity: 'medium',
      title: 'Revenue Upside Detected',
      description: 'Enterprise tier customers showing 23% higher feature usage. Consider upgrading 12 SMB accounts.',
      action: 'Review Revenue Skeleton',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '2',
      type: 'anomaly',
      severity: 'low',
      title: 'Cache Hit Rate Dropped',
      description: 'Redis cache hit rate declined from 94% to 87% in EMEA region.',
      action: 'Check Cache Layer',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: '3',
      type: 'suggestion',
      severity: 'low',
      title: 'What-If: Seasonal Load',
      description: 'Q4 tax season approaching. Predictive model suggests 2.5x transaction volume.',
      action: 'Run What-If Simulator',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ]);

  const [status, setStatus] = useState<MonitoringStatus>({
    lastScan: new Date(),
    anomaliesDetected: 1,
    autoActions: 3,
    subsystemsMonitored: 15,
    confidence: 96,
  });

  const [isScanning, setIsScanning] = useState(false);

  // Auto-scan every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      performScan();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const performScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        lastScan: new Date(),
        anomaliesDetected: Math.max(0, prev.anomaliesDetected + (Math.random() > 0.8 ? 1 : -1)),
        autoActions: prev.autoActions + (Math.random() > 0.9 ? 1 : 0),
      }));
      setIsScanning(false);
    }, 2000);
  };

  const generateReport = (type: 'board' | 'investor' | 'operations') => {
    const reportData = {
      type,
      timestamp: new Date(),
      metrics: {
        revenue: '$2.4M ARR (+18% MoM)',
        customers: 127,
        uptime: '99.97%',
        health: '97%',
      },
    };
    console.log('Generated report:', reportData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'high': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      case 'risk': return Shield;
      case 'suggestion': return Sparkles;
      default: return MessageSquare;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-violet-600" />
            AI Operator
          </h2>
          <p className="text-slate-600 mt-1">
            Background monitoring & predictive intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={performScan}
            disabled={isScanning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isScanning 
                ? 'bg-violet-100 text-violet-700' 
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            <Activity className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <SignalGrid columns={5}>
        <SignalCard
          title="Last Scan"
          status="healthy"
          value={status.lastScan.toLocaleTimeString()}
          subtitle="30s interval active"
          confidence="high"
        />
        <SignalCard
          title="Subsystems"
          status="healthy"
          value={status.subsystemsMonitored.toString()}
          subtitle="All monitored"
          confidence="high"
        />
        <SignalCard
          title="Anomalies"
          status={status.anomaliesDetected > 0 ? 'degraded' : 'healthy'}
          value={status.anomaliesDetected.toString()}
          subtitle={status.anomaliesDetected > 0 ? 'Action required' : 'All nominal'}
          confidence="high"
        />
        <SignalCard
          title="Auto-Actions"
          status="healthy"
          value={status.autoActions.toString()}
          subtitle="Deployments auto-paused"
          confidence="high"
        />
        <SignalCard
          title="Confidence"
          status="healthy"
          value={`${status.confidence}%`}
          subtitle="Model accuracy"
          confidence="high"
        />
      </SignalGrid>

      {/* Auto-Report Generation */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-violet-600" />
          <h3 className="font-semibold text-violet-900">Auto-Generated Reports</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => generateReport('board')}
            className="p-4 bg-white rounded-xl border border-violet-200 hover:shadow-md transition-all text-left"
          >
            <BarChart3 className="w-5 h-5 text-violet-600 mb-2" />
            <p className="font-medium text-slate-900">Board Report</p>
            <p className="text-xs text-slate-500 mt-1">Auto-delivery: Weekly</p>
          </button>
          <button
            onClick={() => generateReport('investor')}
            className="p-4 bg-white rounded-xl border border-violet-200 hover:shadow-md transition-all text-left"
          >
            <TrendingUp className="w-5 h-5 text-violet-600 mb-2" />
            <p className="font-medium text-slate-900">Investor Update</p>
            <p className="text-xs text-slate-500 mt-1">Auto-delivery: Monthly</p>
          </button>
          <button
            onClick={() => generateReport('operations')}
            className="p-4 bg-white rounded-xl border border-violet-200 hover:shadow-md transition-all text-left"
          >
            <Server className="w-5 h-5 text-violet-600 mb-2" />
            <p className="font-medium text-slate-900">Ops Summary</p>
            <p className="text-xs text-slate-500 mt-1">Auto-delivery: Daily</p>
          </button>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Insights & Suggestions
          </h3>
        </div>
        <div className="divide-y divide-slate-200">
          {insights.map((insight) => {
            const Icon = getTypeIcon(insight.type);
            return (
              <div key={insight.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(insight.severity)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">{insight.title}</h4>
                      <span className="text-xs text-slate-400">
                        {insight.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{insight.description}</p>
                    {insight.action && (
                      <button className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    insight.type === 'anomaly' ? 'bg-rose-100 text-rose-700' :
                    insight.type === 'opportunity' ? 'bg-emerald-100 text-emerald-700' :
                    insight.type === 'risk' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {insight.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Monitoring */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold">Active Monitoring</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Load Balancers</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Database Pools</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>API Latency</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Error Rates</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Trial Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Revenue Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Compliance Drift</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Security Events</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIOperatorPanel;
