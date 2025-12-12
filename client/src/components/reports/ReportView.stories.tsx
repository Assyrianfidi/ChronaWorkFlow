import type { Meta, StoryObj } from "@storybook/react";
import { ReportView } from './ReportView.js';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock data
const mockReport = {
  id: "1",
  title: "Q2 2023 Financial Report",
  description:
    "<p>This is a detailed financial report for Q2 2023. It includes all the financial metrics and KPIs for the quarter.</p><ul><li>Revenue increased by 15% compared to Q1</li><li>Operating expenses decreased by 5%</li><li>Net profit margin improved to 22%</li></ul>",
  status: "approved",
  amount: 125000,
  notes: "This report has been reviewed and approved by the finance team.",
  createdAt: "2023-07-15T10:00:00Z",
  updatedAt: "2023-07-16T14:30:00Z",
  createdBy: {
    id: "user-1",
    name: "John Doe",
    email: "john.doe@example.com",
  },
  attachments: [
    {
      id: "att-1",
      name: "financial_summary.pdf",
      url: "#",
      size: "2.4 MB",
      type: "application/pdf",
    },
    {
      id: "att-2",
      name: "expense_details.xlsx",
      url: "#",
      size: "1.1 MB",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ],
};

// Mock query client with the report data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Mock API response
const mockApiResponse = {
  data: mockReport,
  isLoading: false,
  isError: false,
};

// Mock the useReport hook
jest.mock("../hooks/useReports", () => ({
  useReport: () => mockApiResponse,
}));

const meta: Meta<typeof ReportView> = {
  title: "Reports/ReportView",
  component: ReportView,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/reports/1"]}>
          <Routes>
            <Route path="/reports/:id" element={<Story />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    mockData: [
      {
        url: "/api/reports/1",
        method: "GET",
        status: 200,
        response: mockReport,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof ReportView>;

export const Default: Story = {};

export const Loading: Story = {
  parameters: {
    mockData: [
      {
        url: "/api/reports/1",
        method: "GET",
        status: 200,
        response: {},
        delay: 2000, // Simulate loading
      },
    ],
  },
  decorators: [
    (Story) => {
      // Override the mock to simulate loading state
      jest
        .spyOn(require("../hooks/useReports"), "useReport")
        .mockImplementation(() => ({
          data: undefined,
          isLoading: true,
          isError: false,
        }));
      return <Story />;
    },
  ],
};

export const Error: Story = {
  parameters: {
    mockData: [
      {
        url: "/api/reports/1",
        method: "GET",
        status: 404,
        response: {
          error: "Report not found",
        },
      },
    ],
  },
  decorators: [
    (Story) => {
      // Override the mock to simulate error state
      jest
        .spyOn(require("../hooks/useReports"), "useReport")
        .mockImplementation(() => ({
          data: undefined,
          isLoading: false,
          isError: true,
          error: { message: "Failed to load report" },
        }));
      return <Story />;
    },
  ],
};

export const PendingStatus: Story = {
  decorators: [
    (Story) => {
      jest
        .spyOn(require("../hooks/useReports"), "useReport")
        .mockImplementation(() => ({
          ...mockApiResponse,
          data: {
            ...mockReport,
            status: "pending",
            notes: "This report is pending review by the finance team.",
          },
        }));
      return <Story />;
    },
  ],
};

export const RejectedStatus: Story = {
  decorators: [
    (Story) => {
      jest
        .spyOn(require("../hooks/useReports"), "useReport")
        .mockImplementation(() => ({
          ...mockApiResponse,
          data: {
            ...mockReport,
            status: "rejected",
            notes:
              "This report was rejected due to incomplete information. Please update and resubmit.",
          },
        }));
      return <Story />;
    },
  ],
};

export const NoAttachments: Story = {
  decorators: [
    (Story) => {
      jest
        .spyOn(require("../hooks/useReports"), "useReport")
        .mockImplementation(() => ({
          ...mockApiResponse,
          data: {
            ...mockReport,
            attachments: [],
          },
        }));
      return <Story />;
    },
  ],
};

export const NoNotes: Story = {
  decorators: [
    (Story) => {
      jest
        .spyOn(require("../hooks/useReports"), "useReport")
        .mockImplementation(() => ({
          ...mockApiResponse,
          data: {
            ...mockReport,
            notes: "",
          },
        }));
      return <Story />;
    },
  ],
};
