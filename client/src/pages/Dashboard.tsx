import * as React from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { MainLayout } from "../components/layout/MainLayout";
import { useAuth } from "../contexts/AuthContext";
import { KPICard } from "../components/ui/EnterpriseCards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/EnterpriseCards";
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Activity,
  Target,
  Shield,
} from "lucide-react";

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
    ADMIN: [
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
    ACCOUNTANT: [
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
    MANAGER: [
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

  const kpis = roleBasedKPIs[user?.role || "ADMIN"] || roleBasedKPIs.ADMIN;

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
      ADMIN: [
        {
          icon: Shield,
          label: "System Admin",
          description: "Manage settings",
          color: "error",
        },
      ],
      ACCOUNTANT: [
        {
          icon: CreditCard,
          label: "Reconciliation",
          description: "Match transactions",
          color: "info",
        },
      ],
      MANAGER: [
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
        <div className="p-6">
          <LoadingState size="sm" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard
            className="h-6 w-6 text-primary-600"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              description={kpi.description}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks based on your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex items-start gap-3 rounded-lg border border-border-gray bg-surface1 p-4 text-left shadow-soft hover:shadow-elevated transition-shadow duration-200"
                  aria-label={action.label}
                >
                  <action.icon
                    className="h-5 w-5 text-primary-600"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {action.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {action.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events across your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const Icon = getActivityIcon(item.type);
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border-gray bg-surface1 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full ${getActivityColor(item.status)}`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.amount}
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
export default Dashboard;
