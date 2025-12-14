import React from "react";
import type { ChangeEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";

import { EnterpriseDataTable } from './EnterpriseDataTable';
import { Input } from '@/../../input';
import { Button } from '@/../../button';

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
            if (next.sorting !== undefined)
              setSorting(next.sorting as SortingState);
            if (next.columnFilters !== undefined)
              setColumnFilters(next.columnFilters as ColumnFiltersState);
            if (next.globalFilter !== undefined)
              setGlobalFilter(next.globalFilter as string);
          }}
          renderToolbar={({}, table) => (
            <div className="flex items-center justify-between gap-4 rounded-xl bg-surface2 px-4 py-3 border border-border-gray shadow-soft">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-black/70">Search</span>
                <Input
                  value={globalFilter}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setGlobalFilter(e.target.value)
                  }
                  placeholder="Search users..."
                  className="max-w-xs"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSorting([]);
                  setColumnFilters([]);
                  setGlobalFilter("");
                }}
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
        <div className="flex items-center justify-between bg-surface2 p-4 rounded-lg shadow-soft gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              className="rounded-lg border border-border-gray bg-surface1 text-black/70 p-1"
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
              className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
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
              className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
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
      <div className="flex items-center justify-between bg-surface2 p-4 rounded-lg shadow-soft gap-2 mb-4">
        <span>{selectedCount} selected</span>
        <div className="flex gap-2">
          <Button
            disabled={selectedCount === 0}
            onClick={() => console.log("Bulk delete:", selectedRows)}
            className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
          >
            Delete Selected
          </Button>
          <Button
            onClick={() => setSelectedRows({})}
            className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
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
          <input
            type="checkbox"
            checked={!!selectedRows[row.original.id]}
            onChange={() => onRowSelect(row.original.id)}
          />
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
              className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
              onClick={() => console.log("Edit row:", row.original.id)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-surface2 p-4 rounded-lg shadow-soft">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setGlobalFilter(e.target.value)
          }
          className="w-48 rounded-lg border border-border-gray bg-surface1 text-black/70"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setGlobalFilter("")}
            className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
          >
            Reset Filters
          </Button>
          <Button
            onClick={handleDeleteSelected}
            disabled={!Object.values(rowSelection).some(Boolean)}
            className="bg-red-600 text-white rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200 disabled:opacity-50"
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
                <input
                  type="checkbox"
                  checked={table.getIsAllPageRowsSelected?.() ?? false}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    table.toggleAllPageRowsSelected?.(e.target.checked)
                  }
                />
              ),
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  checked={rowSelection[row.id] ?? false}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setRowSelection((prev) => ({
                      ...prev,
                      [row.id]: e.target.checked,
                    }))
                  }
                />
              ),
            },
            ...columns,
            {
              id: "actions",
              header: "Actions",
              cell: ({ row }) => (
                <Button
                  size="sm"
                  className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
                  onClick={() => alert(`Row action: ${row.original.name}`)}
                >
                  Action
                </Button>
              ),
            },
          ]}
          data={paginatedData}
          state={{ rowSelection }}
          onStateChange={(next) => {
            if (next.rowSelection) {
              setRowSelection(next.rowSelection as RowSelectionState);
            }
          }}
        />
        <div className="flex items-center justify-between bg-surface2 p-4 rounded-lg shadow-soft gap-2 mt-4">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              className="rounded-lg border border-border-gray bg-surface1 text-black/70 p-1"
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
              className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
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
              className="bg-surface1 border border-border-gray text-black/70 rounded-lg shadow-soft hover:shadow-elevated transition-shadow duration-200"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  },
};
