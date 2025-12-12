import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ReportList } from './ReportList.js';

import { ReportStatus } from '../types/report.js';

// Mock data for the reports
const mockReports = [
  {
    id: "1",
    title: "Q1 2024 Financial Report",
    amount: 12500.75,
    status: "APPROVED",
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Q2 2024 Forecast",
    amount: 18750.0,
    status: "PENDING",
    createdAt: "2024-06-10T14:30:00Z",
  },
  {
    id: "3",
    title: "Annual Tax Report 2023",
    amount: 45620.5,
    status: "DRAFT",
    createdAt: "2024-01-20T09:15:00Z",
  },
  {
    id: "4",
    title: "Marketing Expenses Q1 2024",
    amount: 8765.25,
    status: "REJECTED",
    createdAt: "2024-03-28T16:45:00Z",
  },
];

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the API response
const mockApiResponse = {
  data: mockReports,
  total: mockReports.length,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Mock the useReports hook
const mockUseReports = {
  data: mockApiResponse,
  isLoading: false,
  isError: false,
};

const mockUseDeleteReport = {
  mutate: () => {},
  isPending: false,
};

// Mock the hooks
jest.mock("../hooks/useReports", () => ({
  useReports: () => mockUseReports,
  useDeleteReport: () => mockUseDeleteReport,
}));

const meta: Meta<typeof ReportList> = {
  title: "Reports/ReportList",
  component: ReportList,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ReportList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [],
    },
  },
  decorators: [
    (Story) => {
      // Override the mock to show loading state
      Object.assign(mockUseReports, {
        data: undefined,
        isLoading: true,
        isError: false,
      });
      return <Story />;
    },
  ],
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [],
    },
  },
  decorators: [
    (Story) => {
      // Override the mock to show error state
      Object.assign(mockUseReports, {
        data: undefined,
        isLoading: false,
        isError: true,
      });
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [],
    },
  },
  decorators: [
    (Story) => {
      // Override the mock to show empty state
      Object.assign(mockUseReports, {
        data: { data: [], total: 0, page: 1, limit: 10, totalPages: 0 },
        isLoading: false,
        isError: false,
      });
      return <Story />;
    },
  ],
};
