/**
 * CEO/Owner Dashboard - AccuBooks Enterprise
 * Comprehensive business intelligence and control center
 * 
 * Data Sources:
 * - PostgreSQL (Drizzle ORM): transactions, invoices, subscriptions, employees
 * - Prisma ORM: companies, users, billing
 * - Redis: caching, sessions, real-time metrics
 * - Stripe: payment processing, subscriptions
 * - Plaid: bank connections
 * 
 * @author AccuBooks Engineering
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign, Users, CreditCard,
  Receipt, Package, AlertCircle, CheckCircle, Clock, Calendar, ArrowUpRight,
  ArrowDownRight, Activity, Shield, Zap, Target, MoreHorizontal, Download,
  Filter, RefreshCw, Bell, Search, ChevronDown, Building2, Briefcase,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon, Wallet,
  FileText, Settings, LogOut, Menu, X, Sparkles, Bot, Mail, MessageSquare,
  Phone, Globe, Lock, Eye, EyeOff, Trash2, Edit3, Plus, Minus, Save,
  Share2, Printer, Copy, ExternalLink, HelpCircle, Info, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Star, Trophy, Flame, Award, Crown,
  GitBranch, GitCommit, GitPullRequest, Database, Server, HardDrive,
  Cpu, MemoryStick, Network, Cloud, CloudRain, Sun, Moon, Monitor,
  Smartphone, Tablet, Laptop, Keyboard, Mouse, Headphones,
  Camera, Video, Mic, Speaker, Wifi, Bluetooth, Battery, BatteryCharging,
  BatteryWarning, BatteryFull, Plug, ZapOff, Lightbulb, Fan, Thermometer,
  Droplets, Wind, CloudLightning, CloudSnow, CloudFog, Sunrise, Sunset,
  MoonStar, Rocket, Plane, Car, Bus, Train, Ship, Bike, Heart, HeartPulse,
  Brain, Smile, Frown, Meh, Laugh, Annoyed, Angry
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
  trend?: number[];
  status: 'good' | 'warning' | 'danger' | 'neutral';
  icon: React.ElementType;
  description?: string;
  lastUpdated?: Date;
}

interface RevenueData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  mrr: number;
  arr: number;
  projections?: number;
}

interface SubscriptionMetric {
  plan: string;
  count: number;
  revenue: number;
  growth: number;
  churnRate: number;
  color: string;
}

interface CustomerMetric {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  mrr: number;
  ltv: number;
  healthScore: number;
  lastActivity: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'revenue' | 'security' | 'operations' | 'customers' | 'system';
  actionable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  tasksCompleted: number;
  tasksPending: number;
  lastActive: Date;
}

interface CashFlowForecast {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
  runway: number;
}

interface IntegrationStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: Date;
  healthScore: number;
  icon: React.ElementType;
}

// ============================================================================
// MOCK DATA GENERATORS (Replace with API calls in production)
// ============================================================================

const generateRevenueData = (days: number = 30): RevenueData[] => {
  const data: RevenueData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const baseRevenue = 15000 + Math.random() * 5000;
    const seasonalFactor = 1 + 0.3 * Math.sin((i / 30) * Math.PI * 2);
    const growthFactor = 1 + (days - i) * 0.005;
    
    const revenue = Math.round(baseRevenue * seasonalFactor * growthFactor);
    const expenses = Math.round(revenue * (0.6 + Math.random() * 0.15));
    const profit = revenue - expenses;
    const mrr = Math.round(revenue * 0.8);
    const arr = mrr * 12;
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      revenue,
      expenses,
      profit,
      mrr,
      arr,
      projections: i < 7 ? Math.round(revenue * 1.1) : undefined
    });
  }
  
  return data;
};

const mockMetrics: DashboardMetric[] = [
  {
    id: 'mrr',
    title: 'Monthly Recurring Revenue',
    value: 85400,
    change: 12.5,
    changeType: 'increase',
    prefix: '$',
    status: 'good',
    icon: DollarSign,
    description: 'Total monthly subscription revenue',
    trend: [78000, 79500, 81000, 82500, 84000, 85400]
  },
  {
    id: 'arr',
    title: 'Annual Run Rate',
    value: 1024800,
    change: 15.3,
    changeType: 'increase',
    prefix: '$',
    status: 'good',
    icon: TrendingUp,
    description: 'Projected annual revenue based on current MRR'
  },
  {
    id: 'customers',
    title: 'Active Customers',
    value: 1247,
    change: 8.2,
    changeType: 'increase',
    status: 'good',
    icon: Users,
    description: 'Total paying customers across all plans'
  },
  {
    id: 'churn',
    title: 'Churn Rate',
    value: 2.1,
    change: -0.5,
    changeType: 'decrease',
    suffix: '%',
    decimalPlaces: 1,
    status: 'good',
    icon: Activity,
    description: 'Monthly customer churn percentage'
  },
  {
    id: 'ltv',
    title: 'Customer Lifetime Value',
    value: 2840,
    change: 5.7,
    changeType: 'increase',
    prefix: '$',
    status: 'good',
    icon: Target,
    description: 'Average lifetime value per customer'
  },
  {
    id: 'cac',
    title: 'Customer Acquisition Cost',
    value: 450,
    change: -3.2,
    changeType: 'decrease',
    prefix: '$',
    status: 'good',
    icon: Zap,
    description: 'Average cost to acquire a new customer'
  },
  {
    id: 'ltv_cac',
    title: 'LTV:CAC Ratio',
    value: 6.3,
    change: 0.8,
    changeType: 'increase',
    suffix: 'x',
    decimalPlaces: 1,
    status: 'good',
    icon: CheckCircle,
    description: 'Ratio of lifetime value to acquisition cost'
  },
  {
    id: 'nrr',
    title: 'Net Revenue Retention',
    value: 108,
    change: 3.2,
    changeType: 'increase',
    suffix: '%',
    status: 'good',
    icon: RefreshCw,
    description: 'Revenue retained from existing customers'
  }
];

const mockSubscriptionBreakdown: SubscriptionMetric[] = [
  { plan: 'Starter', count: 687, revenue: 19913, growth: 8.5, churnRate: 3.2, color: '#10b981' },
  { plan: 'Professional', count: 412, revenue: 32960, growth: 15.2, churnRate: 1.8, color: '#3b82f6' },
  { plan: 'Enterprise', count: 148, revenue: 32560, growth: 22.1, churnRate: 0.9, color: '#8b5cf6' }
];

const mockCustomers: CustomerMetric[] = [
  { id: '1', name: 'Acme Corporation', email: 'billing@acme.com', company: 'Acme Corp', plan: 'Enterprise', status: 'active', mrr: 499, ltv: 15480, healthScore: 98, lastActivity: new Date(), riskLevel: 'low' },
  { id: '2', name: 'TechStart Inc', email: 'finance@techstart.io', company: 'TechStart', plan: 'Professional', status: 'active', mrr: 199, ltv: 5200, healthScore: 92, lastActivity: subDays(new Date(), 2), riskLevel: 'low' },
  { id: '3', name: 'Global Logistics', email: 'payments@globallog.com', company: 'Global Logistics', plan: 'Enterprise', status: 'past_due', mrr: 799, ltv: 12500, healthScore: 62, lastActivity: subDays(new Date(), 15), riskLevel: 'high' },
  { id: '4', name: 'StartupXYZ', email: 'hello@startupxyz.com', company: 'StartupXYZ', plan: 'Starter', status: 'trialing', mrr: 0, ltv: 0, healthScore: 75, lastActivity: new Date(), riskLevel: 'medium' }
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Revenue Spike Detected',
    message: 'MRR increased 15% this month, primarily from Enterprise upgrades.',
    timestamp: new Date(),
    priority: 'medium',
    category: 'revenue',
    actionable: true,
    action: { label: 'View Details', onClick: () => console.log('View revenue details') }
  },
  {
    id: '2',
    type: 'error',
    title: 'High-Risk Customer Churn',
    message: 'Global Logistics at risk of churning. $799 MRR in jeopardy.',
    timestamp: subDays(new Date(), 1),
    priority: 'high',
    category: 'customers',
    actionable: true,
    action: { label: 'Take Action', onClick: () => console.log('Initiate retention') }
  },
  {
    id: '3',
    type: 'info',
    title: 'System Maintenance Complete',
    message: 'All services operational. Database backup completed successfully.',
    timestamp: subDays(new Date(), 2),
    priority: 'low',
    category: 'system',
    actionable: false
  },
  {
    id: '4',
    type: 'success',
    title: 'New Enterprise Contract',
    message: 'MegaCorp signed $5,000/month Enterprise contract.',
    timestamp: new Date(),
    priority: 'medium',
    category: 'revenue',
    actionable: true,
    action: { label: 'View Contract', onClick: () => console.log('View contract') }
  }
];

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Sarah Chen', role: 'CEO', status: 'online', tasksCompleted: 45, tasksPending: 3, lastActive: new Date() },
  { id: '2', name: 'Mike Johnson', role: 'CTO', status: 'online', tasksCompleted: 38, tasksPending: 7, lastActive: new Date() },
  { id: '3', name: 'Emily Davis', role: 'CFO', status: 'away', tasksCompleted: 42, tasksPending: 2, lastActive: subDays(new Date(), 1) },
  { id: '4', name: 'Alex Rivera', role: 'VP Sales', status: 'online', tasksCompleted: 56, tasksPending: 12, lastActive: new Date() },
  { id: '5', name: 'Jordan Lee', role: 'VP Product', status: 'busy', tasksCompleted: 33, tasksPending: 8, lastActive: new Date() }
];

const mockCashFlow: CashFlowForecast[] = [
  { period: 'Jan 2025', inflow: 85400, outflow: 52300, net: 33100, runway: 18 },
  { period: 'Feb 2025', inflow: 89200, outflow: 54100, net: 35100, runway: 19 },
  { period: 'Mar 2025', inflow: 92500, outflow: 55800, net: 36700, runway: 20 },
  { period: 'Apr 2025', inflow: 96100, outflow: 57500, net: 38600, runway: 21 },
  { period: 'May 2025', inflow: 99800, outflow: 59200, net: 40600, runway: 22 },
  { period: 'Jun 2025', inflow: 103700, outflow: 61000, net: 42700, runway: 23 }
];

const mockIntegrations: IntegrationStatus[] = [
  { name: 'Stripe', status: 'connected', lastSync: new Date(), healthScore: 98, icon: CreditCard },
  { name: 'Plaid', status: 'connected', lastSync: subDays(new Date(), 1), healthScore: 95, icon: Building2 },
  { name: 'SendGrid', status: 'connected', lastSync: new Date(), healthScore: 99, icon: Mail },
  { name: 'AWS S3', status: 'connected', lastSync: new Date(), healthScore: 97, icon: Cloud },
  { name: 'Slack', status: 'error', lastSync: subDays(new Date(), 3), healthScore: 72, icon: MessageSquare },
  { name: 'QuickBooks', status: 'pending', lastSync: new Date(), healthScore: 0, icon: FileText }
];

// ============================================================================
// UI COMPONENTS
// ============================================================================

const Card = ({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const MetricCard = ({ metric, onClick }: { metric: DashboardMetric; onClick?: () => void }) => {
  const Icon = metric.icon;
  const isPositive = metric.changeType === 'increase' && metric.id !== 'churn' && metric.id !== 'cac';
  const isNegative = metric.changeType === 'decrease' && (metric.id === 'churn' || metric.id === 'cac');
  const isGood = isPositive || isNegative;
  
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    if (metric.prefix) return `${metric.prefix}${val.toLocaleString()}`;
    if (metric.suffix) return `${val.toLocaleString()}${metric.suffix}`;
    return val.toLocaleString();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl p-5 border border-slate-200 shadow-sm cursor-pointer transition-all",
        "hover:shadow-md hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{metric.title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatValue(metric.value)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {metric.changeType === 'increase' ? (
              <ArrowUpRight className={cn("w-4 h-4", isGood ? "text-emerald-500" : "text-rose-500")} />
            ) : metric.changeType === 'decrease' ? (
              <ArrowDownRight className={cn("w-4 h-4", isGood ? "text-emerald-500" : "text-rose-500")} />
            ) : null}
            <span className={cn(
              "text-sm font-medium",
              isGood ? "text-emerald-600" : metric.change === 0 ? "text-slate-500" : "text-rose-600"
            )}>
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
            <span className="text-sm text-slate-400 ml-1">vs last month</span>
          </div>
          {metric.description && (
            <p className="text-xs text-slate-400 mt-2">{metric.description}</p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          metric.status === 'good' && "bg-emerald-50 text-emerald-600",
          metric.status === 'warning' && "bg-amber-50 text-amber-600",
          metric.status === 'danger' && "bg-rose-50 text-rose-600",
          metric.status === 'neutral' && "bg-slate-50 text-slate-600"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {metric.trend && (
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metric.trend.map((v, i) => ({ i, v }))}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isGood ? "#10b981" : "#f43f5e"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

const StatusBadge = ({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' | 'lg' }) => {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    canceled: 'bg-rose-50 text-rose-700 border-rose-200',
    paused: 'bg-slate-50 text-slate-700 border-slate-200',
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={cn(
      "inline-flex items-center font-medium rounded-full border",
      sizeStyles[size],
      styles[status as keyof typeof styles] || styles.neutral
    )}>
      {status === 'active' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </span>
  );
};

const HealthScore = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const getColor = (s: number) => {
    if (s >= 80) return { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' };
    if (s >= 60) return { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' };
    return { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' };
  };

  const colors = getColor(score);
  const sizeStyles = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={cn(
      "rounded-full border-2 flex items-center justify-center font-bold",
      sizeStyles[size],
      colors.bg,
      colors.border,
      colors.text
    )}>
      {score}
    </div>
  );
};

const ProgressBar = ({ value, max, label, color = 'blue' }: { value: number; max: number; label?: string; color?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorStyles = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500'
  };

  return (
    <div className="w-full">
      {(label || percentage) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-slate-600">{label}</span>}
          <span className="text-slate-900 font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorStyles[color as keyof typeof colorStyles] || colorStyles.blue)}
        />
      </div>
    </div>
  );
};

// ============================================================================
// CHART COMPONENTS
// ============================================================================

const RevenueChart = ({ data }: { data: RevenueData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => format(parseISO(date), 'MMM d')}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          labelFormatter={(label) => format(parseISO(label), 'MMMM d, yyyy')}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorProfit)"
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke="#f43f5e"
          strokeWidth={2}
          dot={false}
        />
        <ReferenceLine x={data[data.length - 7]?.date} stroke="#64748b" strokeDasharray="5 5" label={{ value: 'Today', position: 'top', fill: '#64748b', fontSize: 12 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const SubscriptionPieChart = ({ data }: { data: SubscriptionMetric[] }) => {
  const pieData = data.map(d => ({ name: d.plan, value: d.count, color: d.color }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value} customers (${((value / pieData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%)`, name]}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px'
          }}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const CashFlowChart = ({ data }: { data: CashFlowForecast[] }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value: number) => `$${value.toLocaleString()}`}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="inflow" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outflow" name="Cash Out" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="net" name="Net Cash Flow" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

const OverviewSection = ({ metrics, revenueData }: { metrics: DashboardMetric[]; revenueData: RevenueData[] }) => {
  return (
    <div className="space-y-6">
      {/* CEO Command Center */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">CEO Command Center</h2>
              <p className="text-slate-400">Real-time business intelligence and KPIs</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/30">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                All Systems Operational
              </span>
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {metrics.slice(0, 8).map((metric) => (
              <div key={metric.id} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{metric.title}</p>
                <p className="text-xl font-bold">
                  {metric.prefix}{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}{metric.suffix}
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  (metric.changeType === 'increase' && metric.id !== 'churn' && metric.id !== 'cac') || 
                  (metric.changeType === 'decrease' && (metric.id === 'churn' || metric.id === 'cac'))
                    ? "text-emerald-400" : "text-rose-400"
                )}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% this month
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Revenue & Profit Trends">
          <RevenueChart data={revenueData} />
        </Card>
        <Card title="Subscription Distribution">
          <SubscriptionPieChart data={mockSubscriptionBreakdown} />
          <div className="mt-4 space-y-3">
            {mockSubscriptionBreakdown.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-sm font-medium text-slate-700">{plan.plan}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{plan.count} customers</p>
                  <p className="text-xs text-slate-500">${plan.revenue.toLocaleString()}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </div>
  );
};

