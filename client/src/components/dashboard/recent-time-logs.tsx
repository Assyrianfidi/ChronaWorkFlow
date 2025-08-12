import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function RecentTimeLogs() {
  const { data: timeLogs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/recent-logs"],
    retry: false,
  });

  const getStatusBadge = (log: any) => {
    if (!log.clockOut) {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (log.isApproved) {
      return <Badge className="bg-accent hover:bg-green-600">Clocked Out</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "h:mm a");
  };

  const formatTimeRange = (clockIn: string, clockOut?: string) => {
    const startTime = formatTime(clockIn);
    if (clockOut) {
      const endTime = formatTime(clockOut);
      return `${startTime} - ${endTime}`;
    }
    return `${startTime} - Now`;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">Recent Time Logs</CardTitle>
          <Link href="/time-tracking" className="text-primary font-medium hover:text-blue-700">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : timeLogs.length > 0 ? (
          <div className="space-y-4">
            {timeLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-slate-200 text-slate-700">
                      {log.worker?.firstName?.[0]}{log.worker?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-800">
                      {log.worker?.firstName} {log.worker?.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {log.project?.name || "No Project"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-800">
                    {formatTimeRange(log.clockIn, log.clockOut)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {log.totalHours ? `${log.totalHours}h` : "Active"}
                  </p>
                </div>
                {getStatusBadge(log)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recent time logs</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
