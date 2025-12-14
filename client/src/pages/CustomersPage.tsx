import * as React from "react";
import { useEffect, useState } from "react";
import {
  default as Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
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
  Mail,
  Phone,
  MapPin,
  Building2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { DashboardShell } from "../components/ui/layout/DashboardShell";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalInvoices: number;
  totalRevenue: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  createdAt: string;
  lastInvoiceDate?: string;
  notes?: string;
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "ABC Corporation",
    email: "billing@abc-corp.com",
    phone: "+1-555-0101",
    address: "123 Business St, Suite 100, New York, NY 10001",
    totalInvoices: 5,
    totalRevenue: 12500.0,
    status: "ACTIVE",
    createdAt: "2024-01-15",
    lastInvoiceDate: "2024-12-01",
    notes: "Enterprise client - prefers quarterly billing",
  },
  {
    id: "2",
    name: "XYZ Industries",
    email: "accounts@xyz-ind.com",
    phone: "+1-555-0102",
    address: "456 Commerce Ave, Los Angeles, CA 90001",
    totalInvoices: 3,
    totalRevenue: 8400.0,
    status: "ACTIVE",
    createdAt: "2024-02-20",
    lastInvoiceDate: "2024-11-15",
    notes: "Manufacturing sector - monthly retainer",
  },
  {
    id: "3",
    name: "Tech Solutions Ltd",
    email: "finance@tech-solutions.io",
    phone: "+1-555-0103",
    address: "789 Innovation Blvd, San Francisco, CA 94105",
    totalInvoices: 8,
    totalRevenue: 19200.0,
    status: "ACTIVE",
    createdAt: "2024-03-10",
    lastInvoiceDate: "2024-12-05",
    notes: "Tech startup - growing rapidly",
  },
  {
    id: "4",
    name: "Global Marketing Inc",
    email: "payments@global-marketing.com",
    phone: "+1-555-0104",
    address: "321 Madison Ave, New York, NY 10017",
    totalInvoices: 2,
    totalRevenue: 2100.0,
    status: "PENDING",
    createdAt: "2024-11-01",
    lastInvoiceDate: "2024-11-20",
    notes: "New client - onboarding in progress",
  },
  {
    id: "5",
    name: "StartUp Ventures",
    email: "admin@startup-ventures.co",
    phone: "+1-555-0105",
    address: "555 Entrepreneur Way, Austin, TX 78701",
    totalInvoices: 4,
    totalRevenue: 6800.0,
    status: "INACTIVE",
    createdAt: "2024-04-05",
    lastInvoiceDate: "2024-09-15",
    notes: "Project completed - no active contracts",
  },
];

const statusConfig = {
  ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
  INACTIVE: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
  PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
};

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [filteredCustomers, setFilteredCustomers] =
    useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      console.log("👥 Fetching customers...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCustomers(mockCustomers);
      setFilteredCustomers(mockCustomers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.status === statusFilter,
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

  const handleCreateCustomer = async (formData: any) => {
    try {
      console.log("👥 Creating customer:", formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        totalInvoices: 0,
        totalRevenue: 0.0,
        status: "PENDING",
        createdAt: new Date().toISOString().split("T")[0],
        notes: formData.notes,
      };

      setCustomers([newCustomer, ...customers]);
      setIsCreateDialogOpen(false);
      console.log("✅ Customer created successfully");
    } catch (error) {
      console.error("Failed to create customer:", error);
    }
  };

  const handleUpdateStatus = async (
    customerId: string,
    newStatus: Customer["status"],
  ) => {
    try {
      console.log("👥 Updating customer status:", customerId, newStatus);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCustomers(
        customers.map((customer) =>
          customer.id === customerId
            ? { ...customer, status: newStatus }
            : customer,
        ),
      );
      console.log("✅ Customer status updated successfully");
    } catch (error) {
      console.error("Failed to update customer status:", error);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    if (customer.totalInvoices > 0) {
      alert(
        `Cannot delete customer with ${customer.totalInvoices} active invoices. Please handle invoices first.`,
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      console.log("👥 Deleting customer:", customerId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCustomers(customers.filter((customer) => customer.id !== customerId));
      console.log("✅ Customer deleted successfully");
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalRevenue,
    0,
  );
  const activeCustomers = customers.filter((c) => c.status === "ACTIVE").length;

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-gray-600">
              Manage customer relationships and billing information
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-enterprise-navy hover:bg-enterprise-navy/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer profile for billing and management.
                </DialogDescription>
              </DialogHeader>
              <CreateCustomerForm onSubmit={handleCreateCustomer} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-surface1 border border-border-gray shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered customers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Customers
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeCustomers}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Revenue
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                $
                {customers.length > 0
                  ? (totalRevenue / customers.length).toFixed(2)
                  : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Per customer</p>
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
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Status: {statusFilter === "all" ? "All" : statusFilter}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
            <CardDescription>
              Manage your customer database and track billing history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-enterprise-navy"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.address.length > 30
                              ? customer.address.substring(0, 30) + "..."
                              : customer.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${customer.totalRevenue.toFixed(2)}
                        </div>
                        {customer.lastInvoiceDate && (
                          <div className="text-xs text-gray-500">
                            Last: {customer.lastInvoiceDate}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {customer.totalInvoices}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total invoices
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[customer.status].color}>
                          {statusConfig[customer.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {customer.status !== "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(customer.id, "ACTIVE")
                              }
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            disabled={customer.totalInvoices > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
};

// Create Customer Form Component
const CreateCustomerForm: React.FC<{ onSubmit: (data: any) => void }> = ({
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.address
    ) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter company name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="contact@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+1-555-0000"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          placeholder="123 Business St, City, State 12345"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter any additional notes about this customer"
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
          Add Customer
        </Button>
      </div>
    </form>
  );
};

export default CustomersPage;
