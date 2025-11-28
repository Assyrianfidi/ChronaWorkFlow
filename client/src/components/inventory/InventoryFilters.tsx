import React, { useMemo } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { X, Search, Filter } from 'lucide-react';
import { InventoryStatus } from '../types/inventory';
import { useInventoryFilters } from '../hooks/useInventoryFilters';

interface InventoryFiltersProps {
  categories: string[];
  onFilterChange?: (filters: any) => void;
}

export function InventoryFilters({ categories, onFilterChange }: InventoryFiltersProps) {
  const {
    searchTerm,
    selectedCategory,
    statusFilter,
    quantityRange,
    sortBy,
    sortOrder,
    
    // Handlers
    handleSearchChange,
    handleCategoryChange,
    handleStatusChange,
    handleQuantityRangeChange,
    handleSortChange,
    resetFilters,
  } = useInventoryFilters();

  // Memoize the status options to prevent unnecessary re-renders
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Status' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ], []);

  // Handle quantity range changes
  const handleQuantityMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    handleQuantityRangeChange({ min: value });
  };

  const handleQuantityMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    handleQuantityRangeChange({ max: value });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search items..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={selectedCategory || ''}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => handleStatusChange(value as InventoryStatus | 'all')}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Range */}
        <div className="space-y-2">
          <Label>Quantity Range</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={quantityRange.min ?? ''}
              onChange={handleQuantityMinChange}
              min={0}
              className="text-sm"
            />
            <div className="flex items-center">-</div>
            <Input
              type="number"
              placeholder="Max"
              value={quantityRange.max ?? ''}
              onChange={handleQuantityMaxChange}
              min={quantityRange.min ?? 0}
              className="text-sm"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select
            value={`${sortBy}:${sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split(':');
              handleSortChange(sortBy as any);
            }}
          >
            <SelectTrigger id="sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name:asc">Name (A-Z)</SelectItem>
              <SelectItem value="name:desc">Name (Z-A)</SelectItem>
              <SelectItem value="quantity:desc">Quantity (High to Low)</SelectItem>
              <SelectItem value="quantity:asc">Quantity (Low to High)</SelectItem>
              <SelectItem value="value:desc">Value (High to Low)</SelectItem>
              <SelectItem value="value:asc">Value (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
