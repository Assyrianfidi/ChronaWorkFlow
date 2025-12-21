import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useAuthStore } from '../store/auth-store';
import LoginPage from '../page';

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock the auth store
vi.mock("../store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

// Default state + mock handlers
const mockLogin = vi.fn();
const defaultAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  clearError: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
};

describe("LoginPage", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock router
    (useRouter as any).mockImplementation(() => ({
      push: mockPush,
      replace: mockReplace,
    }));

    // Default auth store implementation
    (useAuthStore as any).mockImplementation(
      (selector?: (state: any) => any) => {
        const state = {
          ...defaultAuthState,
          login: mockLogin,
        };
        return selector ? selector(state) : state;
      },
    );
  });

  it("renders login form", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it("validates form inputs", async () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/password must be at least 6 characters/i),
    ).toBeInTheDocument();
  });

  it("handles successful login", async () => {
    mockLogin.mockResolvedValueOnce({});

    render(<LoginPage />);

    // Fill in the form
    fireEvent.input(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Check if login was called with correct data
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("handles login error", async () => {
    const errorMessage = "Invalid credentials";
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);

    // Fill in the form
    fireEvent.input(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Check if error is displayed
    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });

  it("redirects to dashboard if already authenticated", () => {
    // Mock authenticated state
    (useAuthStore as any).mockImplementation(
      (selector?: (state: any) => any) => {
        const state = {
          ...defaultAuthState,
          isAuthenticated: true,
          user: { id: "1", name: "Test User", email: "test@example.com" },
        };
        return selector ? selector(state) : state;
      },
    );

    render(<LoginPage />);

    // Check if redirect was called
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
