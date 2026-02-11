import React, { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface FinancialMetrics {
  cashBalance: number;
  runwayDays: number;
  burnRate: number;
  riskScore: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
}

interface FinancialDashboardProps {
  tenantId?: string;
  className?: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  tenantId,
  className = "",
}) => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch financial metrics from API
        const response = await fetch("/api/forecasts/metrics", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch financial metrics");
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("Error fetching financial metrics:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialMetrics();
  }, [tenantId]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskLevel = (
    score: number,
  ): {
    variant: "default" | "success" | "warning" | "danger";
    label: string;
  } => {
    if (score < 25) return { variant: "success", label: "Low Risk" };
    if (score < 50) return { variant: "default", label: "Moderate Risk" };
    if (score < 75) return { variant: "warning", label: "High Risk" };
    return { variant: "danger", label: "Critical Risk" };
  };

  const getRunwayStatus = (
    days: number,
  ): {
    trend: "up" | "down" | "neutral";
    variant: "default" | "success" | "warning" | "danger";
  } => {
    if (days > 180) return { trend: "up", variant: "success" };
    if (days > 90) return { trend: "neutral", variant: "default" };
    if (days > 30) return { trend: "down", variant: "warning" };
    return { trend: "down", variant: "danger" };
  };

  if (loading) {
    return (
      <div className={className}>
        <LoadingState label="Loading financial dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertCircle className="w-6 h-6" />}
            title="Unable to load financial data"
            description={error}
          />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<DollarSign className="w-6 h-6" />}
            title="No financial data available"
            description="Connect your accounting system to see financial metrics"
          />
        </CardContent>
      </Card>
    );
  }

  const riskLevel = getRiskLevel(metrics.riskScore);
  const runwayStatus = getRunwayStatus(metrics.runwayDays);

  return (
    <div className={className}>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-gray-600 mt-2">
          Real-time financial metrics and forecasts for your business
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Cash Balance"
          value={formatCurrency(metrics.cashBalance)}
          subtitle="Current available cash"
          icon={
            <DollarSign className="w-6 h-6 text-green-600" aria-hidden="true" />
          }
          variant="default"
        />

        <KPICard
          title="Cash Runway"
          value={`${metrics.runwayDays} days`}
          subtitle={`${Math.floor(metrics.runwayDays / 30)} months remaining`}
          trend={runwayStatus.trend}
          trendValue={
            runwayStatus.trend === "up"
              ? "Healthy"
              : runwayStatus.trend === "down"
                ? "Critical"
                : "Moderate"
          }
          icon={
            <Calendar className="w-6 h-6 text-blue-600" aria-hidden="true" />
          }
          variant={runwayStatus.variant}
        />

        <KPICard
          title="Monthly Burn Rate"
          value={formatCurrency(metrics.burnRate)}
          subtitle="Average monthly expenses"
          trend="neutral"
          icon={
            <TrendingUp
              className="w-6 h-6 text-orange-600"
              aria-hidden="true"
            />
          }
          variant="default"
        />

        <KPICard
          title="Risk Score"
          value={metrics.riskScore}
          subtitle={riskLevel.label}
          icon={
            <AlertTriangle
              className={`w-6 h-6 ${
                riskLevel.variant === "success"
                  ? "text-green-600"
                  : riskLevel.variant === "warning"
                    ? "text-yellow-600"
                    : riskLevel.variant === "danger"
                      ? "text-red-600"
                      : "text-gray-600"
              }`}
              aria-hidden="true"
            />
          }
          variant={riskLevel.variant}
        />
      </div>

      {metrics.monthlyRevenue !== undefined &&
        metrics.monthlyExpenses !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.monthlyRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(metrics.monthlyExpenses)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Net Cash Flow</p>
                  <p
                    className={`text-2xl font-bold ${
                      metrics.monthlyRevenue - metrics.monthlyExpenses >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      metrics.monthlyRevenue - metrics.monthlyExpenses,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default FinancialDashboard;
