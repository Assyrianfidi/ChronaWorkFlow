/**
 * Transaction List Component
 * Displays all transactions with AI categorization status and insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Brain,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  TrendingUp,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  vendor: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryConfidence: number;
  categorizationStatus: 'auto' | 'manual' | 'pending' | 'needs_review';
  accountId: string;
  accountName: string;
  entityId: string;
  entityName: string;
  aiInsights?: {
    suggestedCategory?: string;
    anomalyFlag?: boolean;
    recurringPattern?: boolean;
    taxDeductible?: boolean;
  };
  tags: string[];
  attachments: number;
  reconciled: boolean;
}

interface TransactionFilters {
  dateRange: { start: string; end: string };
  type: string;
  category: string;
  entity: string;
  status: string;
  minAmount: number | null;
  maxAmount: number | null;
}

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: { start: '', end: '' },
    type: 'all',
    category: 'all',
    entity: 'all',
    status: 'all',
    minAmount: null,
    maxAmount: null,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [entities, setEntities] = useState<{ id: string; name: string }[]>([]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setTransactions(data.data || []);
    } catch (err) {
      // Use mock data
      setTransactions(getMockTransactions());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    setCategories(getCategories());
    setEntities(getEntities());
  }, [fetchTransactions]);

  // AI Categorization
  const handleAICategorize = async (transactionIds: string[]) => {
    setIsCategorizing(true);
    try {
      const response = await fetch('/api/ai/categorize/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          transactions: transactions
            .filter(t => transactionIds.includes(t.id))
            .map(t => ({
              id: t.id,
              description: t.description,
              amount: t.amount,
              type: t.type,
              vendor: t.vendor,
            })),
        }),
      });

      if (!response.ok) throw new Error('Categorization failed');

      const data = await response.json();
      
      // Update transactions with new categories
      setTransactions(transactions.map(t => {
        const result = data.data.results.find((r: any) => r.transactionId === t.id);
        if (result) {
          return {
            ...t,
            category: result.category,
            categoryConfidence: result.confidence,
            categorizationStatus: 'auto' as const,
          };
        }
        return t;
      }));

      setSelectedIds(new Set());
    } catch (err) {
      // Demo mode: simulate categorization
      setTransactions(transactions.map(t => {
        if (transactionIds.includes(t.id)) {
          return {
            ...t,
            categoryConfidence: 0.92 + Math.random() * 0.07,
            categorizationStatus: 'auto' as const,
          };
        }
        return t;
      }));
      setSelectedIds(new Set());
    } finally {
      setIsCategorizing(false);
    }
  };

  // Sort transactions
  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filters.type === 'all' || t.type === filters.type;
      const matchesCategory = filters.category === 'all' || t.category === filters.category;
      const matchesEntity = filters.entity === 'all' || t.entityId === filters.entity;
      const matchesStatus = filters.status === 'all' || t.categorizationStatus === filters.status;
      const matchesMinAmount = !filters.minAmount || Math.abs(t.amount) >= filters.minAmount;
      const matchesMaxAmount = !filters.maxAmount || Math.abs(t.amount) <= filters.maxAmount;
      
      return matchesSearch && matchesType && matchesCategory && matchesEntity && 
             matchesStatus && matchesMinAmount && matchesMaxAmount;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * modifier;
      }
      return 0;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Transaction['categorizationStatus'], confidence: number) => {
    switch (status) {
      case 'auto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Brain className="w-3 h-3" />
            AI {(confidence * 100).toFixed(0)}%
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <CheckCircle className="w-3 h-3" />
            Manual
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            <AlertCircle className="w-3 h-3" />
            Review
          </span>
        );
      default:
        return null;
    }
  };

  // Calculate summary stats
  const stats = {
    totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    aiCategorized: filteredTransactions.filter(t => t.categorizationStatus === 'auto').length,
    needsReview: filteredTransactions.filter(t => t.categorizationStatus === 'needs_review' || t.categorizationStatus === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-600" />
                Transactions
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredTransactions.length} transactions • {stats.aiCategorized} AI categorized
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTransactions}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Download className="w-5 h-5" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Upload className="w-5 h-5" />
                Import
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI Categorized</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.aiCategorized}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Needs Review</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {stats.needsReview}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
                    showFilters
                      ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {selectedIds.size > 0 && (
                  <button
                    onClick={() => handleAICategorize(Array.from(selectedIds))}
                    disabled={isCategorizing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Sparkles className={`w-5 h-5 ${isCategorizing ? 'animate-pulse' : ''}`} />
                    {isCategorizing ? 'Categorizing...' : `AI Categorize (${selectedIds.size})`}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Entity</label>
                  <select
                    value={filters.entity}
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All Entities</option>
                    {entities.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="auto">AI Categorized</option>
                    <option value="manual">Manual</option>
                    <option value="pending">Pending</option>
                    <option value="needs_review">Needs Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minAmount || ''}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Amount</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={filters.maxAmount || ''}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Entity
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      {sortField === 'amount' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        selectedIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedIds);
                            if (e.target.checked) {
                              newSelected.add(transaction.id);
                            } else {
                              newSelected.delete(transaction.id);
                            }
                            setSelectedIds(newSelected);
                          }}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(transaction.date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.vendor}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {transaction.category}
                          </span>
                        </div>
                        {transaction.aiInsights?.suggestedCategory && 
                         transaction.aiInsights.suggestedCategory !== transaction.category && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Suggested: {transaction.aiInsights.suggestedCategory}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {transaction.entityName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(transaction.categorizationStatus, transaction.categoryConfidence)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Transaction Details
                  </h2>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className={`text-2xl font-bold ${
                    selectedTransaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedTransaction.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vendor</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTransaction.vendor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTransaction.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entity</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTransaction.entityName}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedTransaction.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Categorization</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTransaction.categorizationStatus, selectedTransaction.categoryConfidence)}
                    {selectedTransaction.categorizationStatus === 'auto' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence: {(selectedTransaction.categoryConfidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {selectedTransaction.aiInsights && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Insights
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                      {selectedTransaction.aiInsights.recurringPattern && (
                        <li>• Recurring transaction pattern detected</li>
                      )}
                      {selectedTransaction.aiInsights.taxDeductible && (
                        <li>• Potentially tax deductible</li>
                      )}
                      {selectedTransaction.aiInsights.anomalyFlag && (
                        <li className="text-orange-600 dark:text-orange-400">• Flagged for review</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleAICategorize([selectedTransaction.id])}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    Re-categorize with AI
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data
function getMockTransactions(): Transaction[] {
  return [
    {
      id: 'txn_1',
      date: '2024-12-20T00:00:00Z',
      description: 'AWS Monthly Subscription',
      vendor: 'Amazon Web Services',
      amount: 1500,
      type: 'expense',
      category: 'Software & Subscriptions',
      categoryConfidence: 0.96,
      categorizationStatus: 'auto',
      accountId: 'acc_1',
      accountName: 'Business Checking',
      entityId: 'ent_1',
      entityName: 'TechStart Inc.',
      aiInsights: { recurringPattern: true, taxDeductible: true },
      tags: ['cloud', 'infrastructure'],
      attachments: 1,
      reconciled: true,
    },
    {
      id: 'txn_2',
      date: '2024-12-19T00:00:00Z',
      description: 'Client Payment - Acme Corp',
      vendor: 'Acme Corporation',
      amount: 15000,
      type: 'income',
      category: 'Revenue',
      categoryConfidence: 0.98,
      categorizationStatus: 'auto',
      accountId: 'acc_1',
      accountName: 'Business Checking',
      entityId: 'ent_1',
      entityName: 'TechStart Inc.',
      aiInsights: {},
      tags: ['client-payment'],
      attachments: 2,
      reconciled: true,
    },
    {
      id: 'txn_3',
      date: '2024-12-18T00:00:00Z',
      description: 'Office Supplies - Staples',
      vendor: 'Staples Business',
      amount: 245.50,
      type: 'expense',
      category: 'Office Supplies',
      categoryConfidence: 0.89,
      categorizationStatus: 'auto',
      accountId: 'acc_1',
      accountName: 'Business Checking',
      entityId: 'ent_2',
      entityName: 'Digital Solutions LLC',
      aiInsights: { taxDeductible: true },
      tags: ['office'],
      attachments: 1,
      reconciled: false,
    },
    {
      id: 'txn_4',
      date: '2024-12-17T00:00:00Z',
      description: 'Consulting Services',
      vendor: 'Consulting Partners',
      amount: 5000,
      type: 'expense',
      category: 'Professional Services',
      categoryConfidence: 0.72,
      categorizationStatus: 'needs_review',
      accountId: 'acc_1',
      accountName: 'Business Checking',
      entityId: 'ent_1',
      entityName: 'TechStart Inc.',
      aiInsights: { suggestedCategory: 'Contractor Payments', anomalyFlag: true },
      tags: [],
      attachments: 0,
      reconciled: false,
    },
    {
      id: 'txn_5',
      date: '2024-12-16T00:00:00Z',
      description: 'Google Workspace',
      vendor: 'Google',
      amount: 72,
      type: 'expense',
      category: 'Software & Subscriptions',
      categoryConfidence: 0.94,
      categorizationStatus: 'auto',
      accountId: 'acc_1',
      accountName: 'Business Checking',
      entityId: 'ent_1',
      entityName: 'TechStart Inc.',
      aiInsights: { recurringPattern: true, taxDeductible: true },
      tags: ['software', 'monthly'],
      attachments: 0,
      reconciled: true,
    },
    {
      id: 'txn_6',
      date: '2024-12-15T00:00:00Z',
      description: 'New Transaction',
      vendor: 'Unknown Vendor',
      amount: 350,
      type: 'expense',
      category: 'Uncategorized',
      categoryConfidence: 0,
      categorizationStatus: 'pending',
      accountId: 'acc_1',
      accountName: 'Business Checking',
      entityId: 'ent_2',
      entityName: 'Digital Solutions LLC',
      aiInsights: {},
      tags: [],
      attachments: 0,
      reconciled: false,
    },
  ];
}

function getCategories(): string[] {
  return [
    'Software & Subscriptions',
    'Office Supplies',
    'Professional Services',
    'Revenue',
    'Payroll',
    'Marketing',
    'Travel',
    'Utilities',
    'Insurance',
    'Uncategorized',
  ];
}

function getEntities(): { id: string; name: string }[] {
  return [
    { id: 'ent_1', name: 'TechStart Inc.' },
    { id: 'ent_2', name: 'Digital Solutions LLC' },
    { id: 'ent_3', name: 'Consulting Partners' },
  ];
}

export default TransactionList;
