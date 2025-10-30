import { useState } from 'react';
import { useInventoryItems, useCreateInventoryItem } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, AlertTriangle, Package, TrendingUp } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitCost: string;
  unitPrice: string;
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
  reorderPoint: string;
  reorderQuantity: string;
  supplierId?: string;
  isActive: boolean;
  trackInventory: boolean;
}

export default function InventoryPage() {
  const { data: items = [], isLoading, error } = useInventoryItems();
  const createItem = useCreateInventoryItem();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(new Set(items.map((item: InventoryItem) => item.category).filter(Boolean)));

  // Filter items based on search and category
  const filteredItems = items.filter((item: InventoryItem) => {
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate inventory stats
  const totalValue = items.reduce((sum: number, item: InventoryItem) =>
    sum + (parseFloat(item.quantityOnHand) * parseFloat(item.unitCost)), 0);

  const lowStockItems = items.filter((item: InventoryItem) =>
    parseFloat(item.quantityOnHand) <= parseFloat(item.reorderPoint));

  const outOfStockItems = items.filter((item: InventoryItem) =>
    parseFloat(item.quantityOnHand) === 0);

  const handleCreateItem = async () => {
    console.log('Creating new inventory item...');
  };

  const getStockStatus = (item: InventoryItem) => {
    const quantity = parseFloat(item.quantityOnHand);
    const reorderPoint = parseFloat(item.reorderPoint);

    if (quantity === 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const };
    }
    if (quantity <= reorderPoint) {
      return { status: 'Low Stock', variant: 'secondary' as const };
    }
    return { status: 'In Stock', variant: 'default' as const };
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Inventory Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the inventory data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track inventory items, stock levels, and purchase orders
          </p>
        </div>
        <Button onClick={handleCreateItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items with zero quantity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Manage your inventory items and track stock levels
          </CardDescription>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item: InventoryItem) => {
                const stockStatus = getStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium">Quantity</p>
                      <p className="text-2xl font-bold">{item.quantityOnHand}</p>
                      <p className="text-xs text-muted-foreground">
                        Available: {item.quantityAvailable}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">Unit Price</p>
                      <p className="text-lg font-bold">${parseFloat(item.unitPrice).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Cost: ${parseFloat(item.unitCost).toFixed(2)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">Total Value</p>
                      <p className="text-lg font-bold">
                        ${(parseFloat(item.quantityOnHand) * parseFloat(item.unitPrice)).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reorder at: {item.reorderPoint}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Adjust Stock
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No inventory items found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
