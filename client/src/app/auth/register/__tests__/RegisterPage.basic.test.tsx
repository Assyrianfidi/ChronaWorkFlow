import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { vi } from "vitest";
import RegisterPage from "../page.js";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("RegisterPage - Basic Tests", () => {
  beforeEach(() => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);

    // Check that all form elements are rendered
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

  it("has required fields", () => {
    render(<RegisterPage />);

    // Check that all required fields are marked as required
    expect(screen.getByPlaceholderText("Full Name")).toHaveAttribute(
      "required",
    );
    expect(screen.getByPlaceholderText("Email address")).toHaveAttribute(
      "required",
    );
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("required");
    expect(screen.getByPlaceholderText("Confirm Password")).toHaveAttribute(
      "required",
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("required");
  });

  it("has proper input types", () => {
    render(<RegisterPage />);

    // Check input types
    expect(screen.getByPlaceholderText("Email address")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByPlaceholderText("Confirm Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("has proper autocomplete attributes", () => {
    render(<RegisterPage />);

    // Check autocomplete attributes
    expect(screen.getByPlaceholderText("Email address")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByPlaceholderText("Confirm Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("has links to the login page", () => {
    render(<RegisterPage />);

    // Get all login links
    const loginLinks = screen.getAllByRole("link", { name: /sign in/i });

    // There should be at least one login link
    expect(loginLinks.length).toBeGreaterThan(0);

    // All login links should point to /auth/login
    loginLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/auth/login");
    });
  });
});
