import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Plus, Search, Mail, Phone, Eye, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useVendors, type Vendor } from "../hooks/use-api";
import { Skeleton } from "../components/ui/skeleton";

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: vendors = [], isLoading } = useVendors();

  const filteredVendors = vendors.filter((vendor: Vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vendor.phone && vendor.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vendor.address && vendor.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPayables = vendors.reduce((sum: number, vendor: Vendor) => sum + parseFloat(vendor.balance), 0);
  const activeVendors = vendors.filter((vendor: Vendor) => vendor.isActive).length;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor relationships and payables</p>
        </div>
        <Button data-testid="button-create-vendor">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-total-vendors">{vendors.length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payables</CardTitle>
            <div className="text-2xl font-semibold tabular-nums text-destructive" data-testid="text-total-payables">
              ${totalPayables.toLocaleString()}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vendors</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-active-vendors">{activeVendors}</div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Vendors</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-vendors"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No vendors found matching your search." : "No vendors yet. Add your first vendor to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor: Vendor) => (
                  <TableRow key={vendor.id} data-testid={`vendor-row-${vendor.id}`}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {vendor.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{vendor.email}</span>
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                        {vendor.address && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {vendor.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      <span className={parseFloat(vendor.balance) > 0 ? "text-destructive" : parseFloat(vendor.balance) < 0 ? "text-chart-2" : ""}>
                        ${parseFloat(vendor.balance).toFixed(2)}
                      </span>
                      {parseFloat(vendor.balance) !== 0 && (
                        <div className="text-xs text-muted-foreground">
                          {parseFloat(vendor.balance) > 0 ? 'Payable' : 'Credit'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? "default" : "secondary"}>
                        {vendor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-view-vendor-${vendor.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-vendor-${vendor.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`button-delete-vendor-${vendor.id}`}>
                          <Trash2 className="h-4 w-4" />
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
  );
}
