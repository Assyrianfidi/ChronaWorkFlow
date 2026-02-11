/**
 * Subscription & Customer Management Component
 * Customer health scoring, segmentation, and retention recommendations
 */

import React, { useState } from 'react';
import { Users, UserCheck, UserX, Clock, AlertCircle, Star, Filter, Search, Mail, MessageCircle } from 'lucide-react';
import { StatusBadge, HealthScore, RiskIndicator, Card, Button } from './common';
import { mockSubscriptions, mockUsers } from '../data';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const SubscriptionManagement: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter subscriptions
  const filteredSubscriptions = mockSubscriptions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesSearch = sub.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Status breakdown
  const statusData = [
    { name: 'Active', value: mockSubscriptions.filter(s => s.status === 'active').length, color: '#10b981' },
    { name: 'Trialing', value: mockSubscriptions.filter(s => s.status === 'trialing').length, color: '#3b82f6' },
    { name: 'Past Due', value: mockSubscriptions.filter(s => s.status === 'past_due').length, color: '#f59e0b' },
    { name: 'Canceled', value: mockSubscriptions.filter(s => s.status === 'canceled').length, color: '#ef4444' },
  ];

  // Segmentation by health score
  const healthyCustomers = mockSubscriptions.filter(s => s.healthScore >= 80).length;
  const atRiskCustomers = mockSubscriptions.filter(s => s.healthScore >= 50 && s.healthScore < 80).length;
  const criticalCustomers = mockSubscriptions.filter(s => s.healthScore < 50).length;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Active</span>
          </div>
          <p className="text-3xl font-bold text-green-700">{statusData[0].value}</p>
          <p className="text-sm text-green-600">Paying customers</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">Trialing</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{statusData[1].value}</p>
          <p className="text-sm text-blue-600">Conversion opportunity</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">Past Due</span>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{statusData[2].value}</p>
          <p className="text-sm text-yellow-600">Needs attention</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">Canceled</span>
          </div>
          <p className="text-3xl font-bold text-red-700">{statusData[3].value}</p>
          <p className="text-sm text-red-600">Churned this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card title="Subscription Status" className="lg:col-span-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Health Segmentation */}
        <Card title="Customer Health Segments" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <HealthScore score={95} size="lg" />
              <p className="mt-2 font-semibold text-green-800">{healthyCustomers} Healthy</p>
              <p className="text-sm text-green-600">Score 80-100</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <HealthScore score={65} size="lg" />
              <p className="mt-2 font-semibold text-yellow-800">{atRiskCustomers} At Risk</p>
              <p className="text-sm text-yellow-600">Score 50-79</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <HealthScore score={35} size="lg" />
              <p className="mt-2 font-semibold text-red-800">{criticalCustomers} Critical</p>
              <p className="text-sm text-red-600">Score &lt;50</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>AI Insight:</strong> 2 customers showing churn risk signals. Consider proactive outreach.
            </p>
          </div>
        </Card>
      </div>

      {/* Subscription List */}
      <Card title="Customer Subscriptions" action={
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      }>
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LTV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{sub.customer}</p>
                      <p className="text-xs text-gray-500">{sub.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      sub.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                      sub.plan === 'Professional' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sub.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HealthScore score={sub.healthScore} size="sm" />
                      {sub.healthScore < 50 && (
                        <RiskIndicator risk="high" showLabel={false} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">${sub.mrr}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">${sub.ltv.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-blue-50 rounded" title="Email">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </button>
                      <button className="p-1.5 hover:bg-green-50 rounded" title="Message">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No subscriptions found</p>
          </div>
        )}
      </Card>

      {/* AI Retention Recommendations */}
      <Card title="AI Retention Recommendations" className="border-purple-200">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
            <Star className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Upsell Opportunity: Tech Solutions</h4>
              <p className="text-sm text-gray-600 mt-1">Professional plan customer approaching API limits. 89% likelihood to upgrade to Enterprise.</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="primary">Send Upgrade Offer</Button>
                <Button size="sm" variant="ghost">View Details</Button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Churn Risk: Consulting LLC</h4>
              <p className="text-sm text-gray-600 mt-1">Past due payment + decreased login frequency. 67% churn probability.</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="danger">Initiate Retention</Button>
                <Button size="sm" variant="ghost">View Profile</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
