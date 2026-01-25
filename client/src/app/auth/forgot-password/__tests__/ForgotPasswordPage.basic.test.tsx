import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ForgotPasswordPage from '../page';
import { useAuthStore } from '../../store/auth-store';

const mockRequestPasswordReset = vi.fn();

vi.mock("../../store/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    requestPasswordReset: mockRequestPasswordReset,
  })),
}));

describe("ForgotPasswordPage - Basic Tests", () => {
  it("renders the forgot password form", async () => {
    render(<ForgotPasswordPage />);
    await waitFor(() => {
      expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText(/name@example\.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to sign in/i }),
    ).toHaveAttribute("href", "/auth/login");
  });

  it("has required email field with proper attributes", () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("required");
  });

  it("has a link back to the login page", () => {
    render(<ForgotPasswordPage />);

    const loginLink = screen.getByRole("link", { name: /back to sign in/i });
    expect(loginLink).toHaveAttribute("href", "/auth/login");
  });
});
