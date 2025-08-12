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
import { Plus, Edit, Trash2, FileText, Download, Mail, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InvoiceForm from "@/components/forms/invoice-form";
import { format } from "date-fns";
import { downloadInvoicePDF, previewInvoicePDF } from "@/lib/pdf";

export default function Invoices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

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

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
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
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownloadPDF = (invoice: any) => {
    try {
      console.log("Invoice data for PDF:", invoice);
      
      // Ensure we have the required data structure
      if (!invoice.lineItems || !Array.isArray(invoice.lineItems)) {
        throw new Error("Invoice line items are missing or invalid");
      }
      
      if (!invoice.client) {
        throw new Error("Invoice client information is missing");
      }
      
      downloadInvoicePDF(invoice);
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      console.error("Error details:", (error as Error)?.message);
      toast({
        title: "Error",
        description: `Failed to download PDF: ${(error as Error)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handlePreviewPDF = (invoice: any) => {
    try {
      console.log("Invoice data for PDF preview:", invoice);
      
      // Ensure we have the required data structure
      if (!invoice.lineItems || !Array.isArray(invoice.lineItems)) {
        throw new Error("Invoice line items are missing or invalid");
      }
      
      if (!invoice.client) {
        throw new Error("Invoice client information is missing");
      }
      
      previewInvoicePDF(invoice);
    } catch (error) {
      console.error("Error previewing PDF:", error);
      console.error("Error details:", (error as Error)?.message);
      toast({
        title: "Error",
        description: `Failed to preview PDF: ${(error as Error)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingInvoice(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Draft" },
      sent: { variant: "default" as const, label: "Sent" },
      paid: { variant: "outline" as const, label: "Paid", className: "bg-green-100 text-green-800" },
      overdue: { variant: "destructive" as const, label: "Overdue" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant} className={(config as any).className}>{config.label}</Badge>;
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
        <Header title="Invoices" subtitle="Create and manage your invoices and billing">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
                </DialogTitle>
              </DialogHeader>
              <InvoiceForm 
                invoice={editingInvoice} 
                onSuccess={handleFormClose}
              />
            </DialogContent>
          </Dialog>
        </Header>

        <div className="p-8">
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invoices && Array.isArray(invoices) && invoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(invoices as any[]).map((invoice: any) => (
                <Card key={invoice.id} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-800">
                        {invoice.invoiceNumber}
                      </CardTitle>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {invoice.client && (
                      <p className="text-sm text-slate-500">{invoice.client.name}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {invoice.project && (
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Project:</span> {invoice.project.name}
                        </div>
                      )}
                      
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Amount:</span> ${parseFloat(invoice.total).toLocaleString()}
                      </div>
                      
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Issue Date:</span> {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                      </div>
                      
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Due Date:</span> {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewPDF(invoice)}
                          title="Preview PDF"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete Invoice"
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
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No invoices found</h3>
                <p className="text-slate-600 mb-4">Get started by creating your first invoice.</p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
