/**
 * Financial Widgets - Profit & Loss, Bank Accounts, Invoices
 * High-fidelity components with data visualizations
 * WCAG 2.1 AA Compliant
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Download,
  Share2,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetProps {
  className?: string;
}

interface MetricChangeProps {
  value: number;
  percentage: number;
  period?: string;
}

const MetricChange: React.FC<MetricChangeProps> = ({ value, percentage, period = 'vs last month' }) => {
  const isPositive = percentage >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-bold',
          isPositive
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        )}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span>{Math.abs(percentage)}%</span>
      </div>
      <span className="text-sm text-gray-500">{period}</span>
    </div>
  );
};

// Profit & Loss Widget
export const ProfitLossWidget: React.FC<WidgetProps> = ({ className }) => {
  const data = {
    revenue: 124563,
    expenses: 87234,
    netProfit: 37329,
    profitMargin: 30,
    revenueChange: 12.5,
    expensesChange: -5.3,
    profitChange: 18.7,
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className={cn('financial-card', className)}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Profit & Loss
            </h3>
            <p className="text-sm text-gray-500">Current month overview</p>
          </div>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </button>
      </div>
      
      {/* Main Metrics */}
      <div className="space-y-6 mb-6">
        {/* Net Profit */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(data.netProfit)}
            </span>
            <span className="text-lg text-gray-500 font-medium">Net Profit</span>
          </div>
          <MetricChange value={data.netProfit} percentage={data.profitChange} />
        </div>
        
        {/* Revenue & Expenses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
              <span className="text-sm font-medium text-gray-600">Revenue</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(data.revenue)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-600" aria-hidden="true" />
              <span className="font-bold text-green-700">{data.revenueChange}%</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></div>
              <span className="text-sm font-medium text-gray-600">Expenses</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(data.expenses)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowDownRight className="w-4 h-4 text-green-600" aria-hidden="true" />
              <span className="font-bold text-green-700">{Math.abs(data.expensesChange)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profit Margin Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Profit Margin</span>
          <span className="text-sm font-bold text-gray-900">{data.profitMargin}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${data.profitMargin}%` }}
            role="progressbar"
            aria-valuenow={data.profitMargin}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Profit margin: ${data.profitMargin}%`}
          ></div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
          View Full Report
        </button>
        <button
          className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          aria-label="Download report"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// Bank Accounts Widget
export const BankAccountsWidget: React.FC<WidgetProps> = ({ className }) => {
  const accounts = [
    {
      id: 1,
      name: 'Business Checking',
      bank: 'Chase Bank',
      balance: 45678,
      change: 8.3,
      lastUpdated: '2 hours ago',
      type: 'checking',
    },
    {
      id: 2,
      name: 'Savings Account',
      bank: 'Bank of America',
      balance: 123456,
      change: 2.1,
      lastUpdated: '1 day ago',
      type: 'savings',
    },
    {
      id: 3,
      name: 'Payroll Account',
      bank: 'Wells Fargo',
      balance: 34567,
      change: -12.5,
      lastUpdated: '3 hours ago',
      type: 'checking',
    },
  ];
  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className={cn('financial-card', className)}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Bank Accounts
            </h3>
            <p className="text-sm text-gray-500">{accounts.length} connected accounts</p>
          </div>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </button>
      </div>
      
      {/* Total Balance */}
      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
        <p className="text-sm font-medium text-blue-700 mb-1">Total Balance</p>
        <p className="text-3xl font-extrabold text-blue-900" style={{ fontFamily: 'var(--font-heading)' }}>
          {formatCurrency(totalBalance)}
        </p>
      </div>
      
      {/* Account List */}
      <div className="space-y-3 mb-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">{account.name}</h4>
                <p className="text-xs text-gray-500">{account.bank}</p>
              </div>
              <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(account.balance)}
              </span>
              <div className="flex items-center gap-1">
                {account.change >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-green-600" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-600" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'text-xs font-bold',
                    account.change >= 0 ? 'text-green-700' : 'text-red-700'
                  )}
                >
                  {Math.abs(account.change)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Updated {account.lastUpdated}</p>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
          Reconcile Accounts
        </button>
        <button className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
          Add Account
        </button>
      </div>
    </div>
  );
};

// Invoices Widget
export const InvoicesWidget: React.FC<WidgetProps> = ({ className }) => {
  const invoiceStats = {
    total: 456,
    paid: 342,
    pending: 89,
    overdue: 25,
    totalAmount: 234567,
    paidAmount: 189234,
    pendingAmount: 34567,
    overdueAmount: 10766,
  };
  
  const recentInvoices = [
    { id: 'INV-1234', client: 'ABC Corp', amount: 5678, status: 'paid', dueDate: 'Jan 15' },
    { id: 'INV-1235', client: 'XYZ Inc', amount: 3456, status: 'pending', dueDate: 'Jan 20' },
    { id: 'INV-1236', client: 'Global Tech', amount: 8901, status: 'overdue', dueDate: 'Jan 10' },
  ];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const paidPercentage = (invoiceStats.paid / invoiceStats.total) * 100;
  
  return (
    <div className={cn('financial-card', className)}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Receipt className="w-6 h-6 text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Invoices
            </h3>
            <p className="text-sm text-gray-500">{invoiceStats.total} total invoices</p>
          </div>
        </div>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-green-700 mb-1">Paid</p>
          <p className="text-lg font-extrabold text-green-900" style={{ fontFamily: 'var(--font-heading)' }}>
            {invoiceStats.paid}
          </p>
          <p className="text-xs text-green-600 mt-0.5">{formatCurrency(invoiceStats.paidAmount)}</p>
        </div>
        
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs font-medium text-yellow-700 mb-1">Pending</p>
          <p className="text-lg font-extrabold text-yellow-900" style={{ fontFamily: 'var(--font-heading)' }}>
            {invoiceStats.pending}
          </p>
          <p className="text-xs text-yellow-600 mt-0.5">{formatCurrency(invoiceStats.pendingAmount)}</p>
        </div>
        
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs font-medium text-red-700 mb-1">Overdue</p>
          <p className="text-lg font-extrabold text-red-900" style={{ fontFamily: 'var(--font-heading)' }}>
            {invoiceStats.overdue}
          </p>
          <p className="text-xs text-red-600 mt-0.5">{formatCurrency(invoiceStats.overdueAmount)}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Collection Rate</span>
          <span className="text-sm font-bold text-gray-900">{paidPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${paidPercentage}%` }}
            role="progressbar"
            aria-valuenow={paidPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Collection rate: ${paidPercentage.toFixed(1)}%`}
          ></div>
        </div>
      </div>
      
      {/* Recent Invoices */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Recent Invoices</h4>
        <div className="space-y-2">
          {recentInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{invoice.id}</span>
                  <span className={cn('px-2 py-0.5 text-xs font-bold rounded-full', getStatusColor(invoice.status))}>
                    {invoice.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{invoice.client} • Due {invoice.dueDate}</p>
              </div>
              <span className="text-sm font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(invoice.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
          Create Invoice
        </button>
        <button className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
          View All
        </button>
      </div>
    </div>
  );
};
