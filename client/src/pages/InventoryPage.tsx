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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Warehouse,
  Truck,
  Settings,
} from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  location: string;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED";
  lastUpdated: string;
  createdAt: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  reference?: string;
  timestamp: string;
  user: string;
}

const mockInventoryItems: InventoryItem[] = [
  {
    id: "1",
    sku: "LAP-001",
    name: "Business Laptop Pro",
    category: "Electronics",
    description: "High-performance laptop for business use",
    quantity: 45,
    minStock: 10,
    maxStock: 100,
    unitPrice: 1299.99,
    totalPrice: 58499.55,
    supplier: "Tech Supplies Inc",
    location: "Warehouse A - Shelf 12",
    status: "IN_STOCK",
    lastUpdated: "2024-12-10T09:30:00Z",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    sku: "OFF-002",
    name: "Ergonomic Office Chair",
    category: "Furniture",
    description: "Adjustable ergonomic office chair with lumbar support",
    quantity: 8,
    minStock: 15,
    maxStock: 50,
    unitPrice: 349.99,
    totalPrice: 2799.92,
    supplier: "Office Furniture Co",
    location: "Warehouse B - Section 5",
    status: "LOW_STOCK",
    lastUpdated: "2024-12-09T14:20:00Z",
    createdAt: "2024-02-20T00:00:00Z",
  },
  {
    id: "3",
    sku: "PRN-003",
    name: "Wireless Printer",
    category: "Electronics",
    description: "All-in-one wireless printer with scanning",
    quantity: 0,
    minStock: 5,
    maxStock: 25,
    unitPrice: 199.99,
    totalPrice: 0.0,
    supplier: "Print Solutions Ltd",
    location: "Warehouse A - Shelf 8",
    status: "OUT_OF_STOCK",
    lastUpdated: "2024-12-08T11:45:00Z",
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "4",
    sku: "STP-004",
    name: "Stapler Set",
    category: "Office Supplies",
    description: "Heavy-duty stapler with 1000 staples",
    quantity: 125,
    minStock: 20,
    maxStock: 200,
    unitPrice: 24.99,
    totalPrice: 3123.75,
    supplier: "Office Depot",
    location: "Warehouse C - Bin 3",
    status: "IN_STOCK",
    lastUpdated: "2024-12-10T08:15:00Z",
    createdAt: "2024-04-05T00:00:00Z",
  },
  {
    id: "5",
    sku: "DSK-005",
    name: "Standing Desk",
    category: "Furniture",
    description: "Electric height-adjustable standing desk",
    quantity: 12,
    minStock: 8,
    maxStock: 40,
    unitPrice: 599.99,
    totalPrice: 7199.88,
    supplier: "Modern Office Furniture",
    location: "Warehouse B - Section 2",
    status: "IN_STOCK",
    lastUpdated: "2024-12-07T16:30:00Z",
    createdAt: "2024-05-15T00:00:00Z",
  },
];

const mockStockMovements: StockMovement[] = [
  {
    id: "1",
    itemId: "1",
    itemName: "Business Laptop Pro",
    type: "IN",
    quantity: 10,
    reason: "New stock received",
    reference: "PO-2024-0156",
    timestamp: "2024-12-10T09:30:00Z",
    user: "John Smith",
  },
  {
    id: "2",
    itemId: "2",
    itemName: "Ergonomic Office Chair",
    type: "OUT",
    quantity: 5,
    reason: "Office setup request",
    reference: "REQ-2024-0892",
    timestamp: "2024-12-09T14:20:00Z",
    user: "Sarah Johnson",
  },
  {
    id: "3",
    itemId: "3",
    itemName: "Wireless Printer",
    type: "OUT",
    quantity: 3,
    reason: "Department request",
    reference: "REQ-2024-0891",
    timestamp: "2024-12-08T11:45:00Z",
    user: "Mike Wilson",
  },
  {
    id: "4",
    itemId: "4",
    itemName: "Stapler Set",
    type: "IN",
    quantity: 50,
    reason: "Bulk purchase",
    reference: "PO-2024-0155",
    timestamp: "2024-12-10T08:15:00Z",
    user: "John Smith",
  },
];

