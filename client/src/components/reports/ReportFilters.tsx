import React, { useState } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format, subMonths, formatISO, parseISO } from "date-fns";
import { Button } from "@/components/components/ui/button";
import { Input } from "@/components/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/components/ui/popover";
import { Calendar } from "@/components/components/ui/calendar";
import { CalendarIcon, Filter, X } from "lucide-react";
import { cn } from "@/components/lib/utils";

interface ReportFiltersProps {
  onFilterChange?: (filters: ReportFilters) => void;
  className?: string;
}

export interface ReportFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function ReportFilters({
  onFilterChange,
  className,
}: ReportFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ReportFilters>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
    startDate:
      searchParams.get("startDate") ||
      format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    endDate: searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd"),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true });
    onFilterChange?.(filters);
  }, [filters, onFilterChange, setSearchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (
    date: Date | undefined,
    name: "startDate" | "endDate",
  ) => {
    if (date) {
      const formattedDate = formatISO(date, { representation: "date" });
      setFilters((prev) => ({ ...prev, [name]: formattedDate }));
    }
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      value &&
      value !== "all" &&
      !["sortBy", "sortOrder"].includes(key) &&
      value !== format(subMonths(new Date(), 1), "yyyy-MM-dd") &&
      value !== format(new Date(), "yyyy-MM-dd"),
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            name="search"
            placeholder="Filter reports..."
            className="w-full pl-9"
            value={filters.search}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex w-full items-center space-x-2 md:w-auto">
          <Select
            value={filters.status}
            onValueChange={(value) => handleSelectChange("status", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate
                  ? format(parseISO(filters.startDate), "MMM dd, yyyy")
                  : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  filters.startDate ? parseISO(filters.startDate) : undefined
                }
                onSelect={(date) => date && handleDateChange(date, "startDate")}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate
                  ? format(parseISO(filters.endDate), "MMM dd, yyyy")
                  : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  filters.endDate ? parseISO(filters.endDate) : undefined
                }
                onSelect={(date) => date && handleDateChange(date, "endDate")}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split(":");
              setFilters((prev) => ({
                ...prev,
                sortBy,
                sortOrder: sortOrder as "asc" | "desc",
              }));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest First</SelectItem>
              <SelectItem value="createdAt:asc">Oldest First</SelectItem>
              <SelectItem value="title:asc">Title (A-Z)</SelectItem>
              <SelectItem value="title:desc">Title (Z-A)</SelectItem>
              <SelectItem value="amount:desc">Amount (High to Low)</SelectItem>
              <SelectItem value="amount:asc">Amount (Low to High)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-9 px-2 lg:px-3"
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>

          {filters.search && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              className="h-8"
            >
              Search: {filters.search}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}

          {filters.status && filters.status !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
              className="h-8 capitalize"
            >
              Status: {filters.status}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}

          {filters.startDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                  endDate: format(new Date(), "yyyy-MM-dd"),
                }))
              }
              className="h-8"
            >
              {format(parseISO(filters.startDate), "MMM d")} -{" "}
              {format(
                parseISO(filters.endDate || new Date().toISOString()),
                "MMM d, yyyy",
              )}
              <X className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
