import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, Clock, RefreshCw, Filter } from "lucide-react";
import WorkerLocationMap from "@/components/maps/worker-location-map";
import type { TimeLog, Worker, Project } from "@shared/schema";

interface TimeLogWithDetails extends TimeLog {
  worker: Worker;
  project?: Project;
}

export default function WorkerMap() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month">("today");

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

  const { data: timeLogs, isLoading: loadingLogs, refetch } = useQuery({
    queryKey: ["/api/time-logs", statusFilter, dateFilter],
    retry: false,
  });

  const { data: workers } = useQuery({
    queryKey: ["/api/workers"],
    retry: false,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  // Process time logs into location data
  const locationData = (timeLogs as TimeLogWithDetails[] || [])
    .filter((log) => {
      // Only include logs with GPS location
      if (!log.gpsLocation) return false;
      
      // Apply date filter
      const logDate = new Date(log.clockIn);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          return logDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    })
    .filter((log) => {
      // Apply status filter
      if (statusFilter === "all") return true;
      const isActive = !log.clockOut;
      return statusFilter === "active" ? isActive : !isActive;
    })
    .map((log) => {
      const [lat, lng] = log.gpsLocation!.split(",").map(Number);
      const worker = (workers as Worker[] || []).find(w => w.id === log.workerId);
      const project = (projects as Project[] || []).find(p => p.id === log.projectId);
      
      return {
        workerId: log.workerId,
        workerName: worker ? `${worker.firstName} ${worker.lastName}` : "Unknown Worker",
        latitude: lat,
        longitude: lng,
        clockInTime: log.clockIn.toString(),
        clockOutTime: log.clockOut?.toString(),
        projectName: project?.name,
        isActive: !log.clockOut,
      };
    });

  const activeWorkers = locationData.filter(loc => loc.isActive).length;
  const totalLocations = locationData.length;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="Worker Map" subtitle="View worker locations and QR scan points" />
        
        <div className="p-6 space-y-6 h-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLocations}</div>
                <p className="text-xs text-muted-foreground">
                  GPS check-ins recorded
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  Currently clocked in
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Workers</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalLocations - activeWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  Clocked out today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters & Controls
                </CardTitle>
                <Button 
                  onClick={() => refetch()} 
                  size="sm" 
                  variant="outline"
                  disabled={loadingLogs}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Worker Status</label>
                  <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workers</SelectItem>
                      <SelectItem value="active">Active (Clocked In)</SelectItem>
                      <SelectItem value="inactive">Inactive (Clocked Out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Time Period</label>
                  <Select value={dateFilter} onValueChange={(value: "today" | "week" | "month") => setDateFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Active Workers</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">Inactive Workers</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="flex-1 min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Worker Locations
                {locationData.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {locationData.length} locations
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <WorkerLocationMap locations={locationData} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}