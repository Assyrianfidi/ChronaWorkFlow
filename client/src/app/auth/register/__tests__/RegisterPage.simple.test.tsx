import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from '../page.js';

// Simple mock for useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Simple mock for useAuthStore
const mockRegister = vi.fn();
vi.mock("../store/auth-store", () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      register: mockRegister,
    };
    return selector ? selector(state) : state;
  },
}));

describe("RegisterPage - Simple Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);

    // Check that the form is rendered
    expect(
      screen.getByRole("heading", { name: /create a new account/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    // Mock a successful registration
    mockRegister.mockResolvedValueOnce({});

    render(<RegisterPage />);

    // Fill out the form
    const nameInput = screen.getByPlaceholderText("Full Name");
    const emailInput = screen.getByPlaceholderText("Email address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
      });
    });
  });

  it("shows loading state during submission", async () => {
    // Create a promise that we can resolve later
    let resolveRegister!: (value?: any) => void;
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve;
    });

    mockRegister.mockReturnValueOnce(registerPromise);

    render(<RegisterPage />);

    // Fill out the form
    const nameInput = screen.getByPlaceholderText("Full Name");
    const emailInput = screen.getByPlaceholderText("Email address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // Submit the form
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise
    resolveRegister({});

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("handles registration error", async () => {
    // Mock a failed registration
    const errorMessage = "Email already in use";
    mockRegister.mockRejectedValueOnce(new Error(errorMessage));

    render(<RegisterPage />);

    // Fill out the form
    const nameInput = screen.getByPlaceholderText("Full Name");
    const emailInput = screen.getByPlaceholderText("Email address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password123!" },
    });
    fireEvent.click(termsCheckbox);

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
      });
    });

    // Button should be re-enabled after error
    expect(submitButton).not.toBeDisabled();
  });
});
