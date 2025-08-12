import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Calendar, Clock, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: timeLogs } = useQuery({
    queryKey: ["/api/time-logs"],
    retry: false,
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' ? `"${row[header]}"` : row[header]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportTimeLogsCSV = () => {
    if (!timeLogs) return;
    
    const exportData = timeLogs.map((log: any) => ({
      Worker: `${log.worker?.firstName} ${log.worker?.lastName}`,
      Project: log.project?.name || 'No Project',
      'Clock In': format(new Date(log.clockIn), 'yyyy-MM-dd HH:mm:ss'),
      'Clock Out': log.clockOut ? format(new Date(log.clockOut), 'yyyy-MM-dd HH:mm:ss') : 'Active',
      'Total Hours': log.totalHours || '0',
      Status: log.clockOut ? (log.isApproved ? 'Approved' : 'Pending') : 'Active'
    }));
    
    exportToCSV(exportData, `time-logs-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const exportInvoicesCSV = () => {
    if (!invoices) return;
    
    const exportData = invoices.map((invoice: any) => ({
      'Invoice Number': invoice.invoiceNumber,
      Client: invoice.client?.name || 'No Client',
      Project: invoice.project?.name || 'No Project',
      Status: invoice.status,
      'Issue Date': format(new Date(invoice.issueDate), 'yyyy-MM-dd'),
      'Due Date': format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
      Total: parseFloat(invoice.total).toFixed(2)
    }));
    
    exportToCSV(exportData, `invoices-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header title="Reports" subtitle="View analytics and export business data" />

        <div className="p-8 space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.totalWorkers || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.activeProjects || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.weeklyHours || 0}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardStats?.monthlyRevenue || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={exportTimeLogsCSV}
                  className="justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Export Time Logs
                </Button>
                <Button 
                  variant="outline" 
                  onClick={exportInvoicesCSV}
                  className="justify-start"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Export Invoices
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => toast({ title: "Coming Soon", description: "Project reports export will be available soon" })}
                  className="justify-start"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Projects
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Time Logs Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {timeLogs && timeLogs.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Total Logs: {timeLogs.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Active Sessions: {timeLogs.filter((log: any) => !log.clockOut).length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pending Approval: {timeLogs.filter((log: any) => log.clockOut && !log.isApproved).length}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No time logs available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices && invoices.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Total Invoices: {invoices.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Paid: {invoices.filter((inv: any) => inv.status === 'paid').length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pending: {invoices.filter((inv: any) => inv.status === 'sent').length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Overdue: {invoices.filter((inv: any) => inv.status === 'overdue').length}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No invoices available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
