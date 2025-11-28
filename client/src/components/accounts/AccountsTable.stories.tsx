import type { Meta, StoryObj } from '@storybook/react';
import { AccountsTable } from './AccountsTable';
import { AccountTableFilters } from './AccountTableFilters';
import { VirtualizedAccountsTable } from './VirtualizedAccountsTable';

// Mock account data
const mockAccounts = [
  {
    id: '1',
    name: 'Cash',
    type: 'asset' as const,
    balance: 10000,
    parent: null,
    children: [
      {
        id: '2',
        name: 'Checking Account',
        type: 'asset' as const,
        balance: 5000,
        parent: '1',
        children: [],
      },
      {
        id: '3',
        name: 'Savings Account',
        type: 'asset' as const,
        balance: 5000,
        parent: '1',
        children: [],
      },
    ],
  },
  {
    id: '4',
    name: 'Accounts Payable',
    type: 'liability' as const,
    balance: -3000,
    parent: null,
    children: [],
  },
  {
    id: '5',
    name: 'Revenue',
    type: 'revenue' as const,
    balance: 15000,
    parent: null,
    children: [],
  },
];

const meta: Meta<typeof AccountsTable> = {
  title: 'Accounts/AccountsTable',
  component: AccountsTable,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    accounts: { control: 'object' },
    loading: { control: 'boolean' },
    searchable: { control: 'boolean' },
    expandable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    accounts: mockAccounts,
    loading: false,
    searchable: true,
    expandable: true,
  },
};

export const Loading: Story = {
  args: {
    accounts: [],
    loading: true,
    searchable: true,
    expandable: true,
  },
};

export const Empty: Story = {
  args: {
    accounts: [],
    loading: false,
    searchable: true,
    expandable: true,
  },
};

export const NonExpandable: Story = {
  args: {
    accounts: mockAccounts,
    loading: false,
    searchable: true,
    expandable: false,
  },
};

export const LargeDataset: Story = {
  args: {
    accounts: [
      ...mockAccounts,
      {
        id: '6',
        name: 'Equipment',
        type: 'asset' as const,
        balance: 25000,
        parent: null,
        children: [],
      },
      {
        id: '7',
        name: 'Office Supplies',
        type: 'expense' as const,
        balance: -1500,
        parent: null,
        children: [],
      },
    ],
    loading: false,
    searchable: true,
    expandable: true,
  },
};
