import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, UserPlus, Building, FileText, FolderPlus, Camera } from "lucide-react";
import { Link } from "wouter";
import QRScanner from "@/components/qr/qr-scanner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function QuickActions() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clockInMutation = useMutation({
    mutationFn: async (data: { qrCode: string; projectId?: string; gpsLocation?: string }) => {
      const response = await apiRequest("POST", "/api/time-logs/clock-in", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsScannerOpen(false);
      toast({
        title: "Success",
        description: "Worker clocked in successfully",
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
        description: error.message || "Failed to clock in",
        variant: "destructive",
      });
    },
  });

  const handleQRScan = (qrCode: string) => {
    // Get GPS location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsLocation = `${position.coords.latitude},${position.coords.longitude}`;
          clockInMutation.mutate({ qrCode, gpsLocation });
        },
        () => {
          // Continue without GPS if denied
          clockInMutation.mutate({ qrCode });
        }
      );
    } else {
      clockInMutation.mutate({ qrCode });
    }
  };

  const quickActions = [
    {
      name: "Add New Worker",
      icon: UserPlus,
      href: "/workers",
      color: "text-primary",
    },
    {
      name: "Add New Client",
      icon: Building,
      href: "/clients",
      color: "text-primary",
    },
    {
      name: "Create Invoice",
      icon: FileText,
      href: "/invoices",
      color: "text-primary",
    },
    {
      name: "New Project",
      icon: FolderPlus,
      href: "/projects",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* QR Code Scanner */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">QR Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <QrCode className="text-4xl text-slate-400 mb-4 mx-auto" />
            <p className="text-slate-600 mb-4">Scan worker QR code for time tracking</p>
            <Button 
              className="bg-primary text-white hover:bg-blue-700 transition-colors w-full"
              onClick={() => setIsScannerOpen(true)}
              disabled={clockInMutation.isPending}
            >
              <Camera className="h-4 w-4 mr-2" />
              Open Scanner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.name} href={action.href} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-medium text-left transition-colors flex items-center">
                  <Icon className={`${action.color} mr-3 h-5 w-5`} />
                  {action.name}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
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
    </div>
  );
}
