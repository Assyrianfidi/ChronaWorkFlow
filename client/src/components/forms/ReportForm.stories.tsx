import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ReportForm } from './ReportForm.js';
import type { ReportFormProps } from './types.js';

// Mock react-hook-form for Storybook
const mockForm = {
  register: fn(),
  handleSubmit: fn((cb) => cb),
  formState: { errors: {} },
  reset: fn(),
  setValue: fn(),
  getValues: fn(() => ({})),
  control: {
    _subjects: { values: { next: fn() } },
  },
};

const meta: Meta<typeof ReportForm> = {
  title: "Forms/ReportForm",
  component: ReportForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSubmit: { action: "submitted" },
    onCancel: { action: "cancelled" },
    initialValues: { control: "object" },
    isSubmitting: { control: "boolean" },
    submitLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: fn(),
    initialValues: {
      title: "",
      description: "",
      status: "draft",
      priority: "medium",
      dueDate: "",
      isPublic: false,
      tags: [],
      attachments: [],
    },
  },
};

export const WithInitialValues: Story = {
  args: {
    onSubmit: fn(),
    initialValues: {
      title: "Quarterly Financial Report",
      description:
        "A comprehensive analysis of Q3 financial performance including revenue, expenses, and projections.",
      status: "draft",
      priority: "high",
      dueDate: "2024-12-31",
      isPublic: true,
      tags: ["finance", "quarterly", "2024"],
      attachments: [],
    },
  },
};

export const Loading: Story = {
  args: {
    onSubmit: fn(),
    isSubmitting: true,
    initialValues: {
      title: "Loading Report",
      description: "This report is currently being processed.",
      status: "draft",
      priority: "medium",
      dueDate: "",
      isPublic: false,
      tags: [],
      attachments: [],
    },
  },
};

export const Submitting: Story = {
  args: {
    onSubmit: fn(),
    isSubmitting: true,
    submitLabel: "Submitting...",
    initialValues: {
      title: "Report in Progress",
      description: "This report is being submitted to the server.",
      status: "in_review",
      priority: "high",
      dueDate: "2024-12-31",
      isPublic: false,
      tags: [],
      attachments: [],
    },
  },
};

export const WithCancel: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    initialValues: {
      title: "Cancellable Report",
      description: "This report can be cancelled during editing.",
      status: "draft",
      priority: "low",
      dueDate: "",
      isPublic: false,
      tags: [],
      attachments: [],
    },
  },
};

export const WithCustomSubmitLabel: Story = {
  args: {
    onSubmit: fn(),
    submitLabel: "Save Draft",
    initialValues: {
      title: "Custom Submit Report",
      description: "This report uses a custom submit button label.",
      status: "draft",
      priority: "medium",
      dueDate: "",
      isPublic: false,
      tags: [],
      attachments: [],
    },
  },
};
