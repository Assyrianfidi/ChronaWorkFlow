/**
 * AP Dashboard Component
 * Accounts Payable overview with metrics and aging
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { useView } from "@/contexts/ViewContext";
import {
  DollarSign,
  TrendingDown,
  Clock,
  AlertCircle,
  Users,
  FileText,
  ArrowUpRight,
  Building2,
} from "lucide-react";

interface APMetrics {
  totalOutstanding: number;
  billsLast30Days: number;
  overdueAmount: number;
  billsToPay: number;
}

interface APAgingBucket {
  bucket: string;
  amount: number;
  billCount: number;
}

const APDashboard: React.FC = () => {
  const { toast } = useToast();
  const { mainViewConfig } = useView();

  // Fetch AP metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<APMetrics>({
    queryKey: ["ap-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/ap/dashboard");
      if (!response.ok) throw new Error("Failed to fetch AP metrics");
      const data = await response.json();
      return data.data;
    },
  });

  // Fetch aging report
  const { data: aging, isLoading: agingLoading } = useQuery<APAgingBucket[]>({
    queryKey: ["ap-aging"],
    queryFn: async () => {
      const response = await fetch("/api/ap/aging");
      if (!response.ok) throw new Error("Failed to fetch AP aging");
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
            {mainViewConfig.terminology.expenses || "Accounts Payable"}
          </h1>
          <p className="text-muted-foreground">
            Manage vendor bills and payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Vendors
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Bills
          </Button>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Pay Bills
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
            <p className="text-xs text-muted-foreground">Bills to pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bills (30 days)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : metrics?.billsLast30Days || 0}
            </div>
            <p className="text-xs text-muted-foreground">New bills received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metricsLoading
                ? "..."
                : formatCurrency(metrics?.overdueAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Pay</CardTitle>
            <Clock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metricsLoading ? "..." : metrics?.billsToPay || 0}
            </div>
            <p className="text-xs text-muted-foreground">Approved bills</p>
          </CardContent>
        </Card>
      </div>

      {/* AP Aging */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              AP Aging
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
                <div
                  key={bucket.bucket}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="font-medium">{bucket.bucket}</span>
                  <div className="flex items-center gap-8">
                    <span className="text-sm text-muted-foreground">
                      {bucket.billCount} bills
                    </span>
                    <span
                      className={`font-bold w-32 text-right ${
                        bucket.bucket === "Current"
                          ? "text-emerald-600"
                          : bucket.bucket.includes("90")
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {formatCurrency(bucket.amount)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center justify-between">
                <span className="font-bold text-lg">Total Payables</span>
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

export default APDashboard;
