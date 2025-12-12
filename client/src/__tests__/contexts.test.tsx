
declare global {
  interface Window {
    [key: string]: any;
  }
}

// Mock localStorage - returns null by default for all keys
const localStorageMock = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: { href: vi.fn() },
  writable: true,
});

// Mock API modules
vi.mock("../api", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getProfile: vi.fn(),
  },
  accountsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  transactionsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from '../contexts/AuthContext.js';
import { AccountsProvider, useAccounts } from '../contexts/AccountsContext.js';
import {
  TransactionsProvider,
  useTransactions,
} from '../contexts/TransactionsContext.js';
import React from "react";
import { authApi, accountsApi, transactionsApi } from '../api.js';

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure localStorage returns null for all tokens
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "accessToken" || key === "refreshToken") {
        return null;
      }
      return null;
    });
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should login successfully", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "beginner" as const,
    };
    const mockResponse = {
      data: {
        data: {
          user: mockUser,
          accessToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.invalid",
          refreshToken: "refresh-token",
        },
      },
    };

    authApi.login.mockResolvedValue(mockResponse);

    const TestComponent = () => {
      const { state, login } = useAuth();

      const handleLogin = async () => {
        await login("test@example.com", "password");
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          <div data-testid="auth-state">
            {state.isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </div>
          <div data-testid="user-email">{state.user?.email || ""}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-state")).toHaveTextContent(
      "Not Authenticated",
    );

    userEvent.click(screen.getByText("Login"));

    await waitFor(
      () => {
        expect(screen.getByTestId("auth-state")).toHaveTextContent(
          "Authenticated",
        );
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          "test@example.com",
        );
      },
      { timeout: 3000 },
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "accessToken",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.invalid",
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
    );
  });

  it("should handle login failure", async () => {
    const mockError = new Error("Login failed");
    authApi.login.mockRejectedValue(mockError);

    const TestComponent = () => {
      const { state, login } = useAuth();

      const handleLogin = async () => {
        try {
          await login("test@example.com", "wrong-password");
        } catch (error) {
          // Error is handled in context
        }
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          <div data-testid="auth-state">
            {state.isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </div>
          <div data-testid="error-message">{state.error || ""}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    userEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Login failed",
      );
    });

    expect(screen.getByTestId("auth-state")).toHaveTextContent(
      "Not Authenticated",
    );
  });

  it("should logout successfully", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "beginner" as const,
    };
    const mockResponse = {
      data: {
        data: {
          user: mockUser,
          accessToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.invalid",
          refreshToken: "refresh-token",
        },
      },
    };

    authApi.login.mockResolvedValue(mockResponse);

    const TestComponent = () => {
      const { state, login, logout } = useAuth();

      const handleLogin = async () => {
        await login("test@example.com", "password");
      };

      const handleLogout = () => {
        logout();
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleLogout}>Logout</button>
          <div data-testid="auth-state">
            {state.isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Login first
    userEvent.click(screen.getByText("Login"));
    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "Authenticated",
      );
    });

    // Then logout
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "Not Authenticated",
      );
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("accessToken");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("refreshToken");
  });
});

describe("AccountsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch accounts", async () => {
    const mockAccounts = [
      { id: "1", code: "1000", name: "Cash", type: "ASSET" },
      { id: "2", code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    ];

    accountsApi.list.mockResolvedValue({
      data: { success: true, data: mockAccounts },
    });

    const TestComponent = () => {
      const { state, fetchAccounts } = useAccounts();

      const handleFetch = async () => {
        await fetchAccounts("company-1");
      };

      return (
        <div>
          <button onClick={handleFetch}>Fetch Accounts</button>
          <div data-testid="accounts-count">{state.accounts.length}</div>
          <div data-testid="loading">
            {state.isLoading ? "Loading" : "Not Loading"}
          </div>
        </div>
      );
    };

    render(
      <AccountsProvider>
        <TestComponent />
      </AccountsProvider>,
    );

    expect(screen.getByTestId("accounts-count")).toHaveTextContent("0");

    fireEvent.click(screen.getByText("Fetch Accounts"));

    await waitFor(() => {
      expect(screen.getByTestId("accounts-count")).toHaveTextContent("2");
    });

    expect(accountsApi.list).toHaveBeenCalledWith("company-1");
  });

  it("should create account", async () => {
    const mockAccount = { id: "1", code: "1000", name: "Cash", type: "ASSET" };

    accountsApi.create.mockResolvedValue({
      data: { success: true, data: mockAccount },
    });

    const TestComponent = () => {
      const { state, createAccount } = useAccounts();

      const handleCreate = async () => {
        await createAccount({
          companyId: "company-1",
          code: "1000",
          name: "Cash",
          type: "ASSET",
          balance: "0",
          isActive: true,
        });
      };

      return (
        <div>
          <button onClick={handleCreate}>Create Account</button>
          <div data-testid="accounts-count">{state.accounts.length}</div>
        </div>
      );
    };

    render(
      <AccountsProvider>
        <TestComponent />
      </AccountsProvider>,
    );

    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(screen.getByTestId("accounts-count")).toHaveTextContent("1");
    });

    expect(accountsApi.create).toHaveBeenCalled();
  });
});

describe("TransactionsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch transactions", async () => {
    const mockTransactions = [
      { id: "1", transactionNumber: "TXN001", totalAmount: "100.00" },
      { id: "2", transactionNumber: "TXN002", totalAmount: "200.00" },
    ];

    transactionsApi.list.mockResolvedValue({
      data: { success: true, data: mockTransactions },
    });

    const TestComponent = () => {
      const { state, fetchTransactions } = useTransactions();

      const handleFetch = async () => {
        await fetchTransactions("company-1");
      };

      return (
        <div>
          <button onClick={handleFetch}>Fetch Transactions</button>
          <div data-testid="transactions-count">
            {state.transactions.length}
          </div>
        </div>
      );
    };

    render(
      <TransactionsProvider>
        <TestComponent />
      </TransactionsProvider>,
    );

    expect(screen.getByTestId("transactions-count")).toHaveTextContent("0");

    fireEvent.click(screen.getByText("Fetch Transactions"));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-count")).toHaveTextContent("2");
    });

    expect(transactionsApi.list).toHaveBeenCalledWith("company-1");
  });

  it("should create transaction", async () => {
    const mockTransaction = {
      id: "1",
      transactionNumber: "TXN001",
      totalAmount: "100.00",
    };

    transactionsApi.create.mockResolvedValue({
      data: { success: true, data: mockTransaction },
    });

    const TestComponent = () => {
      const { state, createTransaction } = useTransactions();

      const handleCreate = async () => {
        await createTransaction({
          companyId: "company-1",
          transactionNumber: "TXN001",
          date: "2023-01-01",
          type: "journal_entry",
          totalAmount: "100.00",
          lines: [],
        });
      };

      return (
        <div>
          <button onClick={handleCreate}>Create Transaction</button>
          <div data-testid="transactions-count">
            {state.transactions.length}
          </div>
        </div>
      );
    };

    render(
      <TransactionsProvider>
        <TestComponent />
      </TransactionsProvider>,
    );

    fireEvent.click(screen.getByText("Create Transaction"));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-count")).toHaveTextContent("1");
    });

    expect(transactionsApi.create).toHaveBeenCalled();
  });
});
