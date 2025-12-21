import React from "react";
import type { ChangeEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { EnterpriseDataTable } from "./EnterpriseDataTable";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type ColumnDef<TData, TValue> = any;
type ColumnFiltersState = any;
type RowSelectionState = Record<string, boolean>;
type SortingState = any;
type TableState = any;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: ColumnDef<User, any>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
];

const data: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "Editor" },
  { id: "3", name: "Carol Lee", email: "carol@example.com", role: "Viewer" },
];

const meta: Meta<typeof EnterpriseDataTable> = {
  title: "Enterprise/EnterpriseDataTable",
  component: EnterpriseDataTable,
};

export default meta;

type Story = StoryObj<typeof EnterpriseDataTable>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <EnterpriseDataTable columns={columns} data={data} />
    </div>
  ),
};

export const FiltersAndSorting: Story = {
  render: () => {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
      React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState<string>("");

    return (
      <div className="p-6 space-y-4">
        <EnterpriseDataTable
          columns={columns}
          data={data}
          enableSorting
          enableColumnFilters
          state={{ sorting, columnFilters, globalFilter }}
          onStateChange={(next) => {
            const current: TableState = {
              sorting,
              columnFilters,
              globalFilter,
            };
            const resolved: TableState =
              typeof next === "function" ? next(current) : (next as TableState);

            if (resolved.sorting !== undefined)
              setSorting(resolved.sorting as SortingState);
            if (resolved.columnFilters !== undefined)
              setColumnFilters(resolved.columnFilters as ColumnFiltersState);
            if (resolved.globalFilter !== undefined)
              setGlobalFilter(resolved.globalFilter as string);
          }}
          renderToolbar={({ table }) => (
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3 border border-border shadow-soft">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground">Search</span>
                <Input
                  value={globalFilter}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setGlobalFilter(e.target.value)
                  }
                  className="max-w-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSorting([]);
                  setColumnFilters([]);
                  setGlobalFilter("");
                }}
                className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
              >
                Reset filters
              </Button>
            </div>
          )}
        />
      </div>
    );
  },
};

export const PaginationExample: Story = {
  render: () => {
    const [pagination, setPagination] = React.useState<{
      pageIndex: number;
      pageSize: number;
    }>({ pageIndex: 0, pageSize: 2 });

    const renderPaginationControls = (rowCount: number) => {
      const totalPages = Math.max(1, Math.ceil(rowCount / pagination.pageSize));
      return (
        <div className="flex items-center justify-between bg-muted/40 p-4 rounded-lg shadow-soft gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              className="rounded-lg border border-border bg-background text-foreground p-1"
              value={pagination.pageSize}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(e.target.value),
                })
              }
            >
              {[2, 3, 5, 10].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={pagination.pageIndex === 0}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.max(0, prev.pageIndex - 1),
                }))
              }
              className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
            >
              Prev
            </Button>
            <span>
              {pagination.pageIndex + 1} / {totalPages}
            </span>
            <Button
              disabled={pagination.pageIndex + 1 >= totalPages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1),
                }))
              }
              className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
            >
              Next
            </Button>
          </div>
        </div>
      );
    };

    const paginatedData = data.slice(
      pagination.pageIndex * pagination.pageSize,
      pagination.pageIndex * pagination.pageSize + pagination.pageSize,
    );

    return (
      <div className="p-6">
        {renderPaginationControls(data.length)}
        <EnterpriseDataTable columns={columns} data={paginatedData} />
        {renderPaginationControls(data.length)}
      </div>
    );
  },
};

