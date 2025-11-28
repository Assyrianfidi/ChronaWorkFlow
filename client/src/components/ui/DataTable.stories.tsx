import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, type Column } from './DataTable';

// Mock data for the table
interface MockData {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Pending';
  joinDate: string;
  lastLogin: string;
}

const mockData: MockData[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active', joinDate: '2024-01-15', lastLogin: '2024-01-20' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', status: 'Active', joinDate: '2024-01-10', lastLogin: '2024-01-19' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Manager', status: 'Inactive', joinDate: '2024-01-05', lastLogin: '2024-01-18' },
  { id: 4, name: 'Alice Brown', email: 'alice.brown@example.com', role: 'User', status: 'Pending', joinDate: '2024-01-20', lastLogin: 'Never' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie.wilson@example.com', role: 'Admin', status: 'Active', joinDate: '2024-01-12', lastLogin: '2024-01-20' },
];

const columns: Column<MockData>[] = [
  { key: 'id', title: 'ID', sortable: true },
  { key: 'name', title: 'Name', sortable: true, filterable: true },
  { key: 'email', title: 'Email', sortable: true, filterable: true },
  { key: 'role', title: 'Role', sortable: true, filterable: true },
  { 
    key: 'status', 
    title: 'Status', 
    sortable: true, 
    filterable: true,
    render: (value: string) => (
      <span 
        style={{ 
          padding: '2px 8px', 
          borderRadius: '12px', 
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: value === 'Active' ? '#10b981' : value === 'Inactive' ? '#ef4444' : '#f59e0b',
          color: 'white'
        }}
      >
        {value}
      </span>
    )
  },
  { key: 'joinDate', title: 'Join Date', sortable: true },
  { key: 'lastLogin', title: 'Last Login', sortable: true },
];

const meta: Meta<typeof DataTable<MockData>> = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Advanced data table component with sorting, filtering, searching, pagination, and export capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
    columns: { control: 'object' },
    loading: { control: 'boolean' },
    searchable: { control: 'boolean' },
    exportable: { control: 'boolean' },
    emptyMessage: { control: 'text' },
    pageSize: { control: 'number', min: 5, max: 100 },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<MockData>>;

export const Default: Story = {
  args: {
    data: mockData,
    columns,
    loading: false,
    searchable: true,
    exportable: true,
    emptyMessage: 'No data available',
    pageSize: 10,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns,
    loading: true,
    searchable: true,
    exportable: true,
    emptyMessage: 'No data available',
    pageSize: 10,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns,
    loading: false,
    searchable: true,
    exportable: true,
    emptyMessage: 'No users found. Try adjusting your filters.',
    pageSize: 10,
  },
};

export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['Admin', 'User', 'Manager'][i % 3],
      status: ['Active', 'Inactive', 'Pending'][i % 3] as 'Active' | 'Inactive' | 'Pending',
      joinDate: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      lastLogin: `2024-01-${String((i % 20) + 1).padStart(2, '0')}`,
    })),
    columns,
    loading: false,
    searchable: true,
    exportable: true,
    emptyMessage: 'No data available',
    pageSize: 20,
  },
};

export const MinimalFeatures: Story = {
  args: {
    data: mockData.slice(0, 3),
    columns: columns.slice(0, 4), // Only first 4 columns
    loading: false,
    searchable: false,
    exportable: false,
    emptyMessage: 'No data available',
    pageSize: 5,
  },
};

export const WithRowClick: Story = {
  args: {
    data: mockData,
    columns,
    loading: false,
    searchable: true,
    exportable: true,
    emptyMessage: 'No data available',
    pageSize: 10,
    onRowClick: (row) => alert(`Clicked on row: ${row.name}`),
  },
};
