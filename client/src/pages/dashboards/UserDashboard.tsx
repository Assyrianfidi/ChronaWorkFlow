import * as React from "react";
import { useAuth } from "../../contexts/AuthContext";
import useSWR from "swr";
import { DashboardMetricCard, ActivityFeed } from "../../components/dashboard";
import {
  User,
  FileText,
  Bell,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";

interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "glass";
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-soft transition-transform transition-shadow duration-150",
        {
          "hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "default",
          "hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "elevated",
          "border-2 hover:-translate-y-[2px] hover:shadow-elevated":
            variant === "outlined",
          "bg-card/90 backdrop-blur-sm hover:-translate-y-[1px] hover:shadow-elevated":
            variant === "glass",
        },
        className,
      )}
      {...props}
    />
  ),
);

EnterpriseCard.displayName = "EnterpriseCard";

interface UserActivity {
  id: string;
  type: "login" | "document" | "task" | "notification";
  message: string;
  timestamp: string;
  status?: "completed" | "pending" | "overdue";
}

interface UserStats {
  documentsCreated: number;
  tasksCompleted: number;
  notificationsCount: number;
  lastLogin: string;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch user dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useSWR<{
    success: boolean;
    data: {
      stats: UserStats;
      activity: UserActivity[];
    };
  }>("/api/dashboard/user", async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    return response.json();
  });

  const stats = dashboardData?.data?.stats;
  const activity = dashboardData?.data?.activity;
  const statsLoading = isLoading;
  const activityLoading = isLoading;
  const activityError = error;

  const metrics = [
    {
      title: "Documents Created",
      value: stats?.documentsCreated || 0,
      change: "+3",
      changeType: "increase" as const,
      icon: FileText,
      color: "text-muted-foreground",
    },
    {
      title: "Tasks Completed",
      value: stats?.tasksCompleted || 0,
      change: "+5",
      changeType: "increase" as const,
      icon: CheckCircle,
      color: "text-muted-foreground",
    },
    {
      title: "Notifications",
      value: stats?.notificationsCount || 0,
      change: "-2",
      changeType: "decrease" as const,
      icon: Bell,
      color: "text-muted-foreground",
    },
    {
      title: "Last Login",
      value: stats?.lastLogin
        ? new Date(stats.lastLogin).toLocaleDateString()
        : "Today",
      change: "Active",
      changeType: "increase" as const,
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Personal Overview Header */}
        <header className="bg-card border border-border rounded-2xl shadow-soft px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              My Dashboard
            </h1>
            <p className="mt-1 text-sm opacity-80">
              A personalized view of your recent activity, tasks, and
              notifications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statsLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2 w-16 bg-muted rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="text-xs md:text-sm opacity-80 text-right">
                  <div>Signed in as</div>
                  <div className="font-medium">{user?.name}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* User KPI Stat Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading
            ? [0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-2xl shadow-soft p-6 animate-pulse flex flex-col gap-3"
                >
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-7 w-20 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              ))
            : metrics.map((metric, index) => (
                <DashboardMetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  changeType={metric.changeType}
                  icon={metric.icon}
                  color={metric.color}
                  isLoading={statsLoading}
                />
              ))}
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Recent Activity & Notifications */}
          <div className="xl:col-span-2 space-y-6">
            {/* Recent Activity Feed */}
            <EnterpriseCard className="p-0 overflow-hidden">
              <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Recent Activity
                </h2>
                <span className="text-xs opacity-60">Last 48 hours</span>
              </div>
              <div className="px-6 pb-6">
                {activityLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((key) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 bg-muted border border-border rounded-xl p-3 animate-pulse shadow-soft"
                      >
                        <div className="w-8 h-8 rounded-full bg-background" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-48 bg-background rounded" />
                          <div className="h-2 w-28 bg-background rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ActivityFeed
                    activities={
                      activity?.map((item) => ({
                        id: item.id,
                        type: item.type,
                        message: item.message,
                        timestamp: item.timestamp,
                        user: user?.name,
                      })) || []
                    }
                    isLoading={activityLoading}
                    error={activityError}
                  />
                )}
              </div>
            </EnterpriseCard>

            {/* Notifications Panel */}
            <EnterpriseCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                  Notifications & Alerts
                </h2>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Personal
                </span>
              </div>
              {statsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((key) => (
                    <div
                      key={key}
                      className="bg-muted border border-border rounded-xl p-4 animate-pulse shadow-soft flex flex-col gap-2"
                    >
                      <div className="h-3 w-40 bg-background rounded" />
                      <div className="h-2 w-24 bg-background rounded" />
                    </div>
                  ))}
                </div>
              ) : stats?.notificationsCount ? (
                <div className="space-y-2">
                  <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          You have {stats.notificationsCount} unread
                          notifications
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          Stay up to date with approvals, comments, and
                          reminders.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs opacity-70 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Just now
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 opacity-70">
                  You&apos;re all caught up. No new notifications.
                </div>
              )}
            </EnterpriseCard>
          </div>

          {/* Profile & User Quick Actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Profile Summary */}
            <EnterpriseCard className="p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
                Profile Summary
              </h2>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-3">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm opacity-80">{user?.email}</div>
                <div className="text-xs opacity-60 mt-2">
                  Role: {user?.role}
                </div>
              </div>
            </EnterpriseCard>

            {/* User Quick Actions */}
            <EnterpriseCard variant="elevated" className="p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border bg-card shadow-soft hover:bg-muted hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span>Update Profile</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border bg-card shadow-soft hover:bg-muted hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <span>Submit Report</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border bg-card shadow-soft hover:bg-muted hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>View Tasks</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm rounded-xl border border-border bg-card shadow-soft hover:bg-muted hover:-translate-y-[2px] hover:shadow-elevated transition-transform transition-shadow duration-150 flex items-center gap-3">
                  <Bell className="w-4 h-4" />
                  <span>Notification Preferences</span>
                </button>
              </div>
            </EnterpriseCard>
          </div>
        </section>

        {/* Assigned Tasks / Work Items Overview */}
        <section>
          <EnterpriseCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wide uppercase opacity-80">
                Assigned Tasks & Work Items
              </h2>
              <span className="text-xs opacity-60 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                This week
              </span>
            </div>
            {/* Simple tokenized summary tiles instead of raw boxes to avoid logic changes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                  Due Today
                </span>
                <span className="text-2xl font-semibold">3</span>
                <span className="text-xs opacity-70">Tasks to complete</span>
              </div>
              <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                  This Week
                </span>
                <span className="text-2xl font-semibold">7</span>
                <span className="text-xs opacity-70">Upcoming tasks</span>
              </div>
              <div className="bg-card border border-border rounded-xl shadow-soft p-4 flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                  Completed
                </span>
                <span className="text-2xl font-semibold">12</span>
                <span className="text-xs opacity-70">This month</span>
              </div>
            </div>
          </EnterpriseCard>
        </section>
      </div>
    </DashboardShell>
  );
};

export default UserDashboard;
