/**
 * Anomaly Alerts Component
 * Displays alerts for duplicate/unusual transactions with AI-powered detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Check,
  X,
  Clock,
  DollarSign,
  Copy,
  TrendingUp,
  Calendar,
  Hash,
  Zap,
  Shield,
  Bell,
  BellOff,
} from 'lucide-react';

interface Anomaly {
  id: string;
  type: 'duplicate' | 'unusual_amount' | 'mis_categorized' | 'round_number' | 'weekend' | 'split' | 'sequential_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  transactionId: string;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  category: string;
  metadata: {
    deviation?: number;
    expectedRange?: { min: number; max: number };
    relatedTransactionIds?: string[];
    suggestedCategory?: string;
    reason?: string;
  };
  suggestedAction: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

interface AnomalySummary {
  totalAnomalies: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  pendingCount: number;
  resolvedCount: number;
  dismissedCount: number;
}

const AnomalyAlerts: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [summary, setSummary] = useState<AnomalySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch anomalies from API
  const fetchAnomalies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/anomalies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch anomalies');

      const data = await response.json();
      setAnomalies(data.data.anomalies || []);
      setSummary(data.data.summary || null);
    } catch (err) {
      // Use mock data for demo
      const mockData = getMockAnomalies();
      setAnomalies(mockData.anomalies);
      setSummary(mockData.summary);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  // Scan for new anomalies
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/ai/anomalies/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Scan failed');

      await fetchAnomalies();
    } catch (err) {
      // Demo: just refresh
      await fetchAnomalies();
    } finally {
      setIsScanning(false);
    }
  };

  // Resolve anomaly
  const handleResolve = async (anomalyId: string, resolutionType: string) => {
    try {
      const response = await fetch(`/api/ai/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          resolution: resolutionType,
          notes: resolution,
        }),
      });

      if (!response.ok) throw new Error('Failed to resolve');

      setAnomalies(anomalies.map(a =>
        a.id === anomalyId
          ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString(), resolution: resolutionType }
          : a
      ));
      setShowResolveModal(false);
      setSelectedAnomaly(null);
      setResolution('');
    } catch (err) {
      // Demo mode
      setAnomalies(anomalies.map(a =>
        a.id === anomalyId
          ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString(), resolution: resolutionType }
          : a
      ));
      setShowResolveModal(false);
      setSelectedAnomaly(null);
      setResolution('');
    }
  };

  // Dismiss anomaly
  const handleDismiss = async (anomalyId: string) => {
    try {
      await fetch(`/api/ai/anomalies/${anomalyId}/dismiss`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setAnomalies(anomalies.map(a =>
        a.id === anomalyId ? { ...a, status: 'dismissed' } : a
      ));
    } catch (err) {
      setAnomalies(anomalies.map(a =>
        a.id === anomalyId ? { ...a, status: 'dismissed' } : a
      ));
    }
  };

  // Filter anomalies
  const filteredAnomalies = anomalies.filter(anomaly => {
    const matchesType = filterType === 'all' || anomaly.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || anomaly.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || anomaly.status === filterStatus;
    const matchesSearch = anomaly.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anomaly.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSeverity && matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'duplicate': return <Copy className="w-4 h-4" />;
      case 'unusual_amount': return <TrendingUp className="w-4 h-4" />;
      case 'mis_categorized': return <AlertCircle className="w-4 h-4" />;
      case 'round_number': return <Hash className="w-4 h-4" />;
      case 'weekend': return <Calendar className="w-4 h-4" />;
      case 'split': return <Zap className="w-4 h-4" />;
      case 'sequential_gap': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: Anomaly['type']) => {
    const labels: Record<string, string> = {
      duplicate: 'Duplicate',
      unusual_amount: 'Unusual Amount',
      mis_categorized: 'Mis-categorized',
      round_number: 'Round Number',
      weekend: 'Weekend Transaction',
      split: 'Split Transaction',
      sequential_gap: 'Sequential Gap',
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: Anomaly['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-7 h-7 text-orange-600" />
                Anomaly Detection
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                AI-powered detection of duplicate and unusual transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-lg ${
                  notificationsEnabled
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title={notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Anomalies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {summary.totalAnomalies}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                    {summary.pendingCount}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {summary.resolvedCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {summary.bySeverity.critical || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search anomalies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Types</option>
                <option value="duplicate">Duplicates</option>
                <option value="unusual_amount">Unusual Amounts</option>
                <option value="mis_categorized">Mis-categorized</option>
                <option value="round_number">Round Numbers</option>
                <option value="weekend">Weekend</option>
                <option value="split">Split</option>
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anomaly List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading anomalies...</p>
            </div>
          ) : filteredAnomalies.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-900 dark:text-white font-medium mb-1">No anomalies found</p>
              <p className="text-gray-500 dark:text-gray-400">
                {filterStatus === 'pending' ? 'All anomalies have been reviewed!' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                  anomaly.severity === 'critical'
                    ? 'border-red-300 dark:border-red-700'
                    : anomaly.severity === 'high'
                    ? 'border-orange-300 dark:border-orange-700'
                    : 'border-gray-200 dark:border-gray-700'
                } overflow-hidden`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                        {getTypeIcon(anomaly.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {anomaly.description}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                            {anomaly.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(anomaly.status)}`}>
                            {anomaly.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(anomaly.amount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(anomaly.date)}
                          </span>
                          <span>{anomaly.vendor}</span>
                          <span className="text-blue-600 dark:text-blue-400">{anomaly.category}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          <strong>Suggested Action:</strong> {anomaly.suggestedAction}
                        </p>
                        {anomaly.metadata.deviation && (
                          <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                            Amount is {anomaly.metadata.deviation.toFixed(1)}x the typical range
                          </p>
                        )}
                        {anomaly.metadata.relatedTransactionIds && anomaly.metadata.relatedTransactionIds.length > 0 && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Related to {anomaly.metadata.relatedTransactionIds.length} other transaction(s)
                          </p>
                        )}
                      </div>
                    </div>

                    {anomaly.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAnomaly(anomaly);
                            setShowResolveModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDismiss(anomaly.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Type:</span> {getTypeLabel(anomaly.type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Confidence:</span> {(anomaly.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Transaction ID:</span> {anomaly.transactionId}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resolve Modal */}
        {showResolveModal && selectedAnomaly && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Resolve Anomaly
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedAnomaly.description}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolution Type
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleResolve(selectedAnomaly.id, 'confirmed_valid')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Confirmed Valid</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Transaction is legitimate</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleResolve(selectedAnomaly.id, 'corrected')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Corrected</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Issue has been fixed</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleResolve(selectedAnomaly.id, 'deleted')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Deleted</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Transaction was removed</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Add any notes about this resolution..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedAnomaly(null);
                    setResolution('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for demo
function getMockAnomalies(): { anomalies: Anomaly[]; summary: AnomalySummary } {
  const anomalies: Anomaly[] = [
    {
      id: 'anom_1',
      type: 'duplicate',
      severity: 'high',
      confidence: 0.95,
      transactionId: 'txn_abc123',
      description: 'Potential duplicate payment to Amazon Web Services',
      amount: 1500.00,
      date: '2024-12-18T00:00:00Z',
      vendor: 'Amazon Web Services',
      category: 'Software & Subscriptions',
      metadata: {
        relatedTransactionIds: ['txn_abc122'],
        reason: 'Same amount and vendor within 24 hours',
      },
      suggestedAction: 'Review both transactions and void if duplicate',
      status: 'pending',
    },
    {
      id: 'anom_2',
      type: 'unusual_amount',
      severity: 'critical',
      confidence: 0.92,
      transactionId: 'txn_def456',
      description: 'Unusually large payment to Office Supplies vendor',
      amount: 15000.00,
      date: '2024-12-17T00:00:00Z',
      vendor: 'Staples Business',
      category: 'Office Supplies',
      metadata: {
        deviation: 8.5,
        expectedRange: { min: 500, max: 2000 },
        reason: 'Amount is 8.5x higher than typical',
      },
      suggestedAction: 'Verify this purchase was authorized',
      status: 'pending',
    },
    {
      id: 'anom_3',
      type: 'mis_categorized',
      severity: 'medium',
      confidence: 0.88,
      transactionId: 'txn_ghi789',
      description: 'Transaction may be incorrectly categorized',
      amount: 299.99,
      date: '2024-12-16T00:00:00Z',
      vendor: 'Adobe Systems',
      category: 'Office Supplies',
      metadata: {
        suggestedCategory: 'Software & Subscriptions',
        reason: 'Vendor typically associated with software',
      },
      suggestedAction: 'Re-categorize to Software & Subscriptions',
      status: 'pending',
    },
    {
      id: 'anom_4',
      type: 'round_number',
      severity: 'low',
      confidence: 0.75,
      transactionId: 'txn_jkl012',
      description: 'Suspiciously round payment amount',
      amount: 5000.00,
      date: '2024-12-15T00:00:00Z',
      vendor: 'Consulting Services LLC',
      category: 'Professional Services',
      metadata: {
        reason: 'Exact round number may indicate estimate or fraud',
      },
      suggestedAction: 'Verify invoice matches payment',
      status: 'pending',
    },
    {
      id: 'anom_5',
      type: 'duplicate',
      severity: 'high',
      confidence: 0.91,
      transactionId: 'txn_mno345',
      description: 'Duplicate vendor payment detected',
      amount: 850.00,
      date: '2024-12-14T00:00:00Z',
      vendor: 'Google Cloud Platform',
      category: 'Cloud Services',
      metadata: {
        relatedTransactionIds: ['txn_mno344'],
        reason: 'Same vendor and similar amount within 48 hours',
      },
      suggestedAction: 'Review and potentially void duplicate',
      status: 'resolved',
      resolvedAt: '2024-12-15T10:30:00Z',
      resolution: 'confirmed_valid',
    },
  ];

  const summary: AnomalySummary = {
    totalAnomalies: 5,
    byType: {
      duplicate: 2,
      unusual_amount: 1,
      mis_categorized: 1,
      round_number: 1,
    },
    bySeverity: {
      critical: 1,
      high: 2,
      medium: 1,
      low: 1,
    },
    pendingCount: 4,
    resolvedCount: 1,
    dismissedCount: 0,
  };

  return { anomalies, summary };
}

export default AnomalyAlerts;
