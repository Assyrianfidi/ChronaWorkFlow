import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";

// Mock the auth store first
vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Import after setting up mocks
import { useRouter } from "next/navigation";
import { useAuthStore } from '../store/auth-store';
import LoginPage from '../page';

// Setup mocks
const mockUseAuthStore = vi.mocked(useAuthStore);
const mockLogin = vi.fn();

type User = {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MockUseAuthStore = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Auth methods
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  // Password management
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  resetPassword: (data: {
    token: string;
    newPassword: string;
  }) => Promise<{ message: string }>;
  // User profile
  updateProfile: (userData: Partial<User>) => Promise<User>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ message: string }>;
};

const defaultAuthState = {
  user: null,
  token: null,
  error: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  register: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  checkAuth: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
  requestPasswordReset: vi
    .fn()
    .mockResolvedValue({ message: "Password reset email sent" }),
  resetPassword: vi
    .fn()
    .mockResolvedValue({ message: "Password reset successful" }),
  updateProfile: vi.fn().mockResolvedValue({
    id: "1",
    name: "Test User",
    email: "test@example.com",
    role: "user",
  }),
  changePassword: vi
    .fn()
    .mockResolvedValue({ message: "Password changed successfully" }),
};

describe("LoginPage", () => {
  let mockAuthState: MockUseAuthStore;

  // Helper to update mock auth state
  const updateMockAuthState = (updates: Partial<MockUseAuthStore>) => {
    mockAuthState = { ...mockAuthState, ...updates } as MockUseAuthStore;
    mockUseAuthStore.mockImplementation((selector?: (state: any) => any) => {
      const state = { ...mockAuthState };
      return typeof selector === "function" ? selector(state) : state;
    });
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset mock implementations
    mockLogin.mockReset().mockResolvedValue(undefined);

    // Initialize default mock auth state
    mockAuthState = defaultAuthState as MockUseAuthStore;

    // Set up default mock implementation using mockAuthState
    mockUseAuthStore.mockImplementation((selector?: (state: any) => any) => {
      const state = { ...mockAuthState };
      return typeof selector === "function" ? selector(state) : state;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    // Check if the form elements are rendered
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    // Check if login was called with the right arguments
    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("shows loading state during form submission", () => {
    // Update mock state to loading
    updateMockAuthState({ isLoading: true });

    render(<LoginPage />);

    // Check if the loading state is shown
    expect(
      screen.getByRole("button", { name: /signing in.../i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows error message when login fails", async () => {
    const errorMessage = "Invalid credentials";

    // Setup mock to reject with error
    mockLogin.mockImplementationOnce(() => {
      updateMockAuthState({ error: errorMessage });
      return Promise.reject(new Error(errorMessage));
    });

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    // Check that the error message is shown
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it("redirects to dashboard if already authenticated", () => {
    // Update mock state to authenticated
    updateMockAuthState({
      isAuthenticated: true,
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
    });

    render(<LoginPage />);

    // Check if redirect was called
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