const CustomersSection = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredCustomers = mockCustomers.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Health</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">MRR</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">LTV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      customer.plan === 'Enterprise' && "bg-violet-100 text-violet-700",
                      customer.plan === 'Professional' && "bg-blue-100 text-blue-700",
                      customer.plan === 'Starter' && "bg-emerald-100 text-emerald-700"
                    )}>
                      {customer.plan}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="px-4 py-4">
                    <HealthScore score={customer.healthScore} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900">${customer.mrr}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900">${customer.ltv.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      customer.riskLevel === 'low' && "bg-emerald-100 text-emerald-700",
                      customer.riskLevel === 'medium' && "bg-amber-100 text-amber-700",
                      customer.riskLevel === 'high' && "bg-rose-100 text-rose-700"
                    )}>
                      {customer.riskLevel.charAt(0).toUpperCase() + customer.riskLevel.slice(1)} Risk
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const RevenueSection = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Cash Flow Forecast (6 Months)" action={<Badge variant="outline">Projected</Badge>}>
          <CashFlowChart data={mockCashFlow} />
        </Card>
        <Card title="Revenue by Plan">
          <div className="space-y-4">
            {mockSubscriptionBreakdown.map((plan) => (
              <div key={plan.plan} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="font-medium text-slate-900">{plan.plan}</span>
                    <span className="text-sm text-slate-500">({plan.count} customers)</span>
                  </div>
                  <span className="font-semibold text-slate-900">${plan.revenue.toLocaleString()}/mo</span>
                </div>
                <ProgressBar value={plan.revenue} max={mockSubscriptionBreakdown.reduce((a, b) => a + b.revenue, 0)} color={plan.color.replace('#', '') === '10b981' ? 'emerald' : plan.color.replace('#', '') === '3b82f6' ? 'blue' : 'violet'} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Growth: <span className="text-emerald-600 font-medium">+{plan.growth}%</span></span>
                  <span className="text-slate-500">Churn: <span className="text-rose-600 font-medium">{plan.churnRate}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const AlertsSection = () => {
  const [alerts, setAlerts] = useState(mockAlerts);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Active Alerts ({alerts.length})</h3>
        <button 
          onClick={() => setAlerts([])}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Dismiss All
        </button>
      </div>
      
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={cn(
              "relative rounded-xl p-4 border",
              alert.type === 'error' && "bg-rose-50 border-rose-200",
              alert.type === 'warning' && "bg-amber-50 border-amber-200",
              alert.type === 'info' && "bg-blue-50 border-blue-200",
              alert.type === 'success' && "bg-emerald-50 border-emerald-200"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                alert.type === 'error' && "bg-rose-100 text-rose-600",
                alert.type === 'warning' && "bg-amber-100 text-amber-600",
                alert.type === 'info' && "bg-blue-100 text-blue-600",
                alert.type === 'success' && "bg-emerald-100 text-emerald-600"
              )}>
                {alert.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                {alert.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                {alert.type === 'info' && <Info className="w-5 h-5" />}
                {alert.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    alert.priority === 'critical' && "bg-rose-100 text-rose-700",
                    alert.priority === 'high' && "bg-orange-100 text-orange-700",
                    alert.priority === 'medium' && "bg-amber-100 text-amber-700",
                    alert.priority === 'low' && "bg-slate-100 text-slate-700"
                  )}>
                    {alert.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                <p className="text-xs text-slate-400 mt-1">{format(alert.timestamp, 'MMM d, h:mm a')}</p>
                
                {alert.actionable && alert.action && (
                  <button 
                    onClick={alert.action.onClick}
                    className="mt-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
              <button 
                onClick={() => dismissAlert(alert.id)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const IntegrationsSection = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockIntegrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.name} className={cn(
              "border-l-4",
              integration.status === 'connected' && "border-l-emerald-500",
              integration.status === 'error' && "border-l-rose-500",
              integration.status === 'pending' && "border-l-amber-500",
              integration.status === 'disconnected' && "border-l-slate-300"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl",
                    integration.status === 'connected' && "bg-emerald-50 text-emerald-600",
                    integration.status === 'error' && "bg-rose-50 text-rose-600",
                    integration.status === 'pending' && "bg-amber-50 text-amber-600",
                    integration.status === 'disconnected' && "bg-slate-50 text-slate-600"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{integration.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        integration.status === 'connected' && "bg-emerald-500",
                        integration.status === 'error' && "bg-rose-500",
                        integration.status === 'pending' && "bg-amber-500",
                        integration.status === 'disconnected' && "bg-slate-300"
                      )} />
                      <span className="text-sm text-slate-500 capitalize">{integration.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{integration.healthScore}%</p>
                  <p className="text-xs text-slate-500">Health Score</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Last sync: {format(integration.lastSync, 'MMM d, h:mm a')}
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Configure
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const TeamSection = () => {
  return (
    <div className="space-y-6">
      <Card title="Team Performance">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {mockTeam.map((member) => (
            <div key={member.id} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  member.status === 'online' && "bg-emerald-500",
                  member.status === 'away' && "bg-amber-500",
                  member.status === 'busy' && "bg-rose-500",
                  member.status === 'offline' && "bg-slate-300"
                )} />
                <span className="text-xs text-slate-500 capitalize">{member.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white rounded-lg p-2">
                  <p className="text-lg font-bold text-emerald-600">{member.tasksCompleted}</p>
                  <p className="text-xs text-slate-500">Done</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-lg font-bold text-amber-600">{member.tasksPending}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'outline' | 'secondary' | 'destructive' }) => {
  const styles = {
    default: 'bg-slate-900 text-slate-50',
    outline: 'border border-slate-200 text-slate-700',
    secondary: 'bg-slate-100 text-slate-700',
    destructive: 'bg-rose-100 text-rose-700'
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", styles[variant])}>
      {children}
    </span>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function CEODashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setRevenueData(generateRevenueData(30));
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'customers', label: 'Customers', icon: Users, badge: '2' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, badge: null },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: '4' },
    { id: 'team', label: 'Team', icon: Briefcase, badge: null },
    { id: 'integrations', label: 'Integrations', icon: Zap, badge: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection metrics={mockMetrics} revenueData={revenueData} />;
      case 'customers':
        return <CustomersSection />;
      case 'revenue':
        return <RevenueSection />;
      case 'alerts':
        return <AlertsSection />;
      case 'team':
        return <TeamSection />;
      case 'integrations':
        return <IntegrationsSection />;
      default:
        return <OverviewSection metrics={mockMetrics} revenueData={revenueData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex flex-col h-screen sticky top-0 z-40"
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold">A</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">AccuBooks</h1>
                <p className="text-xs text-slate-400">CEO Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {navigationItems.find(n => n.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-slate-500">
                  Welcome back, CEO • {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">All Systems Operational</span>
              </div>

              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  CEO
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// API INTEGRATION TEMPLATE
// ============================================================================

/*
 * API ENDPOINTS TO IMPLEMENT:
 * 
 * GET /api/ceo/dashboard/metrics
 *   Returns: { mrr, arr, customers, churn, ltv, cac, nrr, trends }
 * 
 * GET /api/ceo/dashboard/revenue
 *   Query: { startDate, endDate, granularity }
 *   Returns: { date, revenue, expenses, profit, mrr, arr }[]
 * 
 * GET /api/ceo/dashboard/customers
 *   Query: { status, plan, search, page, limit }
 *   Returns: { customers: CustomerMetric[], total, page, pages }
 * 
 * GET /api/ceo/dashboard/subscriptions
 *   Returns: { plans: SubscriptionMetric[], totalRevenue, totalCustomers }
 * 
 * GET /api/ceo/dashboard/alerts
 *   Query: { priority, category, status }
 *   Returns: { alerts: Alert[] }
 * 
 * POST /api/ceo/dashboard/alerts/:id/dismiss
 *   Dismisses an alert
 * 
 * GET /api/ceo/dashboard/cashflow
 *   Query: { months }
 *   Returns: { CashFlowForecast[] }
 * 
 * GET /api/ceo/dashboard/integrations
 *   Returns: { integrations: IntegrationStatus[] }
 * 
 * GET /api/ceo/dashboard/team
 *   Returns: { members: TeamMember[] }
 * 
 * GET /api/ceo/dashboard/health
 *   Returns: { status, services, metrics }
 * 
 * WebSocket: wss://api.accubooks.com/ceo/realtime
 *   Subscribes to real-time updates for metrics, alerts, and revenue
 */
