/**
 * Executive Command Center Component
 * CEO Scoreboard, Health Index, and AI Alerts
 */

import React from 'react';
import { TrendingUp, TrendingDown, Users, CreditCard, Activity, AlertTriangle, Target } from 'lucide-react';
import { MetricCard, ProgressBar, Card } from './common';
import { mockSubscriptions, mockAIRecommendations } from '../data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ExecutiveCommandCenterProps {
  revenueData: any[];
  systemHealth: any;
}

export const ExecutiveCommandCenter: React.FC<ExecutiveCommandCenterProps> = ({ revenueData, systemHealth }) => {
  // Calculate metrics
  const totalMRR = mockSubscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.mrr, 0);
  const totalARR = totalMRR * 12;
  const activeCustomers = mockSubscriptions.filter(s => s.status === 'active').length;
  const churnRate = 2.1;
  const ltv = mockSubscriptions.reduce((sum, s) => sum + s.ltv, 0) / mockSubscriptions.length;
  const cac = 450;
  const ltvCacRatio = (ltv / cac).toFixed(1);

  // CEO Health Index (0-100)
  const healthScore = Math.round(
    (systemHealth.status === 'healthy' ? 30 : 15) +
    (totalMRR > 8000 ? 25 : 15) +
    (churnRate < 3 ? 20 : 10) +
    (activeCustomers > 4 ? 15 : 8) +
    (parseFloat(ltvCacRatio) > 3 ? 10 : 5)
  );

  // Get high priority AI alerts
  const highPriorityAlerts = mockAIRecommendations.filter(r => r.priority === 'high');

  return (
    <div className="space-y-6">
      {/* CEO Health Index */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">CEO Command Center</h2>
            <p className="text-slate-400">Real-time business intelligence & AI insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Health Index</p>
              <p className={`text-4xl font-bold ${healthScore >= 80 ? 'text-green-400' : healthScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {healthScore}/100
              </p>
            </div>
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${healthScore >= 80 ? 'border-green-400' : healthScore >= 60 ? 'border-yellow-400' : 'border-red-400'}`}>
              <span className="text-2xl font-bold">{healthScore}</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-slate-300">Monthly Revenue</p>
            <p className="text-2xl font-bold">${totalMRR.toLocaleString()}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12.5%
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-slate-300">Annual Run Rate</p>
            <p className="text-2xl font-bold">${totalARR.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Projected</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-slate-300">Active Customers</p>
            <p className="text-2xl font-bold">{activeCustomers}</p>
            <p className="text-xs text-blue-400">+3 this week</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-slate-300">Churn Rate</p>
            <p className="text-2xl font-bold">{churnRate}%</p>
            <p className="text-xs text-green-400">Target: &lt;5%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sm text-slate-300">LTV:CAC</p>
            <p className="text-2xl font-bold">{ltvCacRatio}x</p>
            <p className="text-xs text-green-400">Healthy &gt;3x</p>
          </div>
        </div>
      </div>

      {/* AI Alerts Section */}
      {highPriorityAlerts.length > 0 && (
        <Card title="AI-Powered Alerts" className="border-orange-200">
          <div className="space-y-3">
            {highPriorityAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      High Priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  <p className="text-sm font-medium text-orange-600 mt-1">{alert.impact}</p>
                  <button className="mt-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors">
                    {alert.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Revenue Trend Chart */}
      <Card title="Revenue Trends & Predictions">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value: any, name: string) => [name === 'predicted' ? `$${value} (Predicted)` : `$${value}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                name="Actual"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#10b981" 
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorPredicted)" 
                name="Predicted"
                strokeWidth={2}
              />
              <ReferenceLine x="Jun" stroke="#6b7280" strokeDasharray="3 3" label="Today" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Predictive analytics show continued growth trajectory through Q4 2026
        </p>
      </Card>
    </div>
  );
};