export const RowSelectionAndActions: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<
      Record<string, boolean>
    >({});

    const onRowSelect = (id: string) => {
      setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const selectedCount = Object.values(selectedRows).filter(Boolean).length;

    const renderToolbar = () => (
      <div className="flex items-center justify-between bg-muted/40 p-4 rounded-lg shadow-soft gap-2 mb-4">
        <span>{selectedCount} selected</span>
        <div className="flex gap-2">
          <Button
            disabled={selectedCount === 0}
            onClick={() => console.log("Bulk delete:", selectedRows)}
            className="bg-destructive text-destructive-foreground rounded-lg shadow-soft hover:bg-destructive/90 hover:shadow-elevated transition-shadow duration-200 disabled:opacity-60"
          >
            Delete Selected
          </Button>
          <Button
            onClick={() => setSelectedRows({})}
            className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
          >
            Reset Selection
          </Button>
        </div>
      </div>
    );

    const enhancedColumns: ColumnDef<User, any>[] = [
      {
        id: "select",
        header: () => <span>Select</span>,
        cell: ({ row }) => (
          <>
            <label
              htmlFor={`row-select-${row.original.id}`}
              className="sr-only"
            >
              Checkbox
            </label>
            <input
              id={`row-select-${row.original.id}`}
              type="checkbox"
              checked={!!selectedRows[row.original.id]}
              onChange={() => onRowSelect(row.original.id)}
            />
          </>
        ),
      },
      ...columns,
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
              onClick={() => console.log("Edit row:", row.original.id)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
              onClick={() => console.log("Delete row:", row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div className="p-6">
        {renderToolbar()}
        <EnterpriseDataTable
          columns={enhancedColumns}
          data={data}
          getRowId={(row) => row.id}
        />
      </div>
    );
  },
};

export const FullFeatureDemo: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = React.useState<string>("");
    const [pagination, setPagination] = React.useState<{
      pageIndex: number;
      pageSize: number;
    }>({ pageIndex: 0, pageSize: 2 });
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
      {},
    );

    const handleDeleteSelected = () => {
      const selectedIds = Object.keys(rowSelection).filter(
        (key) => rowSelection[key],
      );
      alert("Deleting rows: " + selectedIds.join(", "));
    };

    const renderToolbar = () => (
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-muted/40 p-4 rounded-lg shadow-soft">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setGlobalFilter(e.target.value)
          }
          className="w-48 rounded-lg border border-border bg-background text-foreground"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setGlobalFilter("")}
            className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
          >
            Reset Filters
          </Button>
          <Button
            onClick={handleDeleteSelected}
            disabled={!Object.values(rowSelection).some(Boolean)}
            className="bg-destructive text-destructive-foreground rounded-lg shadow-soft hover:bg-destructive/90 hover:shadow-elevated transition-shadow duration-200 disabled:opacity-60"
          >
            Delete Selected
          </Button>
        </div>
      </div>
    );

    const filteredData = data.filter((d) => {
      const q = globalFilter.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.role.toLowerCase().includes(q)
      );
    });

    const totalPages = Math.max(
      1,
      Math.ceil(filteredData.length / pagination.pageSize),
    );
    const paginatedData = filteredData.slice(
      pagination.pageIndex * pagination.pageSize,
      pagination.pageIndex * pagination.pageSize + pagination.pageSize,
    );

    return (
      <div className="p-6">
        {renderToolbar()}
        <EnterpriseDataTable
          columns={[
            {
              id: "select",
              header: ({ table }) => (
                <>
                  <label htmlFor="select-all-page-rows" className="sr-only">
                    Checkbox
                  </label>
                  <input
                    id="select-all-page-rows"
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected?.() ?? false}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      table.toggleAllPageRowsSelected?.(e.target.checked)
                    }
                  />
                </>
              ),
              cell: ({ row }) => (
                <>
                  <label htmlFor={`row-selection-${row.id}`} className="sr-only">
                    Checkbox
                  </label>
                  <input
                    id={`row-selection-${row.id}`}
                    type="checkbox"
                    checked={rowSelection[row.id] ?? false}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setRowSelection((prev) => ({
                        ...prev,
                        [row.id]: e.target.checked,
                      }))
                    }
                  />
                </>
              ),
            },
            ...columns,
            {
              id: "actions",
              header: "Actions",
              cell: ({ row }) => (
                <Button
                  size="sm"
                  className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
                  onClick={() => alert(`Row action: ${row.original.name}`)}
                >
                  Action
                </Button>
              ),
            },
          ]}
          data={paginatedData}
        />
        <div className="flex items-center justify-between bg-muted/40 p-4 rounded-lg shadow-soft gap-2 mt-4">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              className="rounded-lg border border-border bg-background text-foreground p-1"
              value={pagination.pageSize}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(e.target.value),
                })
              }
            >
              {[2, 3, 5, 10].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={pagination.pageIndex === 0}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.max(0, prev.pageIndex - 1),
                }))
              }
              className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
            >
              Prev
            </Button>
            <span>
              {pagination.pageIndex + 1} / {totalPages}
            </span>
            <Button
              disabled={pagination.pageIndex + 1 >= totalPages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1),
                }))
              }
              className="bg-background border border-border text-foreground rounded-lg shadow-soft hover:bg-muted hover:shadow-elevated transition-shadow duration-200"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  },
};
