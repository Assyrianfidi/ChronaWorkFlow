import { render, screen } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { vi } from "vitest";
import ResetPasswordPage from "../page.js";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("ResetPasswordPage - Basic Tests", () => {
  it("renders invalid link state when no token is present", () => {
    const mockPush = vi.fn();
    const mockGet = vi.fn().mockReturnValue(null);
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
    (useSearchParams as any).mockReturnValue({
      get: mockGet,
      getAll: vi.fn(),
      has: vi.fn(),
      entries: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
    });

    render(<ResetPasswordPage />);

    expect(
      screen.getByRole("heading", { name: /invalid reset link/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the password reset link is invalid or has expired/i),
    ).toBeInTheDocument();
    const retryLink = screen.getByRole("link", {
      name: /request new reset link/i,
    });
    expect(retryLink).toHaveAttribute("href", "/auth/forgot-password");
  });
});
