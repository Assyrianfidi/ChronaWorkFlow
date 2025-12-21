import React from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  Table,
  TableState,
  Updater,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";

export interface EnterpriseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  noResultsMessage?: string;
  getRowId?: (originalRow: TData, index: number) => string;
  className?: string;

  // Phase 2: optional controlled state and behaviors
  enableSorting?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;

  state?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    globalFilter?: string;
  };
  onStateChange?: (updater: Updater<TableState>) => void;

  renderToolbar?: (state: any, table: Table<TData>) => React.ReactNode;
  onRowClick?: (row: TData) => void;
}

function getDefaultRowId<TData>(row: TData, index: number): string {
  // Fallback rowId resolver: prefer an existing `id` field, otherwise index-based.
  // This is purely structural (no domain logic) and can be overridden via props.
  if (row && typeof (row as any).id === "string") {
    return (row as any).id as string;
  }
  return String(index);
}

function EnterpriseDataTableInner<TData, TValue>(
  props: EnterpriseDataTableProps<TData, TValue>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    columns,
    data,
    isLoading = false,
    noResultsMessage = "No records found.",
    getRowId = getDefaultRowId,
    className,
    enableSorting,
    enableColumnFilters,
    state,
    onStateChange,
    renderToolbar,
    onRowClick,
  } = props;

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    enableSorting,
    enableColumnFilters,
    state,
    onStateChange,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableColumnFilters
      ? getFilteredRowModel()
      : undefined,
  });

  const showEmptyState = !isLoading && data.length === 0;

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full overflow-x-auto overflow-y-auto max-h-[600px] rounded-lg border border-border bg-card text-card-foreground shadow-soft",
        className,
      )}
    >
      {renderToolbar && (
        <div className="mb-4">{renderToolbar(table.getState(), table)}</div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/20">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="h-11 px-4 text-left align-middle text-xs font-semibold text-muted-foreground border-b border-border bg-muted/20"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={table.getAllLeafColumns().length || 1}
                className="px-4"
              >
                <LoadingState label="Loading…" />
              </td>
            </tr>
          ) : showEmptyState ? (
            <tr>
              <td
                colSpan={table.getAllLeafColumns().length || 1}
                className="px-4"
              >
                <EmptyState size="sm" title={noResultsMessage} />
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border hover:bg-muted/30 transition-colors duration-200",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 align-middle text-sm text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const EnterpriseDataTable = React.forwardRef(
  EnterpriseDataTableInner,
) as <TData, TValue>(
  props: EnterpriseDataTableProps<TData, TValue> & {
    ref?: React.Ref<HTMLDivElement>;
  },
) => React.ReactElement;
