import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { ownerApi } from "@/api";

type SystemHealthStatus = "healthy" | "unhealthy" | "unknown";

type OwnerOverview = {
  totalCompanies: number;
  totalUsers: number;
  activeSubscriptionsByTier: Record<string, number>;
  mrr: number;
  arr: number;
  churnRate: number;
  trialToPaidConversion: number;
  aiUsageRevenue: number;
  failedPayments: number;
  systemHealth: {
    api: SystemHealthStatus;
    db: SystemHealthStatus;
    workers: SystemHealthStatus;
  };
};

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(2)}%`;
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "$0";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function HealthBadge({ status }: { status: SystemHealthStatus }) {
  const variant =
    status === "healthy" ? "default" : status === "unhealthy" ? "destructive" : "secondary";

  const label = status === "healthy" ? "Healthy" : status === "unhealthy" ? "Unhealthy" : "Unknown";

  return <Badge variant={variant}>{label}</Badge>;
}

export default function OwnerDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["owner-overview"],
    queryFn: async (): Promise<OwnerOverview> => {
      const response = await ownerApi.getOverview();
      return response.data as OwnerOverview;
    },
  });

  const activeSubscribers = React.useMemo(() => {
    const tiers = data?.activeSubscriptionsByTier ?? {};
    return Object.values(tiers).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [data?.activeSubscriptionsByTier]);

  return (
    <OwnerLayout
      title="Owner Overview"
      subtitle="Enterprise-grade visibility across subscriptions, risk, and platform health"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Companies</CardTitle>
              <CardDescription>Registered organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {isLoading ? "…" : (data?.totalCompanies ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Users</CardTitle>
              <CardDescription>All seats across platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {isLoading ? "…" : (data?.totalUsers ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Subscribers</CardTitle>
              <CardDescription>Active + trialing subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {isLoading ? "…" : activeSubscribers.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">MRR</CardTitle>
              <CardDescription>Monthly recurring revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {isLoading ? "…" : formatMoney(data?.mrr ?? 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ARR</CardTitle>
              <CardDescription>Annual run rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {isLoading ? "…" : formatMoney(data?.arr ?? 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">AI Usage Revenue</CardTitle>
              <CardDescription>Last 30 days (billed)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {isLoading ? "…" : formatMoney(data?.aiUsageRevenue ?? 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Subscription Mix</CardTitle>
              <CardDescription>Active subscriptions by tier</CardDescription>
            </CardHeader>
            <CardContent>
              {isError ? (
                <div className="text-sm text-destructive dark:text-destructive-500">
                  Failed to load overview.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {Object.entries(data?.activeSubscriptionsByTier ?? {}).map(([tier, count]) => (
                    <div key={tier} className="rounded-lg border bg-card p-4">
                      <div className="text-xs font-medium text-muted-foreground">{tier}</div>
                      <div className="mt-1 text-2xl font-semibold">{count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk & Health</CardTitle>
              <CardDescription>Operational signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Failed payments</div>
                <div className="text-sm font-semibold">
                  {isLoading ? "…" : (data?.failedPayments ?? 0).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Churn rate</div>
                <div className="text-sm font-semibold">
                  {isLoading ? "…" : formatPercent(data?.churnRate ?? 0)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Trial → Paid</div>
                <div className="text-sm font-semibold">
                  {isLoading ? "…" : formatPercent(data?.trialToPaidConversion ?? 0)}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-card p-3">
                <div className="text-xs font-medium text-muted-foreground">System health</div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm">API</div>
                  <HealthBadge status={data?.systemHealth?.api ?? "unknown"} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm">DB</div>
                  <HealthBadge status={data?.systemHealth?.db ?? "unknown"} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm">Workers</div>
                  <HealthBadge status={data?.systemHealth?.workers ?? "unknown"} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}
