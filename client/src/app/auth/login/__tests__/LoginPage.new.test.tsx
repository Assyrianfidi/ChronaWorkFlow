import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";

// Create mock router functions
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

// Mock the modules
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock the auth store
const mockLogin = vi.fn().mockResolvedValue({});

// Create a mock store with reactive values
let mockAuthState = {
  user: null as any,
  token: null as string | null,
  isAuthenticated: false,
  isLoading: false,
  error: null as string | null,
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

const mockUseAuthStore = vi
  .fn()
  .mockImplementation((selector?: (state: typeof mockAuthState) => any) => {
    return selector ? selector(mockAuthState) : mockAuthState;
  });

vi.mock("../store/auth-store", () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Import the component after mocks are set up
import LoginPage from "../page.js";

describe("LoginPage", () => {
  // Reset all mocks before each test

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock auth state
    mockAuthState = {
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

    // Reset router mocks
    mockPush.mockReset();

    // Reset the mock implementation
    mockUseAuthStore.mockImplementation(
      (selector?: (state: typeof mockAuthState) => any) => {
        return selector ? selector(mockAuthState) : mockAuthState;
      },
    );
  });

  it("renders the login form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    const testEmail = "test@example.com";
    const testPassword = "password123";

    // Mock the login function to resolve successfully
    const loginResponse = {
      user: { id: "1", email: testEmail },
      token: "test-token",
    };
    mockLogin.mockResolvedValue(loginResponse);

    const { rerender } = render(<LoginPage />);

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: testEmail },
      });

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: testPassword },
      });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // Update the auth state to simulate successful login
      mockAuthState = {
        ...mockAuthState,
        isAuthenticated: true,
        user: loginResponse.user,
        token: loginResponse.token,
      };

      // Force a re-render to trigger the effect
      rerender(<LoginPage />);

      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check that login was called with the correct data
    expect(mockLogin).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
    });

    // Verify redirect happened
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("shows loading state during form submission", async () => {
    // Mock the login to return a promise that won't resolve immediately
    let resolveLogin: (value?: any) => void;
    const loginPromise = new Promise<any>((resolve) => {
      resolveLogin = resolve;
    });

    mockLogin.mockImplementation(() => loginPromise);

    // Initial render
    mockAuthState = {
      ...mockAuthState,
      isLoading: false,
    };

    const { rerender } = render(<LoginPage />);

    // Fill in the form and submit
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // Update the loading state
      mockAuthState = {
        ...mockAuthState,
        isLoading: true,
      };

      // Force a re-render with loading state
      rerender(<LoginPage />);

      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check the button state during loading
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Signing in...");
    expect(button).toBeDisabled();

    // Complete the login
    await act(async () => {
      resolveLogin!({ user: { id: "1" }, token: "test-token" });

      // Update state after login completes
      mockAuthState = {
        ...mockAuthState,
        isLoading: false,
        isAuthenticated: true,
        user: { id: "1", email: "test@example.com" },
        token: "test-token",
      };

      rerender(<LoginPage />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("shows error message when login fails", async () => {
    const errorMessage = "Invalid credentials";

    // Mock the login to reject with an error
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));

    const { rerender } = render(<LoginPage />);

    // Fill in the form and submit
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "wrongpassword" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // Update the state to show the error
      mockAuthState = {
        ...mockAuthState,
        error: errorMessage,
      };

      // Force a re-render with the error state
      rerender(<LoginPage />);

      // Wait for the error to be displayed
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check for error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("redirects to dashboard if already authenticated", async () => {
    // Set up initial authenticated state
    mockAuthState = {
      ...mockAuthState,
      user: { id: "1", name: "Test User", email: "test@example.com" },
      token: "test-token",
      isAuthenticated: true,
    };

    // Render the component
    const { rerender } = render(<LoginPage />);

    // Wait for the effect to run
    await act(async () => {
      // Force a re-render to trigger the effect
      mockAuthState = {
        ...mockAuthState,
        isAuthenticated: true,
      };

      // Force a re-render with the updated state
      rerender(<LoginPage />);

      // Small delay to allow the effect to run
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check if the redirect happened
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
