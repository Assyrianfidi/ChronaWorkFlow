/**
 * Revenue & Financial Insights Component
 * Detailed financial metrics, cash flow, and scenario simulation
 */

import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, Calculator, PieChart as PieChartIcon } from 'lucide-react';
import { MetricCard, Card, ProgressBar } from './common';
import { mockRevenueData, mockPlanData, mockSubscriptions } from '../data';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export const RevenueDashboard: React.FC = () => {
  const [scenarioPrice, setScenarioPrice] = useState(10);
  const [scenarioPlan, setScenarioPlan] = useState('Professional');

  // Financial calculations
  const totalMRR = mockSubscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.mrr, 0);
  const totalARR = totalMRR * 12;
  const avgRevenuePerUser = totalMRR / mockSubscriptions.filter(s => s.status === 'active').length;
  
  // Cash runway calculation (assuming $50K burn rate)
  const monthlyBurn = 5000;
  const runwayMonths = Math.floor(totalMRR / monthlyBurn);
  
  // Scenario simulation
  const targetPlan = mockPlanData.find(p => p.name === scenarioPlan);
  const currentPlanPrice = scenarioPlan === 'Starter' ? 29 : scenarioPlan === 'Professional' ? 79 : 199;
  const newPrice = currentPlanPrice * (1 + scenarioPrice / 100);
  const planCustomers = mockSubscriptions.filter(s => s.plan === scenarioPlan && s.status === 'active').length;
  const revenueChange = planCustomers * (newPrice - currentPlanPrice);
  const percentChange = ((newPrice - currentPlanPrice) / currentPlanPrice * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${totalMRR.toLocaleString()}`}
          subtitle="+8.2% from last month"
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
          trend="up"
          trendValue="+$640"
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={`$${totalARR.toLocaleString()}`}
          subtitle="Projected for 2026"
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          trend="up"
          trendValue="+12.5%"
        />
        <MetricCard
          title="Average Revenue/User"
          value={`$${avgRevenuePerUser.toFixed(0)}`}
          subtitle="Per customer monthly"
          icon={<PieChartIcon className="w-5 h-5" />}
          color="purple"
          trend="up"
          trendValue="+$12"
        />
        <MetricCard
          title="Cash Runway"
          value={`${runwayMonths} months`}
          subtitle={`Burn: $${monthlyBurn.toLocaleString()}/mo`}
          icon={<Wallet className="w-5 h-5" />}
          color={runwayMonths > 12 ? 'green' : runwayMonths > 6 ? 'yellow' : 'red'}
          trend={runwayMonths > 12 ? 'up' : 'down'}
          trendValue={runwayMonths > 12 ? 'Healthy' : 'Attention needed'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card title="Revenue by Plan" action={<span className="text-sm text-gray-500">Last 12 months</span>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockPlanData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockPlanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {mockPlanData.map((plan) => (
              <div key={plan.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">${plan.revenue.toLocaleString()}/mo</span>
                  <span className="text-gray-500 text-sm ml-2">({plan.value} customers)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Revenue Trend */}
        <Card title="Monthly Revenue Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                    if (name === 'subscriptions') return [value, 'Subscriptions'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="subscriptions" fill="#10b981" name="Subscriptions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Scenario Simulator */}
      <Card title="Pricing Scenario Simulator" className="border-purple-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
              <select
                value={scenarioPlan}
                onChange={(e) => setScenarioPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Starter">Starter ($29/mo)</option>
                <option value="Professional">Professional ($79/mo)</option>
                <option value="Enterprise">Enterprise ($199/mo)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Increase: {scenarioPrice}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={scenarioPrice}
                onChange={(e) => setScenarioPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Projected Impact
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Plan Price:</span>
                <span className="font-medium">${currentPlanPrice}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Plan Price:</span>
                <span className="font-medium text-purple-700">${newPrice.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Affected Customers:</span>
                <span className="font-medium">{planCustomers}</span>
              </div>
              <div className="border-t border-purple-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Monthly Revenue Change:</span>
                  <span className={`font-bold text-lg ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '+' : ''}${revenueChange.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600 text-sm">Annual Impact:</span>
                  <span className={`font-semibold ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '+' : ''}${(revenueChange * 12).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Cash Flow Overview */}
      <Card title="Cash Flow Overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Monthly Inflow</span>
            </div>
            <p className="text-2xl font-bold text-green-700">${totalMRR.toLocaleString()}</p>
            <p className="text-sm text-green-600">From subscriptions</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Monthly Burn</span>
            </div>
            <p className="text-2xl font-bold text-red-700">${monthlyBurn.toLocaleString()}</p>
            <p className="text-sm text-red-600">Operating expenses</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Net Position</span>
            </div>
            <p className={`text-2xl font-bold ${totalMRR - monthlyBurn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalMRR - monthlyBurn >= 0 ? '+' : '-'}${Math.abs(totalMRR - monthlyBurn).toLocaleString()}
            </p>
            <p className="text-sm text-blue-600">Monthly</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Runway Status</p>
          <ProgressBar 
            value={runwayMonths} 
            max={24} 
            color={runwayMonths > 12 ? 'green' : runwayMonths > 6 ? 'yellow' : 'red'}
            label={`${runwayMonths} months runway (target: 18+ months)`}
          />
        </div>
      </Card>
    </div>
  );
};
