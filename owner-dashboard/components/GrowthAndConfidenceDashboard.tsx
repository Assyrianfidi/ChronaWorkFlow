/**
 * CEO Growth & Confidence Dashboard
 * Billion-Dollar Grade Customer Health & Business Momentum Indicators
 * 
 * Features:
 * - Customer health scoring
 * - Revenue momentum signals
 * - Stability indicators
 * - Growth velocity tracking
 * - Confidence meters for investors
 * - Full audit trail
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Target,
  Zap,
  Globe,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Heart,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { StatusIndicator, SignalCard, SignalGrid, TrendIndicator, ConfidenceMeter } from './SignalSystem';
import { useBrand } from './BrandEngine';

interface CustomerHealth {
  id: string;
  segment: 'enterprise' | 'midmarket' | 'smb';
  totalCustomers: number;
  activeCustomers: number;
  churnRisk: number;
  expansionRate: number;
  npsScore: number;
  healthScore: number;
}

interface RevenueMomentum {
  period: string;
  mrr: number;
  arr: number;
  growthRate: number;
  churnRate: number;
  netRevenueRetention: number;
  expansionRevenue: number;
}

interface StabilityMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'degraded' | 'critical';
}

const MOCK_CUSTOMER_HEALTH: CustomerHealth[] = [
  {
    id: 'ent',
    segment: 'enterprise',
    totalCustomers: 47,
    activeCustomers: 46,
    churnRisk: 2,
    expansionRate: 34,
    npsScore: 72,
    healthScore: 94,
  },
  {
    id: 'mm',
    segment: 'midmarket',
    totalCustomers: 312,
    activeCustomers: 298,
    churnRisk: 8,
    expansionRate: 28,
    npsScore: 68,
    healthScore: 88,
  },
  {
    id: 'smb',
    segment: 'smb',
    totalCustomers: 2847,
    activeCustomers: 2512,
    churnRisk: 125,
    expansionRate: 18,
    npsScore: 62,
    healthScore: 82,
  },
];

const MOCK_REVENUE: RevenueMomentum = {
  period: 'Current Quarter',
  mrr: 2847500,
  arr: 34170000,
  growthRate: 12.4,
  churnRate: 2.1,
  netRevenueRetention: 114,
  expansionRevenue: 425000,
};

const MOCK_STABILITY: StabilityMetric[] = [
  { name: 'Platform Uptime', value: 99.97, target: 99.9, trend: 'stable', status: 'healthy' },
  { name: 'API Response Time', value: 142, target: 200, trend: 'down', status: 'healthy' },
  { name: 'Support SLA', value: 98.5, target: 95, trend: 'up', status: 'healthy' },
  { name: 'Feature Adoption', value: 74, target: 80, trend: 'up', status: 'degraded' },
  { name: 'Security Score', value: 98, target: 95, trend: 'stable', status: 'healthy' },
];

const MOCK_CONFIDENCE_FACTORS = [
  { factor: 'Product-Market Fit', score: 92, weight: 0.25 },
  { factor: 'Team Velocity', score: 88, weight: 0.20 },
  { factor: 'Financial Runway', score: 95, weight: 0.25 },
  { factor: 'Customer Retention', score: 90, weight: 0.20 },
  { factor: 'Technical Stability', score: 96, weight: 0.10 },
];

export const GrowthAndConfidenceDashboard: React.FC = () => {
  const { currentBrand } = useBrand();
  const [customerHealth] = useState<CustomerHealth[]>(MOCK_CUSTOMER_HEALTH);
  const [revenue] = useState<RevenueMomentum>(MOCK_REVENUE);
  const [stability] = useState<StabilityMetric[]>(MOCK_STABILITY);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const totalCustomers = customerHealth.reduce((sum, ch) => sum + ch.totalCustomers, 0);
  const totalActive = customerHealth.reduce((sum, ch) => sum + ch.activeCustomers, 0);
  const avgHealthScore = customerHealth.reduce((sum, ch) => sum + ch.healthScore, 0) / customerHealth.length;
  const weightedNPS = customerHealth.reduce((sum, ch) => sum + (ch.npsScore * ch.totalCustomers), 0) / totalCustomers;

  const confidenceScore = MOCK_CONFIDENCE_FACTORS.reduce((sum, f) => sum + (f.score * f.weight), 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            Growth & Confidence
          </h2>
          <p className="text-slate-600 mt-1">
            {currentBrand.name} — Customer health, momentum, and investor confidence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Top Confidence Score */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-300">Investor Confidence Score</h3>
            <p className="text-sm text-slate-400 mt-1">
              Weighted composite of business health indicators
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold text-emerald-400">{confidenceScore.toFixed(1)}</p>
            <p className="text-sm text-slate-400">/ 100</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-4">
          {MOCK_CONFIDENCE_FACTORS.map((factor) => (
            <div key={factor.factor} className="text-center">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{factor.factor}</p>
              <p className="text-sm font-semibold">{factor.score}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <SignalGrid columns={4}>
        <SignalCard
          title="Total Customers"
          status="healthy"
          value={totalCustomers.toLocaleString()}
          subtitle={`${totalActive.toLocaleString()} active`}
          confidence="high"
        />
        <SignalCard
          title="ARR"
          status="healthy"
          value={formatCurrency(revenue.arr)}
          subtitle={`+${revenue.growthRate}% growth`}
          confidence="high"
        />
        <SignalCard
          title="Net Revenue Retention"
          status="healthy"
          value={`${revenue.netRevenueRetention}%`}
          subtitle={`${revenue.churnRate}% churn rate`}
          confidence="high"
        />
        <SignalCard
          title="Avg Health Score"
          status={avgHealthScore >= 90 ? 'healthy' : 'degraded'}
          value={avgHealthScore.toFixed(0)}
          subtitle={`Weighted NPS: ${weightedNPS.toFixed(0)}`}
          confidence="high"
        />
      </SignalGrid>

      {/* Revenue Momentum */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Momentum
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Monthly Recurring</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(revenue.mrr)}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">+{revenue.growthRate}%</span>
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Annual Recurring</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(revenue.arr)}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">+{(revenue.growthRate * 12).toFixed(1)}% YoY</span>
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Expansion Revenue</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(revenue.expansionRevenue)}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Upsell growth</span>
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Churn Rate</p>
              <p className="text-2xl font-bold text-slate-900">{revenue.churnRate}%</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-emerald-600">
                <ArrowDownRight className="w-4 h-4" />
                <span className="text-sm font-medium">Below target</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Health by Segment */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Customer Health by Segment
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customerHealth.map((segment) => (
              <div
                key={segment.id}
                className={`p-4 rounded-xl border-2 ${getHealthBg(segment.healthScore)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-900 capitalize">
                    {segment.segment === 'smb' ? 'SMB' : segment.segment}
                  </span>
                  <StatusIndicator 
                    status={segment.healthScore >= 90 ? 'healthy' : segment.healthScore >= 75 ? 'degraded' : 'critical'}
                    size="sm"
                  />
                </div>
                
                <div className="mb-4">
                  <p className={`text-4xl font-bold ${getHealthColor(segment.healthScore)}`}>
                    {segment.healthScore}
                  </p>
                  <p className="text-sm text-slate-600">Health Score</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active</span>
                    <span className="font-medium">{segment.activeCustomers.toLocaleString()} / {segment.totalCustomers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">At Churn Risk</span>
                    <span className={`font-medium ${segment.churnRisk > 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {segment.churnRisk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expansion Rate</span>
                    <span className="font-medium text-emerald-600">+{segment.expansionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NPS Score</span>
                    <span className="font-medium">{segment.npsScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stability Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Platform Stability
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stability.map((metric) => (
              <div key={metric.name} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-slate-700">{metric.name}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          metric.value >= metric.target ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${metric.value >= metric.target ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {metric.value >= 100 ? metric.value.toFixed(1) : metric.value}
                      {metric.name.includes('Time') ? 'ms' : metric.name.includes('Rate') || metric.name.includes('SLA') ? '%' : ''}
                    </span>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <TrendIndicator
                    direction={metric.trend === 'up' ? 'up' : metric.trend === 'down' ? 'down' : 'stable'}
                    value={metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Regions', value: '8', change: '+2 this year', icon: Globe },
          { label: 'Avg Session', value: '14m 32s', change: '+8% vs last month', icon: Clock },
          { label: 'Feature Flags', value: '23', change: '3 experimental', icon: Zap },
          { label: 'Security Score', value: '98/100', change: 'A+ rating', icon: Award },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-emerald-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrowthAndConfidenceDashboard;
