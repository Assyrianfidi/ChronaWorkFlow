import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Package, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { InventoryItem, InventoryStatus } from '../types/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  selectedItems?: string[];
  onSelectItem?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onToggleExpand?: (id: string) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  expandedItems?: string[];
  hoveredRow?: string | null;
  onHoverRow?: (id: string | null) => void;
}

export function InventoryTable({
  items,
  isLoading = false,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  onToggleExpand,
  onSort,
  onEdit,
  onDelete,
  expandedItems = [],
  hoveredRow,
  onHoverRow,
}: InventoryTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStockStatus = (item: InventoryItem): InventoryStatus => {
    if (item.quantityOnHand === 0) return 'out_of_stock';
    if (item.quantityOnHand <= item.reorderPoint) return 'low_stock';
    return 'in_stock';
  };

  const getStatusBadgeVariant = (status: InventoryStatus) => {
    switch (status) {
      case 'out_of_stock':
        return 'destructive';
      case 'low_stock':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: InventoryStatus) => {
    switch (status) {
      case 'out_of_stock':
        return 'Out of Stock';
      case 'low_stock':
        return 'Low Stock';
      default:
        return 'In Stock';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedItems.length === items.length && items.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-12">Expand</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Loading inventory items...
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No inventory items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const status = getStockStatus(item);
              const isSelected = selectedItems.includes(item.id);
              const isRowExpanded = expandedItems.includes(item.id);

              return (
                <React.Fragment key={item.id}>
                  <TableRow
                    className={isSelected ? 'bg-muted/50' : ''}
                    onMouseEnter={() => onHoverRow?.(item.id)}
                    onMouseLeave={() => onHoverRow?.(null)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectItem?.(item.id, checked as boolean)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {onToggleExpand && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(item.id);
                          }}
                        >
                          {isRowExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.name || ''}</div>
                          <div className="text-sm text-muted-foreground">{item.sku || ''}</div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {getStatusText(status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${item.unitCost.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(hoveredRow === item.id || isRowExpanded) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onEdit?.(item)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {isRowExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Details</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">SKU:</span>
                                <span>{item.sku || ''}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Available:</span>
                                <span>{item.quantityAvailable || 0} units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">On Hand:</span>
                                <span>{item.quantityOnHand || 0} units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Reserved:</span>
                                <span>{item.quantityReserved || 0} units</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Pricing</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Retail Price:</span>
                                <span>${item.unitPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cost:</span>
                                <span>${item.unitCost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Margin:</span>
                                <span>
                                  {item.unitCost > 0
                                    ? `${((item.unitPrice - item.unitCost) / item.unitCost * 100).toFixed(1)}%`
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Value:</span>
                                <span>${((item.quantityOnHand || 0) * item.unitCost).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          {item.description && (
                            <div className="col-span-2">
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-muted-foreground">{item.description}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
