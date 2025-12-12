import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";

type Credentials = { email: string; password: string };
type LoginPageAuthState = {
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (
    data: Partial<{ name: string; email: string }>,
  ) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
};

const mockLogin = vi.fn<Promise<void>, [Credentials]>();
const mockUseAuthStore =
  vi.fn<(selector?: (state: LoginPageAuthState) => any) => any>();

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("../store/auth-store", () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

import LoginPage from '../page.js';

let currentAuthState: LoginPageAuthState;
const createAuthState = (
  overrides: Partial<LoginPageAuthState> = {},
): LoginPageAuthState => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: (credentials) => mockLogin(credentials),
  register: vi.fn(async () => undefined),
  logout: vi.fn(async () => undefined),
  checkAuth: vi.fn(async () => undefined),
  clearError: vi.fn(),
  requestPasswordReset: vi.fn(async () => undefined),
  resetPassword: vi.fn(async () => undefined),
  updateProfile: vi.fn(async () => undefined),
  changePassword: vi.fn(async () => undefined),
  ...overrides,
});

const applyAuthState = (overrides: Partial<LoginPageAuthState>) => {
  currentAuthState = { ...currentAuthState, ...overrides };
  mockUseAuthStore.mockImplementation(
    (selector?: (state: LoginPageAuthState) => any) =>
      selector ? selector(currentAuthState) : currentAuthState,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  currentAuthState = createAuthState();
  applyAuthState({});
});

describe("LoginPage", () => {
  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
  };

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

    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
    });
  });

  it("shows loading state during form submission", async () => {
    let resolvePending: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePending = resolve;
    });
    mockLogin.mockImplementationOnce(() => pendingPromise);

    const { rerender } = render(<LoginPage />);
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    act(() => {
      applyAuthState({ isLoading: true });
      rerender(<LoginPage />);
    });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    act(() => {
      resolvePending!();
      applyAuthState({ isLoading: false });
      rerender(<LoginPage />);
    });
  });

  it("shows error message when login fails", async () => {
    const errorMessage = "Invalid credentials";
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    act(() => {
      applyAuthState({ error: errorMessage });
    });

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it("redirects to dashboard when auth state changes after login", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { rerender } = render(<LoginPage />);
    fillForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    act(() => {
      applyAuthState({ isAuthenticated: true });
      rerender(<LoginPage />);
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });
});
