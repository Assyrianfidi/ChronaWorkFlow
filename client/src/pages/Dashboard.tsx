import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { MainLayout } from '../components/layout/MainLayout.js.js';
// @ts-ignore
import { DashboardShell } from '../components/ui/layout/DashboardShell.js.js';
// @ts-ignore
import { useAuth } from '../contexts/AuthContext.js.js';
import {
  KPICard,
  MetricCard,
  StatusCard,
} from '../components/ui/EnterpriseCards.js.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/EnterpriseCards.js.js';
// @ts-ignore
import { LoadingSpinner } from '../components/ui/EnterpriseLoading.js.js';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Target,
  Zap,
  Shield,
} from "lucide-react";

// @ts-ignore
const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);

  // Simulate loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface1">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const roleBasedKPIs = {
    admin: [
      {
        title: "Total Revenue",
        value: "$124,563",
        change: { value: "+12.5%", trend: "up" as const },
        icon: DollarSign,
        description: "vs last month",
      },
      {
        title: "Active Users",
        value: "1,234",
        change: { value: "+8.2%", trend: "up" as const },
        icon: Users,
        description: "registered users",
      },
      {
        title: "Total Invoices",
        value: "456",
        change: { value: "+3.1%", trend: "up" as const },
        icon: FileText,
        description: "this month",
      },
      {
        title: "System Health",
        value: "99.9%",
        change: { value: "0%", trend: "neutral" as const },
        icon: Activity,
        description: "uptime",
      },
    ],
    accountant: [
      {
        title: "Accounts Receivable",
        value: "$45,234",
        change: { value: "-5.2%", trend: "down" as const },
        icon: CreditCard,
        description: "outstanding",
      },
      {
        title: "Accounts Payable",
        value: "$23,456",
        change: { value: "+2.1%", trend: "up" as const },
        icon: CreditCard,
        description: "due this month",
      },
      {
        title: "Pending Invoices",
        value: "23",
        change: { value: "-12.3%", trend: "down" as const },
        icon: FileText,
        description: "awaiting payment",
      },
      {
        title: "Monthly Revenue",
        value: "$12,345",
        change: { value: "+8.7%", trend: "up" as const },
        icon: DollarSign,
        description: "current month",
      },
    ],
    business_owner: [
      {
        title: "Cash Flow",
        value: "$34,567",
        change: { value: "+15.3%", trend: "up" as const },
        icon: DollarSign,
        description: "positive flow",
      },
      {
        title: "Profit Margin",
        value: "23.5%",
        change: { value: "+2.1%", trend: "up" as const },
        icon: TrendingUp,
        description: "net profit",
      },
      {
        title: "Active Clients",
        value: "89",
        change: { value: "+4.2%", trend: "up" as const },
        icon: Users,
        description: "total clients",
      },
      {
        title: "Revenue Growth",
        value: "18.7%",
        change: { value: "+3.4%", trend: "up" as const },
        icon: BarChart3,
        description: "year over year",
      },
    ],
  };

  const kpis = roleBasedKPIs[user?.role || "admin"] || roleBasedKPIs.admin;

  const getQuickActions = () => {
    const baseActions = [
      {
        icon: FileText,
        label: "Create Invoice",
        description: "Generate new invoice",
        color: "primary",
      },
      {
        icon: Users,
        label: "Add Client",
        description: "New customer",
        color: "success",
      },
      {
        icon: BarChart3,
        label: "View Reports",
        description: "Analytics & insights",
        color: "warning",
      },
    ];

    const roleBasedActions = {
      admin: [
        {
          icon: Shield,
          label: "System Admin",
          description: "Manage settings",
          color: "error",
        },
      ],
      accountant: [
        {
          icon: CreditCard,
          label: "Reconciliation",
          description: "Match transactions",
          color: "info",
        },
      ],
      business_owner: [
        {
          icon: Target,
          label: "Set Goals",
          description: "Business targets",
          color: "primary",
        },
      ],
    };

    return [
      ...baseActions,
// @ts-ignore
      ...(roleBasedActions[user?.role as keyof typeof roleBasedActions] || []),
    ];
  };

  const quickActions = getQuickActions();

  const recentActivity = [
    {
      id: 1,
      type: "invoice",
      title: "Invoice #1234 created",
      description: "ABC Corp - Web Development Services",
      amount: "$2,345",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      type: "payment",
      title: "Payment received",
      description: "XYZ Inc - Monthly retainer",
      amount: "+$1,234",
      time: "1 hour ago",
      status: "success",
    },
    {
      id: 3,
      type: "client",
      title: "New client added",
      description: "Global Tech Solutions",
      amount: "ABC Corp",
      time: "3 hours ago",
      status: "info",
    },
    {
      id: 4,
      type: "alert",
      title: "Invoice overdue",
      description: "Invoice #1198 - 5 days overdue",
      amount: "$567",
      time: "5 hours ago",
      status: "warning",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return FileText;
      case "payment":
        return DollarSign;
      case "client":
        return Users;
      case "alert":
        return Activity;
      default:
        return FileText;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-success-600 bg-success-100";
      case "warning":
        return "text-warning-600 bg-warning-100";
      case "error":
        return "text-error-600 bg-error-100";
      default:
        return "text-primary-600 bg-primary-100";
    }
  };

  if (isLoading) {
    return (
      <MainLayout user={user}>
        <div className="space-y-6">
          <div className="h-8 w-64 rounded-xl bg-surface2 animate-pulse shadow-soft"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-surface2 animate-pulse shadow-soft border border-border-gray"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-2xl bg-surface2 animate-pulse shadow-soft border border-border-gray"></div>
            <div className="h-64 rounded-2xl bg-surface2 animate-pulse shadow-soft border border-border-gray"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Welcome back, {user?.name}
              <Zap className="w-6 h-6 text-primary-500" />
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your{" "}
              {user?.role === "admin"
                ? "system"
                : user?.role === "accountant"
                  ? "accounting"
                  : "business"}{" "}
              today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusCard
              status="online"
              title="System Status"
              description="All systems operational"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              description={kpi.description}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 bg-surface1 shadow-soft rounded-2xl border border-border-gray">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts for your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      className={cn(
                        "group flex items-center gap-3 p-4 rounded-xl bg-surface2 hover:bg-surface1 transition-all duration-200 shadow-soft hover:shadow-elevated hover:-translate-y-[1px]",
                        "border border-border-gray",
                        action.color === "primary" &&
                          "hover:border-primary-300 hover:bg-primary-50",
                        action.color === "success" &&
                          "hover:border-success-300 hover:bg-success-50",
                        action.color === "warning" &&
                          "hover:border-warning-300 hover:bg-warning-50",
                        action.color === "error" &&
                          "hover:border-error-300 hover:bg-error-50",
                        action.color === "info" &&
                          "hover:border-info-300 hover:bg-info-50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          action.color === "primary" &&
                            "bg-primary-100 text-primary-600 group-hover:bg-primary-200",
                          action.color === "success" &&
                            "bg-success-100 text-success-600 group-hover:bg-success-200",
                          action.color === "warning" &&
                            "bg-warning-100 text-warning-600 group-hover:bg-warning-200",
                          action.color === "error" &&
                            "bg-error-100 text-error-600 group-hover:bg-error-200",
                          action.color === "info" &&
                            "bg-info-100 text-info-600 group-hover:bg-info-200",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {action.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricCard
                title="Performance"
                metrics={[
                  {
                    label: "API Response",
                    value: "124ms",
                    color: "text-success-600",
                  },
                  {
                    label: "Database",
                    value: "99.9%",
                    color: "text-success-600",
                  },
                  { label: "Storage", value: "67%", color: "text-warning-600" },
                ]}
                size="sm"
              />
              <StatusCard
                status="online"
                title="Last Backup"
                description="2 hours ago"
                metrics={[
                  { label: "Size", value: "2.3 GB" },
                  { label: "Duration", value: "4 min" },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and important events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border-gray bg-surface2 hover:bg-surface1 transition-colors shadow-soft hover:shadow-elevated hover:-translate-y-[1px]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          getActivityColor(activity.status),
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          activity.status === "success" && "text-success-600",
                          activity.status === "warning" && "text-warning-600",
                          activity.status === "error" && "text-error-600",
                          activity.status === "info" && "text-primary-600",
                        )}
                      >
                        {activity.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export { Dashboard };
