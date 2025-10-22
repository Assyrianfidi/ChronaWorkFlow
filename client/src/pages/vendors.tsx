import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const vendors = [
  { id: "1", name: "Office Supplies Co", email: "sales@officesupplies.com", phone: "(555) 111-2222", balance: 1240.50, isActive: true },
  { id: "2", name: "Tech Hardware Inc", email: "billing@techhardware.com", phone: "(555) 222-3333", balance: 0, isActive: true },
  { id: "3", name: "Utility Services", email: "accounts@utility.com", phone: "(555) 333-4444", balance: 432.80, isActive: true },
  { id: "4", name: "Cleaning Services LLC", email: "admin@cleaning.com", phone: "(555) 444-5555", balance: 280.00, isActive: true },
  { id: "5", name: "Marketing Agency", email: "finance@marketing.com", phone: "(555) 555-6666", balance: 3500.00, isActive: true },
];

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="text-2xl font-semibold" data-testid="text-total-vendors">5</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payables</CardTitle>
            <div className="text-2xl font-semibold tabular-nums" data-testid="text-total-payables">$5,453.30</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vendors</CardTitle>
            <div className="text-2xl font-semibold" data-testid="text-active-vendors">5</div>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-vendors"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id} data-testid={`vendor-row-${vendor.id}`}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{vendor.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    <span className={vendor.balance > 0 ? "text-destructive" : ""}>
                      ${vendor.balance.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.isActive ? "default" : "secondary"}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" data-testid={`button-view-vendor-${vendor.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
