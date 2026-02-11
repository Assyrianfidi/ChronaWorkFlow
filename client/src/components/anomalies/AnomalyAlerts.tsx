/**
 * Anomaly Alerts Component
 * Displays alerts for duplicate/unusual transactions with AI-powered detection
 */

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Check,
  X,
  Clock,
  DollarSign,
  Copy,
  TrendingUp,
  Calendar,
  Hash,
  Zap,
  Bell,
  BellOff,
} from "lucide-react";

interface Anomaly {
  id: string;
  type:
    | "duplicate"
    | "unusual_amount"
    | "mis_categorized"
    | "round_number"
    | "weekend"
    | "split"
    | "sequential_gap";
  severity: "low" | "medium" | "high" | "critical";
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
  status: "pending" | "resolved" | "dismissed";
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
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch anomalies from API
  const fetchAnomalies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/anomalies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch anomalies");

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
      const response = await fetch("/api/ai/anomalies/scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Scan failed");

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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          resolution: resolutionType,
          notes: resolution,
        }),
      });

      if (!response.ok) throw new Error("Failed to resolve");

      setAnomalies(
        anomalies.map((a) =>
          a.id === anomalyId
            ? {
                ...a,
                status: "resolved",
                resolvedAt: new Date().toISOString(),
                resolution: resolutionType,
              }
            : a,
        ),
      );
      setShowResolveModal(false);
      setSelectedAnomaly(null);
      setResolution("");
    } catch (err) {
      // Demo mode
      setAnomalies(
        anomalies.map((a) =>
          a.id === anomalyId
            ? {
                ...a,
                status: "resolved",
                resolvedAt: new Date().toISOString(),
                resolution: resolutionType,
              }
            : a,
        ),
      );
      setShowResolveModal(false);
      setSelectedAnomaly(null);
      setResolution("");
    }
  };

  // Dismiss anomaly
  const handleDismiss = async (anomalyId: string) => {
    try {
      await fetch(`/api/ai/anomalies/${anomalyId}/dismiss`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setAnomalies(
        anomalies.map((a) =>
          a.id === anomalyId ? { ...a, status: "dismissed" } : a,
        ),
      );
    } catch (err) {
      setAnomalies(
        anomalies.map((a) =>
          a.id === anomalyId ? { ...a, status: "dismissed" } : a,
        ),
      );
    }
  };

  // Filter anomalies
  const filteredAnomalies = anomalies.filter((anomaly) => {
    const matchesType = filterType === "all" || anomaly.type === filterType;
    const matchesSeverity =
      filterSeverity === "all" || anomaly.severity === filterSeverity;
    const matchesStatus =
      filterStatus === "all" || anomaly.status === filterStatus;
    const matchesSearch =
      anomaly.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anomaly.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSeverity && matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: Anomaly["type"]) => {
    switch (type) {
      case "duplicate":
        return <Copy className="w-4 h-4" />;
      case "unusual_amount":
        return <TrendingUp className="w-4 h-4" />;
      case "mis_categorized":
        return <AlertCircle className="w-4 h-4" />;
      case "round_number":
        return <Hash className="w-4 h-4" />;
      case "weekend":
        return <Calendar className="w-4 h-4" />;
      case "split":
        return <Zap className="w-4 h-4" />;
      case "sequential_gap":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: Anomaly["type"]) => {
    const labels: Record<string, string> = {
      duplicate: "Duplicate",
      unusual_amount: "Unusual Amount",
      mis_categorized: "Mis-categorized",
      round_number: "Round Number",
      weekend: "Weekend Transaction",
      split: "Split Transaction",
      sequential_gap: "Sequential Gap",
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: Anomaly["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-primary/10 text-primary";
      case "low":
        return "bg-muted text-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: Anomaly["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "resolved":
        return "bg-primary/10 text-primary";
      case "dismissed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityBorderClass = (severity: Anomaly["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-destructive/30";
      case "high":
        return "border-destructive/20";
      case "medium":
        return "border-primary/20";
      default:
        return "border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className={cn(notificationsEnabled && "bg-muted text-foreground")}
          title={
            notificationsEnabled ? "Notifications On" : "Notifications Off"
          }
        >
          {notificationsEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </Button>

        <Button type="button" onClick={handleScan} disabled={isScanning}>
          <RefreshCw className={cn("h-5 w-5", isScanning && "animate-spin")} />
          {isScanning ? "Scanning..." : "Scan Now"}
        </Button>
      </div>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Anomalies
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {summary.totalAnomalies}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {summary.pendingCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Resolved
                </p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {summary.resolvedCount}
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Critical Issues
                </p>
                <p className="mt-1 text-2xl font-semibold text-destructive">
                  {summary.bySeverity.critical || 0}
                </p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-4 text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-10 rounded-lg border border-input bg-background px-4 text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-10 rounded-lg border border-input bg-background px-4 text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-soft">
            <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading anomalies...</p>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-soft">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-primary" />
            <p className="mb-1 font-medium text-foreground">
              No anomalies found
            </p>
            <p className="text-muted-foreground">
              {filterStatus === "pending"
                ? "All anomalies have been reviewed!"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          filteredAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-card shadow-soft",
                getSeverityBorderClass(anomaly.severity),
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        getSeverityColor(anomaly.severity),
                      )}
                    >
                      {getTypeIcon(anomaly.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 truncate font-medium text-foreground">
                          {anomaly.description}
                        </h3>
                        <Badge
                          className={cn(
                            getSeverityColor(anomaly.severity),
                            "capitalize",
                          )}
                        >
                          {anomaly.severity}
                        </Badge>
                        <Badge
                          className={cn(
                            getStatusColor(anomaly.status),
                            "capitalize",
                          )}
                        >
                          {anomaly.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(anomaly.amount)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(anomaly.date)}
                        </span>
                        <span className="truncate">{anomaly.vendor}</span>
                        <span className="truncate">{anomaly.category}</span>
                      </div>

                      <p className="mt-2 text-sm text-foreground">
                        <strong>Suggested Action:</strong>{" "}
                        {anomaly.suggestedAction}
                      </p>

                      {anomaly.metadata.deviation && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Amount is {anomaly.metadata.deviation.toFixed(1)}x the
                          typical range
                        </p>
                      )}

                      {anomaly.metadata.relatedTransactionIds &&
                        anomaly.metadata.relatedTransactionIds.length > 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Related to{" "}
                            {anomaly.metadata.relatedTransactionIds.length}{" "}
                            other transaction(s)
                          </p>
                        )}
                    </div>
                  </div>

                  {anomaly.status === "pending" && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedAnomaly(anomaly);
                          setShowResolveModal(true);
                        }}
                      >
                        <Check className="h-4 w-4" />
                        Resolve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismiss(anomaly.id)}
                      >
                        <X className="h-4 w-4" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">Type:</span>{" "}
                    {getTypeLabel(anomaly.type)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">Confidence:</span>{" "}
                    {(anomaly.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">Transaction ID:</span>{" "}
                    {anomaly.transactionId}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30" />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-elevated">
            <div className="border-b border-border p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Resolve Anomaly
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedAnomaly.description}
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Resolution Type
                </label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 p-3 text-left"
                    onClick={() =>
                      handleResolve(selectedAnomaly.id, "confirmed_valid")
                    }
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        Confirmed Valid
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Transaction is legitimate
                      </p>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 p-3 text-left"
                    onClick={() =>
                      handleResolve(selectedAnomaly.id, "corrected")
                    }
                  >
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Corrected</p>
                      <p className="text-sm text-muted-foreground">
                        Issue has been fixed
                      </p>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 p-3 text-left"
                    onClick={() => handleResolve(selectedAnomaly.id, "deleted")}
                  >
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-foreground">Deleted</p>
                      <p className="text-sm text-muted-foreground">
                        Transaction was removed
                      </p>
                    </div>
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Notes (optional)
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Add any notes about this resolution..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="border-t border-border p-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedAnomaly(null);
                  setResolution("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock data for demo
function getMockAnomalies(): { anomalies: Anomaly[]; summary: AnomalySummary } {
  const anomalies: Anomaly[] = [
    {
      id: "anom_1",
      type: "duplicate",
      severity: "high",
      confidence: 0.95,
      transactionId: "txn_abc123",
      description: "Potential duplicate payment to Amazon Web Services",
      amount: 1500.0,
      date: "2024-12-18T00:00:00Z",
      vendor: "Amazon Web Services",
      category: "Software & Subscriptions",
      metadata: {
        relatedTransactionIds: ["txn_abc122"],
        reason: "Same amount and vendor within 24 hours",
      },
      suggestedAction: "Review both transactions and void if duplicate",
      status: "pending",
    },
    {
      id: "anom_2",
      type: "unusual_amount",
      severity: "critical",
      confidence: 0.92,
      transactionId: "txn_def456",
      description: "Unusually large payment to Office Supplies vendor",
      amount: 15000.0,
      date: "2024-12-17T00:00:00Z",
      vendor: "Staples Business",
      category: "Office Supplies",
      metadata: {
        deviation: 8.5,
        expectedRange: { min: 500, max: 2000 },
        reason: "Amount is 8.5x higher than typical",
      },
      suggestedAction: "Verify this purchase was authorized",
      status: "pending",
    },
    {
      id: "anom_3",
      type: "mis_categorized",
      severity: "medium",
      confidence: 0.88,
      transactionId: "txn_ghi789",
      description: "Transaction may be incorrectly categorized",
      amount: 299.99,
      date: "2024-12-16T00:00:00Z",
      vendor: "Adobe Systems",
      category: "Office Supplies",
      metadata: {
        suggestedCategory: "Software & Subscriptions",
        reason: "Vendor typically associated with software",
      },
      suggestedAction: "Re-categorize to Software & Subscriptions",
      status: "pending",
    },
    {
      id: "anom_4",
      type: "round_number",
      severity: "low",
      confidence: 0.75,
      transactionId: "txn_jkl012",
      description: "Suspiciously round payment amount",
      amount: 5000.0,
      date: "2024-12-15T00:00:00Z",
      vendor: "Consulting Services LLC",
      category: "Professional Services",
      metadata: {
        reason: "Exact round number may indicate estimate or fraud",
      },
      suggestedAction: "Verify invoice matches payment",
      status: "pending",
    },
    {
      id: "anom_5",
      type: "duplicate",
      severity: "high",
      confidence: 0.91,
      transactionId: "txn_mno345",
      description: "Duplicate vendor payment detected",
      amount: 850.0,
      date: "2024-12-14T00:00:00Z",
      vendor: "Google Cloud Platform",
      category: "Cloud Services",
      metadata: {
        relatedTransactionIds: ["txn_mno344"],
        reason: "Same vendor and similar amount within 48 hours",
      },
      suggestedAction: "Review and potentially void duplicate",
      status: "resolved",
      resolvedAt: "2024-12-15T10:30:00Z",
      resolution: "confirmed_valid",
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
