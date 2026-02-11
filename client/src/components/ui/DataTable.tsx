import * as React from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
} from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  title?: string;
  header?: string;
  label?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  paginated?: boolean;
  actions?: any;
  bulkActions?: any;
  exportOptions?: any;
  onSelectionChange?: (rows: T[]) => void;
  onSearch?: (query: string) => void;
  emptyState?: React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  getRowId?: (row: T, index: number) => string;
  selectedRowId?: string;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface FilterConfig {
  key: string;
  value: string;
}

function DataTable<T>({
  data,
  columns,
  loading = false,
  searchable = true,
  exportable = true,
  onSearch,
  emptyState,
  className,
  onRowClick,
  emptyMessage = "No data available",
  pageSize = 10,
  getRowId,
  selectedRowId,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null);
  const [filters, setFilters] = React.useState<FilterConfig[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showFilters, setShowFilters] = React.useState(false);

  const getColumnLabel = React.useCallback(
    (column: Column<T>) =>
      column.title ?? column.header ?? column.label ?? String(column.key),
    [],
  );

  // Handle sorting
  const handleSort = (key: keyof T | string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key: key as string, direction });
  };

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
          const value = (row as any)[column.key as any];
          return (
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        }),
      );
    }

    // Apply column filters
    filters.forEach((filter) => {
      filtered = filtered.filter((row) => {
        const value = (row as any)[filter.key as any];
        return (
          value &&
          value.toString().toLowerCase().includes(filter.value.toLowerCase())
        );
      });
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortConfig, columns]);

  React.useEffect(() => {
    if (onSearch) onSearch(searchTerm);
  }, [onSearch, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Export functionality
  const handleExport = () => {
    const csv = [
      columns.map((col) => getColumnLabel(col)).join(","),
      ...filteredData.map((row) =>
        columns
          .map((col) => {
            const value = (row as any)[col.key as any];
            const rendered = col.render ? col.render(value, row) : value;
            if (rendered === null || rendered === undefined) return "";
            if (typeof rendered === "string" || typeof rendered === "number") {
              return String(rendered);
            }
            return "";
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full">
        <LoadingState label="Loading…" />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {searchable && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        <div className="flex gap-2">
          {columns.some((col) => col.filterable) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {filters.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {filters.length}
                </span>
              )}
            </Button>
          )}

          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && columns.some((col) => col.filterable) && (
        <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {columns
              .filter((col) => col.filterable)
              .map((column) => (
                <div key={column.key as string}>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {getColumnLabel(column)}
                  </label>
                  <Input
                    placeholder={`Filter ${getColumnLabel(column)}...`}
                    value={
                      filters.find((f) => f.key === column.key)?.value || ""
                    }
                    onChange={(e) => {
                      const newFilters = filters.filter(
                        (f) => f.key !== column.key,
                      );
                      if (e.target.value) {
                        newFilters.push({
                          key: column.key as string,
                          value: e.target.value,
                        });
                      }
                      setFilters(newFilters);
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card text-card-foreground rounded-lg border border-border overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/20 border-b border-border">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key as string}
                    className={cn(
                      "px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                      column.className,
                    )}
                    aria-sort={
                      sortConfig?.key === (column.key as string)
                        ? sortConfig.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="w-full flex items-center gap-1 hover:bg-muted/30 rounded-sm -mx-2 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
                        onClick={() => handleSort(column.key)}
                        aria-label={`Sort by ${getColumnLabel(column)}`}
                      >
                        <span>{getColumnLabel(column)}</span>
                        <span aria-hidden="true" className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              "h-3 w-3",
                              sortConfig?.key === column.key &&
                                sortConfig.direction === "asc"
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 -mt-1",
                              sortConfig?.key === column.key &&
                                sortConfig.direction === "desc"
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {getColumnLabel(column)}
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6">
                    {emptyState ?? (
                      <EmptyState title={emptyMessage} size="sm" />
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) =>
                  (() => {
                    const rowId =
                      getRowId?.(row, startIndex + index) ??
                      String(startIndex + index);
                    const isClickable = !!onRowClick;
                    const isSelected = selectedRowId
                      ? rowId === selectedRowId
                      : false;
                    return (
                      <tr
                        key={rowId}
                        className={cn(
                          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background",
                          (startIndex + index) % 2 === 1 && "bg-muted/10",
                          "hover:bg-muted/20",
                          isClickable && "cursor-pointer",
                          isSelected && "bg-muted/30",
                        )}
                        onClick={() => onRowClick?.(row)}
                        onKeyDown={(e) => {
                          if (!isClickable) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        }}
                        tabIndex={isClickable ? 0 : undefined}
                        aria-selected={isSelected || undefined}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key as string}
                            className={cn(
                              "px-6 py-4 whitespace-nowrap text-sm text-foreground",
                              column.className,
                            )}
                          >
                            {column.render
                              ? column.render(
                                  (row as any)[column.key as any],
                                  row,
                                )
                              : String((row as any)[column.key as any])}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Row actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })(),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + pageSize, filteredData.length)} of{" "}
            {filteredData.length} results
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable, type Column };