const statusConfig = {
  IN_STOCK: {
    color: "bg-green-100 text-green-800",
    icon: Package,
    label: "In Stock",
  },
  LOW_STOCK: {
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
    label: "Low Stock",
  },
  OUT_OF_STOCK: {
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    label: "Out of Stock",
  },
  DISCONTINUED: {
    color: "bg-gray-100 text-gray-800",
    icon: Package,
    label: "Discontinued",
  },
};

const movementConfig = {
  IN: {
    color: "bg-green-100 text-green-800",
    icon: TrendingUp,
    label: "Stock In",
  },
  OUT: {
    color: "bg-red-100 text-red-800",
    icon: TrendingDown,
    label: "Stock Out",
  },
  ADJUSTMENT: {
    color: "bg-blue-100 text-blue-800",
    icon: Settings,
    label: "Adjustment",
  },
};

// @ts-ignore
const InventoryPage: React.FC = () => {
  const [inventoryItems, setInventoryItems] =
    useState<InventoryItem[]>(mockInventoryItems);
  const [stockMovements, setStockMovements] =
    useState<StockMovement[]>(mockStockMovements);
  const [filteredItems, setFilteredItems] =
    useState<InventoryItem[]>(mockInventoryItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock fetch inventory
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      console.log("📦 Fetching inventory items...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setInventoryItems(mockInventoryItems);
      setFilteredItems(mockInventoryItems);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter inventory items
  useEffect(() => {
    let filtered = inventoryItems;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter]);

  const handleCreateItem = async (itemData: any) => {
    try {
      console.log("📦 Creating inventory item:", itemData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newItem: InventoryItem = {
        id: Date.now().toString(),
        sku: itemData.sku,
        name: itemData.name,
        category: itemData.category,
        description: itemData.description,
        quantity: parseInt(itemData.quantity),
        minStock: parseInt(itemData.minStock),
        maxStock: parseInt(itemData.maxStock),
        unitPrice: parseFloat(itemData.unitPrice),
        totalPrice:
          parseFloat(itemData.quantity) * parseFloat(itemData.unitPrice),
        supplier: itemData.supplier,
        location: itemData.location,
        status: parseInt(itemData.quantity) > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString().split("T")[0],
      };

      setInventoryItems([newItem, ...inventoryItems]);
      setIsCreateDialogOpen(false);
      console.log("✅ Inventory item created successfully");
    } catch (error) {
      console.error("Failed to create inventory item:", error);
    }
  };

  const handleUpdateStock = async (
    itemId: string,
    newQuantity: number,
    type: "IN" | "OUT" | "ADJUSTMENT",
    reason: string,
  ) => {
    try {
      console.log("📦 Updating stock:", itemId, newQuantity, type);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const item = inventoryItems.find((i) => i.id === itemId);
      if (!item) return;

      const updatedQuantity =
        type === "IN"
          ? item.quantity + newQuantity
          : type === "OUT"
            ? item.quantity - newQuantity
            : newQuantity;

      const newStatus =
        updatedQuantity === 0
          ? "OUT_OF_STOCK"
          : updatedQuantity <= item.minStock
            ? "LOW_STOCK"
            : "IN_STOCK";

      setInventoryItems(
        inventoryItems.map((i) =>
          i.id === itemId
            ? {
                ...i,
                quantity: updatedQuantity,
                totalPrice: updatedQuantity * i.unitPrice,
                status: newStatus,
                lastUpdated: new Date().toISOString(),
              }
            : i,
        ),
      );

      // Add stock movement record
      const movement: StockMovement = {
        id: Date.now().toString(),
        itemId,
        itemName: item.name,
        type,
        quantity: newQuantity,
        reason,
        timestamp: new Date().toISOString(),
        user: "Current User",
      };

      setStockMovements([movement, ...stockMovements]);
      console.log("✅ Stock updated successfully");
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    if (!item) return;

    if (
      !confirm(
        `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
      )
    )
      return;

    try {
      console.log("📦 Deleting inventory item:", itemId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setInventoryItems(inventoryItems.filter((i) => i.id !== itemId));
      console.log("✅ Inventory item deleted successfully");
    } catch (error) {
      console.error("Failed to delete inventory item:", error);
    }
  };

  const handleExportInventory = async () => {
    try {
      console.log("📦 Exporting inventory data...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Inventory exported successfully");
      alert("Inventory data exported successfully!");
    } catch (error) {
      console.error("Failed to export inventory:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0,
  );
  const lowStockItems = inventoryItems.filter(
    (item) => item.status === "LOW_STOCK",
  ).length;
  const outOfStockItems = inventoryItems.filter(
    (item) => item.status === "OUT_OF_STOCK",
  ).length;
  const totalItems = inventoryItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">
            Track and manage your stock levels and inventory items
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-enterprise-navy hover:bg-enterprise-navy/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Create a new inventory item with stock information.
                </DialogDescription>
              </DialogHeader>
              <CreateInventoryForm onSubmit={handleCreateItem} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportInventory}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryItems.length}</div>
            <p className="text-xs text-muted-foreground">Unique SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quantity
            </CardTitle>
            <Warehouse className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Units in stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alert
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory Items
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Stock Movements
          </TabsTrigger>
        </TabsList>

        {/* Inventory Items Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Office Supplies">
                      Office Supplies
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
              <CardDescription>
                Manage your inventory stock levels and item information.
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
                      <TableHead>SKU</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const StatusIcon = statusConfig[item.status].icon;
                      const stockPercentage =
                        (item.quantity / item.maxStock) * 100;
                      const stockColor =
                        stockPercentage > 50
                          ? "bg-green-500"
                          : stockPercentage > 20
                            ? "bg-yellow-500"
                            : "bg-red-500";

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.sku}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.location}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.quantity}</div>
                            <div className="text-xs text-gray-500">
                              Min: {item.minStock} | Max: {item.maxStock}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${stockColor} h-2 rounded-full`}
                                style={{
                                  width: `${Math.min(stockPercentage, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[item.status].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[item.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>
                Track all inventory stock movements and adjustments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((movement) => {
                    const MovementIcon = movementConfig[movement.type].icon;

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(movement.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.itemName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={movementConfig[movement.type].color}
                          >
                            <MovementIcon className="w-3 h-3 mr-1" />
                            {movementConfig[movement.type].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.type === "OUT" ? "-" : "+"}
                          {movement.quantity}
                        </TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {movement.reference}
                          </code>
                        </TableCell>
                        <TableCell>{movement.user}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Create Inventory Form Component
// @ts-ignore
const CreateInventoryForm: React.FC<{ onSubmit: (data: any) => void }> = ({
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    description: "",
    quantity: "",
    minStock: "",
    maxStock: "",
    unitPrice: "",
    supplier: "",
    location: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.sku ||
      !formData.quantity ||
      !formData.unitPrice
    ) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="ITEM-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter item name"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
              <SelectItem value="Office Supplies">Office Supplies</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) =>
              setFormData({ ...formData, supplier: e.target.value })
            }
            placeholder="Supplier name"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Item description"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Min Stock</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) =>
              setFormData({ ...formData, minStock: e.target.value })
            }
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStock">Max Stock</Label>
          <Input
            id="maxStock"
            type="number"
            value={formData.maxStock}
            onChange={(e) =>
              setFormData({ ...formData, maxStock: e.target.value })
            }
            placeholder="0"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price *</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) =>
              setFormData({ ...formData, unitPrice: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Warehouse location"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-enterprise-navy hover:bg-enterprise-navy/90"
        >
          Add Item
        </Button>
      </div>
    </form>
  );
};

export default InventoryPage;
