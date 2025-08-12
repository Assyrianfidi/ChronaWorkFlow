import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, FolderOpen, DollarSign, TrendingUp } from "lucide-react";

export default function MetricsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const metrics = [
    {
      title: "Total Workers",
      value: stats?.totalWorkers || 0,
      change: "+2 this month",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
    },
    {
      title: "Hours This Week",
      value: `${stats?.weeklyHours || 0}`,
      change: "+12% vs last week",
      icon: Clock,
      iconBg: "bg-green-100",
      iconColor: "text-accent",
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      change: "6 due this week",
      icon: FolderOpen,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Monthly Revenue",
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      change: "+8% vs last month",
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-accent",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{metric.value}</p>
                  <p className="text-accent text-sm mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {metric.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${metric.iconColor} text-xl`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
