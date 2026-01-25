import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./LoginPage";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    const state = {
      login: mockLogin,
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the login API call
vi.mock("@/api", () => ({
  post: vi.fn(() => Promise.resolve({ data: { token: "fake-token" } })),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  it("renders the login form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/password/i, { selector: "input" }),
    ).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: "input" }), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
