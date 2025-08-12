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
import { Plus, Edit, Trash2, QrCode, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import WorkerForm from "@/components/forms/worker-form";
import QRGenerator from "@/components/qr/qr-generator";
import type { Worker } from "@shared/schema";

export default function Workers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [qrWorker, setQrWorker] = useState<Worker | null>(null);

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

  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ["/api/workers"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({
        title: "Success",
        description: "Worker deleted successfully",
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
        description: "Failed to delete worker",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingWorker(null);
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
        <Header title="Workers" subtitle="Manage your workforce and generate QR codes for time tracking">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingWorker ? "Edit Worker" : "Add New Worker"}
                </DialogTitle>
              </DialogHeader>
              <WorkerForm 
                worker={editingWorker} 
                onSuccess={handleFormClose}
              />
            </DialogContent>
          </Dialog>
        </Header>

        <div className="p-8">
          {loadingWorkers ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workers && workers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker: Worker) => (
                <Card key={worker.id} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-800">
                        {worker.firstName} {worker.lastName}
                      </CardTitle>
                      <Badge variant={worker.isActive ? "default" : "secondary"}>
                        {worker.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {worker.email && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {worker.email}
                        </div>
                      )}
                      {worker.phone && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {worker.phone}
                        </div>
                      )}
                      {worker.hourlyRate && (
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Rate:</span> ${worker.hourlyRate}/hour
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQrWorker(worker)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(worker)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(worker.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No workers found</h3>
                <p className="text-slate-600 mb-4">Get started by adding your first worker.</p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Worker
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QR Code Dialog */}
        <Dialog open={!!qrWorker} onOpenChange={() => setQrWorker(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                QR Code for {qrWorker?.firstName} {qrWorker?.lastName}
              </DialogTitle>
            </DialogHeader>
            {qrWorker && <QRGenerator value={qrWorker.qrCode} workerName={`${qrWorker.firstName} ${qrWorker.lastName}`} />}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
