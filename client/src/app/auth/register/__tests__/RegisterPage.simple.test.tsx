import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from '../page';

// Simple mock for useRouter
const mockPush = vi.fn();
let authState = {
  isAuthenticated: false,
  isLoading: false,
};
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Simple mock for useAuthStore
const useAuthStoreMock = vi.hoisted(() => vi.fn());
vi.mock("../../store/auth-store", () => ({
  useAuthStore: useAuthStoreMock,
}));

describe("RegisterPage - Simple Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    authState = {
      isAuthenticated: false,
      isLoading: false,
    };

    useAuthStoreMock.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        user: null,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        error: null,
      };
      return selector ? selector(state) : state;
    });
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

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/signin");
    });
  });

  it("shows loading state during submission", async () => {
    useAuthStoreMock.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };
      return selector ? selector(state) : state;
    });

    render(<RegisterPage />);

    const submitButton = screen.getByRole("button", {
      name: /creating\.\.\./i,
    });
    expect(submitButton).toBeDisabled();

    expect(screen.getByPlaceholderText("Full Name")).toBeDisabled();
    expect(screen.getByPlaceholderText("Email address")).toBeDisabled();
    expect(screen.getByPlaceholderText("Password")).toBeDisabled();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("handles registration error", async () => {
    const errorMessage = "Email already in use";
    mockPush.mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

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

    expect(await screen.findByRole("alert")).toHaveTextContent(errorMessage);

    // Button should be re-enabled after error
    expect(submitButton).not.toBeDisabled();
  });
});
