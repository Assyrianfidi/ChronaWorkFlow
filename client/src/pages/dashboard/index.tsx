import { useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { apiRequest } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";

type Report = {
  id: number;
  title: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's reports
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: () => apiRequest.get("/reports"),
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <DashboardShell>
      <header className="bg-surface0 border-b border-border-gray shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              AccuBooks Dashboard
            </h1>
            <p className="mt-1 text-sm opacity-80">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Here is your
              current reporting pulse.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-surface0 text-black border border-border-gray rounded-full px-4 py-2 text-sm font-medium transition-transform transition-shadow duration-150 hover:-translate-y-[1px] hover:shadow-elevated"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-surface1">
        <div className="container mx-auto px-6 py-6 max-w-7xl space-y-6">
          {/* Hero / Overview */}
          <section className="bg-surface2 border border-border-gray rounded-2xl shadow-soft p-6 md:p-8 md:flex md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold">
                Reporting Overview
              </h2>
              <p className="text-sm opacity-80 max-w-2xl">
                Track your recent submissions, approvals, and review activity in
                one unified console before jumping into your role-specific
                workspace.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-4">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Total Reports
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {isLoading ? "…" : reports?.length || 0}
                  </p>
                </div>
                <div className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-4">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Pending Approval
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {isLoading
                      ? "…"
                      : reports?.filter((r) => r.status === "pending").length ||
                        0}
                  </p>
                </div>
                <div className="bg-surface1 border border-border-gray rounded-xl shadow-soft p-4">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Last Sync
                  </p>
                  <p className="mt-2 text-sm">
                    {isLoading ? "Syncing activity…" : "Updated today"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col items-stretch gap-3 w-full md:w-auto md:max-w-xs">
              <Button
                className="w-full bg-primary-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft hover:shadow-elevated hover:-translate-y-[1px] transition-transform transition-shadow duration-150"
                onClick={() => navigate("/reports/new")}
              >
                Create New Report
              </Button>
              <Button
                variant="outline"
                className="w-full bg-surface0 text-black border border-border-gray rounded-full px-5 py-2.5 text-sm font-medium hover:-translate-y-[1px] hover:shadow-elevated transition-transform transition-shadow duration-150"
                onClick={() => navigate("/reports")}
              >
                View All Reports
              </Button>
            </div>
          </section>

          {/* KPI Summary Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-surface2 border border-border-gray rounded-2xl shadow-soft p-6 transition-transform transition-shadow duration-150 hover:-translate-y-[1px] hover:shadow-elevated">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-sm font-medium tracking-wide uppercase opacity-80">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-3xl font-semibold">
                  {isLoading ? "…" : reports?.length || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface2 border border-border-gray rounded-2xl shadow-soft p-6 transition-transform transition-shadow duration-150 hover:-translate-y-[1px] hover:shadow-elevated">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-sm font-medium tracking-wide uppercase opacity-80">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-3xl font-semibold">
                  {isLoading
                    ? "…"
                    : reports?.filter((r) => r.status === "pending").length ||
                      0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface2 border border-border-gray rounded-2xl shadow-soft p-6 transition-transform transition-shadow duration-150 hover:-translate-y-[1px] hover:shadow-elevated">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-sm font-medium tracking-wide uppercase opacity-80">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm opacity-80">
                  {isLoading ? "Loading…" : "Last updated today"}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Recent Reports */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold">
                Recent Reports
              </h2>
              <Button
                variant="outline"
                className="bg-surface0 text-black border border-border-gray rounded-full px-4 py-2 text-xs md:text-sm font-medium hover:-translate-y-[1px] hover:shadow-elevated transition-transform transition-shadow duration-150"
                onClick={() => navigate("/reports")}
              >
                Open Reports Workspace
              </Button>
            </div>
            <div className="bg-surface2 border border-border-gray rounded-2xl shadow-soft overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[0, 1, 2].map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 bg-surface2 border border-border-gray rounded-xl p-4 animate-pulse shadow-soft"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 bg-surface1 rounded" />
                        <div className="h-2 w-24 bg-surface1 rounded" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-6 w-20 bg-surface1 rounded-full" />
                        <div className="h-4 w-16 bg-surface1 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reports?.length ? (
                <ul className="divide-y divide-border-gray">
                  {reports.map((report) => (
                    <li
                      key={report.id}
                      className="px-6 py-4 bg-surface2 hover:bg-surface1 transition-colors shadow-soft hover:shadow-elevated hover:-translate-y-[1px] duration-150"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-base font-medium truncate">
                            {report.title}
                          </h3>
                          <p className="mt-1 text-xs opacity-80">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border border-border-gray ${
                              report.status === "approved"
                                ? "bg-emerald-50 text-emerald-800"
                                : report.status === "rejected"
                                  ? "bg-rose-50 text-rose-800"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {report.status.charAt(0).toUpperCase() +
                              report.status.slice(1)}
                          </span>
                          <span className="font-semibold">
                            $
                            {report.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6">
                  <EmptyState size="sm" title="No reports found" />
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </DashboardShell>
  );
}
