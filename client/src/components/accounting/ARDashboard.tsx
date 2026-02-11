/**
 * AR Dashboard Component
 * Accounts Receivable overview with metrics and aging
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/useToast";
import { useView } from "@/contexts/ViewContext";
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface ARMetrics {
  totalOutstanding: number;
  receivedLast30Days: number;
  overdueAmount: number;
  totalCustomers: number;
}

interface AgingBucket {
  bucket: string;
  amount: number;
  invoiceCount: number;
}

const ARDashboard: React.FC = () => {
  const { toast } = useToast();
  const { mainViewConfig } = useView();

  // Fetch AR metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<ARMetrics>({
    queryKey: ["ar-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/ar/dashboard");
      if (!response.ok) throw new Error("Failed to fetch AR metrics");
      const data = await response.json();
      return data.data;
    },
  });

  // Fetch aging report
  const { data: aging, isLoading: agingLoading } = useQuery<AgingBucket[]>({
    queryKey: ["ar-aging"],
    queryFn: async () => {
      const response = await fetch("/api/ar/aging");
      if (!response.ok) throw new Error("Failed to fetch aging report");
      const data = await response.json();
      return data.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mainViewConfig.terminology.sales || "Accounts Receivable"}
          </h1>
          <p className="text-muted-foreground">
            Manage customer invoices and payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </Button>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Outstanding
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading
                ? "..."
                : formatCurrency(metrics?.totalOutstanding || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Received (30 days)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metricsLoading
                ? "..."
                : formatCurrency(metrics?.receivedLast30Days || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-600" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Amount
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metricsLoading
                ? "..."
                : formatCurrency(metrics?.overdueAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : metrics?.totalCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground">With open balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aging Report
            </CardTitle>
            <Badge variant="outline">As of today</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {agingLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {aging?.map((bucket) => (
                <div key={bucket.bucket} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{bucket.bucket}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {bucket.invoiceCount} invoices
                      </span>
                      <span className="text-sm font-bold w-24 text-right">
                        {formatCurrency(bucket.amount)}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={
                      aging.reduce((sum, b) => sum + b.amount, 0) > 0
                        ? (bucket.amount /
                            aging.reduce((sum, b) => sum + b.amount, 0)) *
                          100
                        : 0
                    }
                    className={`h-2 ${
                      bucket.bucket === "Current"
                        ? "bg-emerald-100"
                        : bucket.bucket.includes("30")
                          ? "bg-yellow-100"
                          : "bg-red-100"
                    }`}
                  />
                </div>
              ))}

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="font-bold">Total Outstanding</span>
                <span className="font-bold text-lg">
                  {formatCurrency(
                    aging?.reduce((sum, b) => sum + b.amount, 0) || 0,
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ARDashboard;
