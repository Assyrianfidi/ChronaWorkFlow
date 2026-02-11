/**
 * Owner Dashboard - Dummy Data Generators
 * AccuBooks CEO Dashboard Sample Data
 */

import { User, Subscription, SecurityEvent, AIRecommendation, Mission, Badge } from './types';

// Sample Users with health scores
export const mockUsers: User[] = [
  { id: '1', name: 'John Smith', email: 'john@acme.com', role: 'Owner', company: 'Acme Corp', status: 'active', lastLogin: '2026-02-05 14:30', createdAt: '2025-01-15', apiCalls: 12450, healthScore: 95, churnRisk: 'low' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@tech.com', role: 'Admin', company: 'Tech Solutions', status: 'active', lastLogin: '2026-02-05 13:45', createdAt: '2025-02-01', apiCalls: 8932, healthScore: 88, churnRisk: 'low' },
  { id: '3', name: 'Mike Davis', email: 'mike@startup.io', role: 'Accountant', company: 'Startup Inc', status: 'active', lastLogin: '2026-02-04 16:20', createdAt: '2025-03-10', apiCalls: 5671, healthScore: 72, churnRisk: 'medium' },
  { id: '4', name: 'Emily Brown', email: 'emily@consult.com', role: 'Manager', company: 'Consulting LLC', status: 'inactive', lastLogin: '2026-01-28 09:15', createdAt: '2025-02-20', apiCalls: 3456, healthScore: 45, churnRisk: 'high' },
  { id: '5', name: 'David Wilson', email: 'david@finance.com', role: 'Accountant', company: 'Finance Pro', status: 'active', lastLogin: '2026-02-05 11:00', createdAt: '2025-04-05', apiCalls: 7891, healthScore: 91, churnRisk: 'low' },
];

// Sample Subscriptions with LTV data
export const mockSubscriptions: Subscription[] = [
  { id: 'sub_1', customer: 'Acme Corp', email: 'billing@acme.com', plan: 'Enterprise', status: 'active', amount: 199, startDate: '2025-01-15', nextBilling: '2026-02-15', mrr: 199, healthScore: 98, ltv: 7164 },
  { id: 'sub_2', customer: 'Tech Solutions', email: 'pay@tech.com', plan: 'Professional', status: 'active', amount: 79, startDate: '2025-02-01', nextBilling: '2026-02-01', mrr: 79, healthScore: 92, ltv: 2844 },
  { id: 'sub_3', customer: 'Startup Inc', email: 'finance@startup.io', plan: 'Starter', status: 'active', amount: 29, startDate: '2025-03-10', nextBilling: '2026-03-10', mrr: 29, healthScore: 65, ltv: 522 },
  { id: 'sub_4', customer: 'Consulting LLC', email: 'billing@consult.com', plan: 'Professional', status: 'past_due', amount: 79, startDate: '2025-02-20', nextBilling: '2026-02-20', mrr: 79, healthScore: 42, ltv: 1422 },
  { id: 'sub_5', customer: 'Finance Pro', email: 'david@finance.com', plan: 'Enterprise', status: 'active', amount: 199, startDate: '2025-04-05', nextBilling: '2026-04-05', mrr: 199, healthScore: 96, ltv: 4776 },
  { id: 'sub_6', customer: 'New Venture', email: 'hello@new.com', plan: 'Starter', status: 'trialing', amount: 29, startDate: '2026-02-01', nextBilling: '2026-02-15', mrr: 0, healthScore: 78, ltv: 0 },
];

// Revenue data for charts
export const mockRevenueData = [
  { name: 'Jan', revenue: 4500, subscriptions: 45, churn: 2, mrr: 4500, arr: 54000 },
  { name: 'Feb', revenue: 5200, subscriptions: 52, churn: 1, mrr: 5200, arr: 62400 },
  { name: 'Mar', revenue: 4800, subscriptions: 48, churn: 4, mrr: 4800, arr: 57600 },
  { name: 'Apr', revenue: 6100, subscriptions: 61, churn: 3, mrr: 6100, arr: 73200 },
  { name: 'May', revenue: 7200, subscriptions: 72, churn: 2, mrr: 7200, arr: 86400 },
  { name: 'Jun', revenue: 8500, subscriptions: 85, churn: 1, mrr: 8500, arr: 102000 },
  { name: 'Jul', revenue: 9200, subscriptions: 92, churn: 2, mrr: 9200, arr: 110400 },
  { name: 'Aug', revenue: 9800, subscriptions: 98, churn: 1, mrr: 9800, arr: 117600 },
  { name: 'Sep', revenue: 10500, subscriptions: 105, churn: 3, mrr: 10500, arr: 126000 },
  { name: 'Oct', revenue: 11200, subscriptions: 112, churn: 2, mrr: 11200, arr: 134400 },
  { name: 'Nov', revenue: 12100, subscriptions: 121, churn: 1, mrr: 12100, arr: 145200 },
  { name: 'Dec', revenue: 13500, subscriptions: 135, churn: 2, mrr: 13500, arr: 162000 },
];

// Predictive revenue data
export const mockPredictiveData = [
  { name: 'Jan', actual: 4500, predicted: null },
  { name: 'Feb', actual: 5200, predicted: null },
  { name: 'Mar', actual: 4800, predicted: null },
  { name: 'Apr', actual: 6100, predicted: null },
  { name: 'May', actual: 7200, predicted: null },
  { name: 'Jun', actual: 8500, predicted: null },
  { name: 'Jul', actual: null, predicted: 9200 },
  { name: 'Aug', actual: null, predicted: 10500 },
  { name: 'Sep', actual: null, predicted: 11800 },
  { name: 'Oct', actual: null, predicted: 13200 },
  { name: 'Nov', actual: null, predicted: 14700 },
  { name: 'Dec', actual: null, predicted: 16300 },
];

// Plan distribution
export const mockPlanData = [
  { name: 'Starter', value: 35, color: '#10b981', revenue: 1015 },
  { name: 'Professional', value: 45, color: '#3b82f6', revenue: 3555 },
  { name: 'Enterprise', value: 20, color: '#8b5cf6', revenue: 3980 },
];

// Security events
export const mockSecurityEvents: SecurityEvent[] = [
  { id: '1', type: 'Failed Login', severity: 'medium', description: 'Multiple failed login attempts from IP 192.168.1.100', timestamp: '2026-02-05 14:30', ip: '192.168.1.100', user: 'john@acme.com' },
  { id: '2', type: 'SQL Injection', severity: 'high', description: 'Blocked SQL injection attempt on /api/users endpoint', timestamp: '2026-02-05 12:15', ip: '10.0.0.50' },
  { id: '3', type: 'Suspicious Activity', severity: 'medium', description: 'Unusual API usage pattern detected - 500 requests/min', timestamp: '2026-02-04 16:45', ip: '172.16.0.25', user: 'sarah@tech.com' },
  { id: '4', type: 'Data Export', severity: 'low', description: 'Large data export by admin user', timestamp: '2026-02-04 10:30', user: 'admin@system' },
];

// AI Recommendations
export const mockAIRecommendations: AIRecommendation[] = [
  { id: '1', type: 'retention', priority: 'high', title: 'Churn Risk Alert', description: '3 customers show high churn risk. Consider retention campaign.', impact: 'Potential $2,400 MRR loss', action: 'Launch retention email sequence' },
  { id: '2', type: 'revenue', priority: 'high', title: 'Upsell Opportunity', description: '15 Starter customers approaching usage limits. Upsell ready.', impact: '+$750 MRR potential', action: 'Send upgrade offers' },
  { id: '3', type: 'growth', priority: 'medium', title: 'Pricing Optimization', description: 'Market analysis suggests 10% price increase viable', impact: '+$850 MRR increase', action: 'A/B test new pricing' },
  { id: '4', type: 'cost', priority: 'medium', title: 'Server Optimization', description: 'Database queries can be optimized. 30% CPU reduction possible.', impact: '-$200/month hosting cost', action: 'Review query patterns' },
];

// Gamification - CEO Missions
export const mockMissions: Mission[] = [
  { id: '1', title: 'Growth Champion', description: 'Add 5 new customers this week', progress: 3, total: 5, reward: '500 XP', completed: false },
  { id: '2', title: 'Retention Master', description: 'Reduce churn rate to <2%', progress: 1, total: 1, reward: 'Gold Badge', completed: true },
  { id: '3', title: 'Revenue Goal', description: 'Reach $10K MRR', progress: 8540, total: 10000, reward: '1000 XP', completed: false },
  { id: '4', title: 'Security First', description: 'Enable MFA for all admin users', progress: 2, total: 3, reward: 'Security Badge', completed: false },
];

// Badges
export const mockBadges: Badge[] = [
  { id: '1', name: 'Early Adopter', icon: 'rocket', earned: true, earnedAt: '2025-01-15' },
  { id: '2', name: 'Revenue Master', icon: 'trending-up', earned: true, earnedAt: '2025-06-01' },
  { id: '3', name: 'Security Guardian', icon: 'shield', earned: false },
  { id: '4', name: 'Team Leader', icon: 'users', earned: true, earnedAt: '2025-03-10' },
  { id: '5', name: 'Perfect Month', icon: 'award', earned: false },
];

// Integration status
export const mockIntegrations = [
  { name: 'Stripe', status: 'connected', lastSync: '2026-02-05 14:30', icon: 'credit-card' },
  { name: 'SendGrid', status: 'connected', lastSync: '2026-02-05 14:30', icon: 'mail' },
  { name: 'Twilio', status: 'disconnected', lastSync: null, icon: 'message-square' },
  { name: 'Slack', status: 'connected', lastSync: '2026-02-05 14:30', icon: 'slack' },
  { name: 'QuickBooks', status: 'pending', lastSync: null, icon: 'book' },
  { name: 'AWS S3', status: 'connected', lastSync: '2026-02-05 14:30', icon: 'cloud' },
];
