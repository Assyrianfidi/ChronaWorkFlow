/**
 * Enhanced Financial Widgets with Real API Integration
 * Includes loading states, error handling, and Recharts visualizations
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
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { useProfitLoss, useBankAccounts, useInvoices } from '@/hooks/useFinancialData';
import { DataFetchWrapper, SkeletonWidget } from '@/components/ui/LoadingStates';
import { useFeatureFlag } from '@/contexts/FeatureFlagContext';
import { useRoleBasedUI } from '@/hooks/useRoleBasedUI';

interface WidgetProps {
  className?: string;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

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
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        )}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span>{Math.abs(percentage)}%</span>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">{period}</span>
    </div>
  );
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// PROFIT & LOSS WIDGET
// ============================================================================

export const ProfitLossWidget: React.FC<WidgetProps> = ({ className }) => {
  const { permissions } = useRoleBasedUI();
  const chartsEnabled = useFeatureFlag('FINANCIAL_DASHBOARD_CHARTS');
  const { data, isLoading, isError, error, refetch } = useProfitLoss();

  if (!permissions.canViewProfitLoss) {
    return null;
  }

  return (
    <DataFetchWrapper
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={() => refetch()}
      loadingComponent={<SkeletonWidget />}
    >
      {(profitData) => (
        <div className={cn('financial-card', className)}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'var(--font-heading)' }}>
                  Profit & Loss
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profitData.period}</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </button>
          </div>
          
          {/* Main Metrics */}
          <div className="space-y-6 mb-6">
            {/* Net Profit */}
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-black text-gray-900 dark:text-gray-100">
                  {formatCurrency(profitData.netProfit)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">Net Profit</span>
              </div>
              <MetricChange value={profitData.netProfit} percentage={profitData.trend} />
            </div>

            {/* Revenue & Expenses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(profitData.revenue)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(profitData.expenses)}
                </p>
              </div>
            </div>

            {/* Profit Margin */}
            {chartsEnabled && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profit Margin</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {profitData.profitMargin}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${profitData.profitMargin}%` }}
                    role="progressbar"
                    aria-valuenow={profitData.profitMargin}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {permissions.canExportReports && (
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                <Download className="w-4 h-4" aria-hidden="true" />
                Download
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                <Eye className="w-4 h-4" aria-hidden="true" />
                View Full Report
              </button>
            </div>
          )}
        </div>
      )}
    </DataFetchWrapper>
  );
};

// ============================================================================
// BANK ACCOUNTS WIDGET
// ============================================================================

export const BankAccountsWidget: React.FC<WidgetProps> = ({ className }) => {
  const { permissions } = useRoleBasedUI();
  const { data, isLoading, isError, error, refetch } = useBankAccounts();

  if (!permissions.canViewBankAccounts) {
    return null;
  }

  return (
    <DataFetchWrapper
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={() => refetch()}
      loadingComponent={<SkeletonWidget />}
    >
      {(accountsData) => (
        <div className={cn('financial-card', className)}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'var(--font-heading)' }}>
                  Bank Accounts
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {accountsData.accounts.length} accounts
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </button>
          </div>

          {/* Total Balance */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-black text-gray-900 dark:text-gray-100">
                {formatCurrency(accountsData.totalBalance)}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">Total</span>
            </div>
            <MetricChange value={accountsData.totalBalance} percentage={accountsData.totalChange} />
          </div>

          {/* Account List */}
          <div className="space-y-3 mb-6">
            {accountsData.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                    <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{account.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className={cn(
                    'text-xs font-semibold',
                    account.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {account.change >= 0 ? '+' : ''}{account.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <Eye className="w-4 h-4" aria-hidden="true" />
              Reconcile
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Account
            </button>
          </div>
        </div>
      )}
    </DataFetchWrapper>
  );
};

// ============================================================================
// INVOICES WIDGET
// ============================================================================

export const InvoicesWidget: React.FC<WidgetProps> = ({ className }) => {
  const { permissions } = useRoleBasedUI();
  const chartsEnabled = useFeatureFlag('FINANCIAL_DASHBOARD_CHARTS');
  const { data, isLoading, isError, error, refetch } = useInvoices();

  if (!permissions.canViewInvoices) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <DataFetchWrapper
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={data}
      onRetry={() => refetch()}
      loadingComponent={<SkeletonWidget />}
    >
      {(invoicesData) => (
        <div className={cn('financial-card', className)}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'var(--font-heading)' }}>
                  Invoices
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {invoicesData.summary.total} total invoices
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </button>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-black text-green-600 dark:text-green-400">
                {invoicesData.summary.paid}
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Paid</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                {invoicesData.summary.pending}
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-black text-red-600 dark:text-red-400">
                {invoicesData.summary.overdue}
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Overdue</p>
            </div>
          </div>

          {/* Collection Rate */}
          {chartsEnabled && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Rate</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {invoicesData.summary.collectionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${invoicesData.summary.collectionRate}%` }}
                  role="progressbar"
                  aria-valuenow={invoicesData.summary.collectionRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h4>
            {invoicesData.recentInvoices.slice(0, 3).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.customer}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.number}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
                <span className={cn('px-2 py-1 rounded-md text-xs font-semibold', getStatusColor(invoice.status))}>
                  {invoice.status}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {permissions.canCreateInvoice && (
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Create Invoice
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                <Eye className="w-4 h-4" aria-hidden="true" />
                View All
              </button>
            </div>
          )}
        </div>
      )}
    </DataFetchWrapper>
  );
};
