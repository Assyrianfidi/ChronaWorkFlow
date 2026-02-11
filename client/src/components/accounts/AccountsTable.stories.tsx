import type { Meta, StoryObj } from "@storybook/react";
import { AccountsTable } from "./AccountsTable";
import { VirtualizedAccountsTable } from "./VirtualizedAccountsTable";

// Mock account data
const mockAccounts = [
  {
    id: "1",
    name: "Cash",
    type: "asset" as const,
    balance: 10000,
    parent: null,
    children: [
      {
        id: "2",
        name: "Checking Account",
        type: "asset" as const,
        balance: 5000,
        parent: "1",
        children: [],
      },
      {
        id: "3",
        name: "Savings Account",
        type: "asset" as const,
        balance: 5000,
        parent: "1",
        children: [],
      },
    ],
  },
  {
    id: "4",
    name: "Accounts Payable",
    type: "liability" as const,
    balance: -3000,
    parent: null,
    children: [],
  },
  {
    id: "5",
    name: "Revenue",
    type: "revenue" as const,
    balance: 15000,
    parent: null,
    children: [],
  },
];

const meta: Meta<typeof AccountsTable> = {
  title: "Accounts/AccountsTable",
  component: AccountsTable,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    accounts: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    accounts: mockAccounts,
    searchQuery: "",
    expandedIds: new Set<string>(),
    onToggleExpand: () => {},
  },
};

export const Loading: Story = {
  args: {
    accounts: [],
    searchQuery: "",
    expandedIds: new Set<string>(),
    onToggleExpand: () => {},
  },
};

export const Empty: Story = {
  args: {
    accounts: [],
    searchQuery: "",
    expandedIds: new Set<string>(),
    onToggleExpand: () => {},
  },
};

export const NonExpandable: Story = {
  args: {
    accounts: mockAccounts,
    searchQuery: "",
    expandedIds: new Set<string>(),
    onToggleExpand: () => {},
  },
};

export const LargeDataset: Story = {
  args: {
    accounts: [
      ...mockAccounts,
      {
        id: "6",
        name: "Equipment",
        type: "asset" as const,
        balance: 25000,
        parent: null,
        children: [],
      },
      {
        id: "7",
        name: "Office Supplies",
        type: "expense" as const,
        balance: -1500,
        parent: null,
        children: [],
      },
    ],
    searchQuery: "",
    expandedIds: new Set<string>(),
    onToggleExpand: () => {},
  },
};
