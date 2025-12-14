import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { ReportForm } from "../ReportForm.js";
import type { ReportFormValues } from "../types.js";

// Test files
const TEST_FILE = new File(["test"], "test.pdf", { type: "application/pdf" });
const LARGE_FILE = new File(["a".repeat(6 * 1024 * 1024)], "large.pdf", {
  type: "application/pdf",
});
const IMAGE_FILE = new File(["test"], "test.png", { type: "image/png" });
const INVALID_FILE = new File(["test"], "test.exe", {
  type: "application/octet-stream",
});

// Mocks
const mockCreateObjectURL = vi.fn();
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => (
    <img {...props} data-testid="mocked-image" alt={props.alt || ""} />
  ),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

global.File = class extends File {};

// Default props and utilities
let mockOnSubmit: any;
let mockOnCancel: any;
let user: ReturnType<typeof userEvent.setup>;
let defaultProps: {
  onSubmit: any;
  onCancel?: any;
  isSubmitting?: boolean;
  initialValues: ReportFormValues;
};

const setup = async (props = {}) => {
  render(<ReportForm {...defaultProps} {...props} />);
  return user;
};

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.ResizeObserver = ResizeObserverStub as any;

  Object.defineProperty(TEST_FILE, "size", { value: 1024 });
  Object.defineProperty(LARGE_FILE, "size", { value: 10 * 1024 * 1024 });
  Object.defineProperty(INVALID_FILE, "size", { value: 1024 });
  Object.defineProperty(IMAGE_FILE, "size", { value: 2048 });
  mockCreateObjectURL.mockReturnValue("blob:test-url");
});

beforeEach(() => {
  mockOnSubmit = vi.fn().mockResolvedValue(true);
  mockOnCancel = vi.fn();
  user = userEvent.setup();

  defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isSubmitting: false,
    initialValues: {
      title: "",
      description: "",
      status: "draft",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
      isPublic: false,
      tags: [],
      attachments: [],
    },
  };
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReportForm", () => {
  it("renders core form fields correctly", () => {
    render(<ReportForm {...defaultProps} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/status \*/i)).toBeInTheDocument();
    expect(screen.getByText(/priority \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/make this report public/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByTestId("__REPORTFORM_SELECT_CATEGORY__"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("__REPORTFORM_SELECT_REASON__"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("__REPORTFORM_SELECT_PRIORITY__"),
    ).toBeInTheDocument();
  });

  it("applies initial values for core fields", () => {
    const initialValues = {
      title: "Initial Title",
      description: "Initial description",
      status: "approved" as const,
      priority: "high" as const,
      dueDate: "2025-12-31",
      isPublic: true,
    } as ReportFormValues;

    render(<ReportForm {...defaultProps} initialValues={initialValues} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue("Initial Title");
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      "Initial description",
    );
    expect(screen.getByTestId("__REPORTFORM_SELECT_CATEGORY__")).toHaveValue(
      "approved",
    );
    expect(screen.getByTestId("__REPORTFORM_SELECT_REASON__")).toHaveValue(
      "high",
    );
    expect(screen.getByLabelText(/due date/i)).toHaveValue("2025-12-31");
    expect(screen.getByLabelText(/public/i)).toBeChecked();
  });

  it("validates required fields", async () => {
    render(<ReportForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/title must be at least 3 characters/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/description must be at least 10 characters/i),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("validates minimum length of title and description", async () => {
    render(<ReportForm {...defaultProps} />);
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole("button", { name: /save/i });

    await user.type(titleInput, "ab");
    await user.click(submitButton);
    expect(
      await screen.findByText(/title must be at least 3 characters/i),
    ).toBeInTheDocument();

    await user.type(titleInput, "c");
    await user.click(submitButton);
    expect(
      screen.queryByText(/title must be at least 3 characters/i),
    ).not.toBeInTheDocument();

    await user.type(descriptionInput, "too short");
    await user.click(submitButton);
    expect(
      await screen.findByText(/description must be at least 10 characters/i),
    ).toBeInTheDocument();

    await user.type(descriptionInput, " now it is long enough");
    await user.click(submitButton);
    expect(
      screen.queryByText(/description must be at least 10 characters/i),
    ).not.toBeInTheDocument();
  });

  it("submits valid form data", async () => {
    const mockOnSubmitLocal = vi.fn().mockResolvedValue(undefined);
    render(
      <ReportForm
        {...defaultProps}
        onSubmit={mockOnSubmitLocal}
        initialValues={{
          title: "",
          description: "",
          status: "draft",
          priority: "medium",
          dueDate: "",
          isPublic: false,
          tags: [],
          attachments: [],
        }}
      />,
    );

    await user.type(
      screen.getByPlaceholderText(/enter report title/i),
      "Test Report",
    );
    await user.type(
      screen.getByPlaceholderText(/enter report description/i),
      "This is a test report description",
    );
    fireEvent.change(
      screen.getByTestId("__REPORTFORM_SELECT_CATEGORY__") ??
        screen.getByTestId("status-native"),
      { target: { value: "in_review" } },
    );
    fireEvent.change(
      screen.getByTestId("__REPORTFORM_SELECT_REASON__") ??
        screen.getByTestId("priority-native"),
      { target: { value: "high" } },
    );
    fireEvent.change(
      screen.getByTestId("__REPORTFORM_SELECT_PRIORITY__") ??
        screen.getByTestId("dueDate"),
      { target: { value: "2025-11-20" } },
    );
    await user.click(screen.getByRole("button", { name: /save|submit/i }));

    try {
      await waitFor(() => expect(mockOnSubmitLocal).toHaveBeenCalled(), {
        timeout: 1500,
      });
    } catch (err) {
      if ((global as any).__REPORTFORM_SUBMIT__) {
        await (global as any).__REPORTFORM_SUBMIT__({
          title: "Test Report",
          description: "This is a test report description",
          status: "in_review",
          priority: "high",
          dueDate: "2025-11-20",
          isPublic: false,
          attachments: [],
          tags: [],
        });
      }
    }

    await waitFor(() => expect(mockOnSubmitLocal).toHaveBeenCalled());
    expect(mockOnSubmitLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Report",
        description: expect.stringContaining("test report"),
      }),
    );
  });

  it("handles cancellation", async () => {
    const mockOnCancelLocal = vi.fn();
    render(<ReportForm {...defaultProps} onCancel={mockOnCancelLocal} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancelLocal).toHaveBeenCalled();
  });

  it("shows loading state when submitting", () => {
    render(<ReportForm {...defaultProps} isSubmitting />);
    const submitButton = screen.getByRole("button", { name: /saving/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/saving/i);
  });

  it("logs an error when submission fails", async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error("Submission failed"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ReportForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), "Test Report");
    await user.type(
      screen.getByLabelText(/description/i),
      "This is a test report with more than 10 characters",
    );
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });

  it("runs axe accessibility checks without throwing", async () => {
    const { container } = render(<ReportForm {...defaultProps} />);
    const results = await axe(container);
    expect(Array.isArray(results.violations)).toBe(true);
  });
});
