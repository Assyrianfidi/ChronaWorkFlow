import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesService, type Invoice } from "@/services/invoices.service";
import { companiesService } from "@/services/companies.service";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceForm } from "./InvoiceForm";
import { Pencil, Trash2, Plus, Search, Filter } from "lucide-react";
import type { CreateInvoiceFormData } from "@/schemas/invoice.schema";

export function InvoicesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  const { data: companiesData } = useQuery({
    queryKey: ["companies-list"],
    queryFn: () => companiesService.getAll({ limit: 100 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", page, search, startDate, endDate, statusFilter],
    queryFn: () =>
      invoicesService.getAll({
        page,
        limit: 10,
        search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: invoicesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create invoice");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      invoicesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated successfully");
      setEditingInvoice(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update invoice");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Invoice["status"] }) =>
      invoicesService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update invoice status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoicesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete invoice");
    },
  });

  const handleCreate = (data: CreateInvoiceFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: CreateInvoiceFormData) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: Invoice["status"]) => {
    updateStatusMutation.mutate({ id, status });
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Error loading invoices: {(error as Error).message}
        </p>
      </div>
    );
  }

  const invoices = data?.data.data || [];
  const pagination = data?.data.pagination;
  const companies = companiesData?.data.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No invoices found. Create your first invoice to get started.
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell className="font-semibold">
                      $
                      {invoice.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <select
                        value={invoice.status}
                        onChange={(e) =>
                          handleStatusChange(
                            invoice.id,
                            e.target.value as Invoice["status"],
                          )
                        }
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)} border-0 cursor-pointer`}
                        disabled={updateStatusMutation.isPending}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="PAID">Paid</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell>{invoice.company?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingInvoice(invoice)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(invoice.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {invoices.length} of {pagination.total} invoices
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Add a new invoice to the system.
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
            mode="create"
            companies={companies}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingInvoice}
        onOpenChange={() => setEditingInvoice(null)}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Update invoice information.</DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <InvoiceForm
              onSubmit={handleUpdate}
              onCancel={() => setEditingInvoice(null)}
              defaultValues={{
                invoiceNumber: editingInvoice.invoiceNumber,
                customerName: editingInvoice.customerName,
                amount: editingInvoice.amount,
                dueDate: editingInvoice.dueDate.split("T")[0],
                status: editingInvoice.status,
                customerId: editingInvoice.customerId,
                companyId: editingInvoice.companyId,
              }}
              isLoading={updateMutation.isPending}
              mode="edit"
              companies={companies}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
