import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/Dialog";
import Label from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { invoicesApi, type Invoice } from "../api/invoices.api";
import { useCompanyContext } from "../hooks/useCompanyContext";
import { useBillingContext } from "../hooks/useBillingContext";
import { BillingBanner, UsageMeter } from "../components/billing/BillingGuard";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";

// Skeleton component
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-secondary rounded", className)} />
);

type InvoiceStatus = Invoice["status"];

const statusConfig: Record<
  InvoiceStatus,
  { color: string; icon: any; label: string }
> = {
  draft: {
    color: "bg-secondary text-secondary-foreground",
    icon: Edit,
    label: "Draft",
  },
  sent: { color: "bg-primary-100 text-primary-700", icon: Send, label: "Sent" },
  viewed: {
    color: "bg-accent-100 text-accent-700",
    icon: Eye,
    label: "Viewed",
  },
  paid: {
    color: "bg-success-100 text-success-700",
    icon: CheckCircle,
    label: "Paid",
  },
  overdue: {
    color: "bg-error-100 text-error-700",
    icon: AlertCircle,
    label: "Overdue",
  },
  cancelled: {
    color: "bg-warning-100 text-warning-700",
    icon: Trash2,
    label: "Cancelled",
  },
};

const InvoicesPage: React.FC = () => {
  const { companyId } = useCompanyContext();
  const { canWrite, isOverLimit, fetchBillingStatus, fetchBillingLimits } =
    useBillingContext();
  const { hasPermission } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch billing status on mount
  useEffect(() => {
    if (companyId) {
      fetchBillingStatus(companyId);
      fetchBillingLimits(companyId);
    }
  }, [companyId, fetchBillingStatus, fetchBillingLimits]);

  // Check permissions and billing
  const hasWritePermission = hasPermission("write:invoices");
  const canCreateInvoice =
    hasWritePermission && canWrite() && !isOverLimit("invoices");
  const createDisabledReason = !hasWritePermission
    ? "You don't have permission to create invoices"
    : !canWrite()
      ? "Account is suspended or in read-only mode"
      : isOverLimit("invoices")
        ? "Invoice limit reached for this month"
        : null;

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    if (!companyId) {
      setError("Company context required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await invoicesApi.list({
        companyId,
        page,
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
      });

      const data = response.data.data;
      setInvoices(data.invoices);
      setFilteredInvoices(data.invoices);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch invoices";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices
  useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.customerEmail
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const handleCreateInvoice = async (formData: any) => {
    if (!companyId) {
      toast.error("Company context required");
      return;
    }

    try {
      const idempotencyKey = `create-invoice-${Date.now()}-${Math.random()}`;
      await invoicesApi.create(
        {
          companyId,
          customerId: formData.customerId,
          date: new Date().toISOString(),
          dueDate: formData.dueDate,
          subtotal: formData.amount,
          taxRate: "0",
          taxAmount: "0",
          total: formData.amount,
          description: formData.description,
        },
        idempotencyKey,
      );

      toast.success("Invoice created successfully");
      setIsCreateDialogOpen(false);
      fetchInvoices();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create invoice";
      toast.error(errorMessage);
      console.error("Failed to create invoice:", err);
    }
  };

  const handleFinalizeInvoice = async (
    invoiceId: string,
    targetStatus: "sent" | "issued" | "approved" | "finalized",
  ) => {
    if (!companyId) {
      toast.error("Company context required");
      return;
    }

    try {
      const idempotencyKey = `finalize-invoice-${invoiceId}-${Date.now()}`;
      await invoicesApi.finalize(
        invoiceId,
        companyId,
        { targetStatus },
        idempotencyKey,
      );

      toast.success("Invoice finalized and posted to ledger");
      fetchInvoices();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to finalize invoice";
      toast.error(errorMessage);
      console.error("Failed to finalize invoice:", err);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    // Use a custom confirmation dialog instead of browser confirm()
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.warning("Are you sure you want to delete this invoice?", {
        description: "This action cannot be undone.",
        action: {
          label: "Delete",
          onClick: () => resolve(true),
        },
        cancel: {
          label: "Cancel",
          onClick: () => resolve(false),
        },
        duration: 10000,
      });
    });

    if (!confirmed) return;

    try {
      await invoicesApi.delete(invoiceId, companyId);
      toast.success("Invoice deleted successfully");
      fetchInvoices();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete invoice";
      toast.error(errorMessage);
      console.error("Failed to delete invoice:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Billing Banner */}
      <BillingBanner />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage and track customer invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-enterprise-navy hover:bg-enterprise-navy/90"
              disabled={!canCreateInvoice}
              title={createDisabledReason || "Create new invoice"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for a customer.
              </DialogDescription>
            </DialogHeader>
            <CreateInvoiceForm onSubmit={handleCreateInvoice} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All time invoices</p>
            <div className="mt-3">
              <UsageMeter resourceType="invoices" label="This Month" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter((i) => i.status === "paid").length}
            </div>
            <p className="text-xs text-muted-foreground">Paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {invoices.filter((i) => i.status === "sent").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter((i) => i.status === "overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">Overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
          <CardDescription>
            A list of all invoices including their status and payment
            information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-600">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p className="text-lg font-semibold">{error}</p>
              <Button
                onClick={fetchInvoices}
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-enterprise-navy"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-lg">No invoices found</p>
              <p className="text-sm mt-2">
                Create your first invoice to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status].icon;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invoice.customerName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.customerEmail || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${parseFloat(invoice.total).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[invoice.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {invoice.status === "draft" && hasWritePermission && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleFinalizeInvoice(invoice.id, "sent")
                              }
                              title="Finalize and send"
                              disabled={!canWrite()}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {hasWritePermission && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              disabled={!canWrite()}
                              title={
                                !canWrite()
                                  ? "Account is read-only"
                                  : "Delete invoice"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Create Invoice Form Component
const CreateInvoiceForm: React.FC<{ onSubmit: (data: any) => void }> = ({
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    amount: "",
    dueDate: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.customerName ||
      !formData.customerEmail ||
      !formData.amount ||
      !formData.dueDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            placeholder="Enter customer name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Customer Email *</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) =>
              setFormData({ ...formData, customerEmail: e.target.value })
            }
            placeholder="customer@example.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter invoice description"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-enterprise-navy hover:bg-enterprise-navy/90"
        >
          Create Invoice
        </Button>
      </div>
    </form>
  );
};

export default InvoicesPage;
