import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Clock, MapPin, Edit, Trash2 } from "lucide-react";
import QRScanner from "@/components/qr/qr-scanner";
import { format } from "date-fns";

export default function TimeTracking() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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

  const { data: timeLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ["/api/time-logs"],
    retry: false,
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { qrCode: string; projectId?: string; gpsLocation?: string }) => {
      const response = await apiRequest("POST", "/api/time-logs/clock-in", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-logs"] });
      setIsScannerOpen(false);
      toast({
        title: "Success",
        description: "Clocked in successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to clock in",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (timeLogId: string) => {
      const response = await apiRequest("POST", `/api/time-logs/${timeLogId}/clock-out`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-logs"] });
      toast({
        title: "Success",
        description: "Clocked out successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to clock out",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/time-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      toast({
        title: "Success",
        description: "Time log deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete time log",
        variant: "destructive",
      });
    },
  });

  const handleQRScan = (qrCode: string) => {
    // Extract worker ID from QR code URL if it's a URL format
    let workerQrCode = qrCode;
    
    // Check if QR code is a URL pointing to time tracking with worker parameter
    if (qrCode.includes('/time-tracking?worker=')) {
      const url = new URL(qrCode);
      const workerId = url.searchParams.get('worker');
      if (workerId) {
        workerQrCode = `WORKER_${workerId}`;
      }
    }
    
    // Get GPS location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsLocation = `${position.coords.latitude},${position.coords.longitude}`;
          clockInMutation.mutate({ qrCode: workerQrCode, gpsLocation });
        },
        () => {
          // Continue without GPS if denied
          clockInMutation.mutate({ qrCode: workerQrCode });
        }
      );
    } else {
      clockInMutation.mutate({ qrCode: workerQrCode });
    }
  };

  const handleClockOut = (timeLogId: string) => {
    clockOutMutation.mutate(timeLogId);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this time log?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (log: any) => {
    if (!log.clockOut) {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (log.isApproved) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Approved</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
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
        <Header title="Time Tracking" subtitle="Monitor worker hours and manage time logs">
          <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Scan Worker QR Code</DialogTitle>
              </DialogHeader>
              <QRScanner 
                onScan={handleQRScan}
                isLoading={clockInMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </Header>

        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Time Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : timeLogs && Array.isArray(timeLogs) && timeLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(timeLogs as any[]).map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {log.worker?.firstName} {log.worker?.lastName}
                              </p>
                              <p className="text-sm text-slate-500">{log.worker?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.project?.name || "No Project"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.clockIn), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {log.clockOut ? (
                              format(new Date(log.clockOut), "MMM dd, yyyy HH:mm")
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClockOut(log.id)}
                                disabled={clockOutMutation.isPending}
                              >
                                Clock Out
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.totalHours ? `${log.totalHours}h` : "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(log.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No time logs found</h3>
                  <p className="text-slate-600 mb-4">Start by scanning a worker's QR code to clock them in.</p>
                  <Button onClick={() => setIsScannerOpen(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
