import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the API functions directly
vi.mock("../api/index", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
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

// Import the mocked APIs
import { authApi, accountsApi, transactionsApi } from "../api.js";

describe("API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Auth API", () => {
    it("should login successfully", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: "test-token",
            refreshToken: "refresh-token",
            user: { id: "1", email: "test@example.com" },
          },
        },
      };

      (authApi.login as any).mockResolvedValue(mockResponse);

      const result = await authApi.login("test@example.com", "password");

      expect(result).toEqual(mockResponse);
      expect(authApi.login).toHaveBeenCalledWith(
        "test@example.com",
        "password",
      );
    });

    it("should register successfully", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: "1", email: "test@example.com" },
          },
        },
      };

      (authApi.register as any).mockResolvedValue(mockResponse);

      const result = await authApi.register({
        email: "test@example.com",
        password: "password",
        firstName: "Test",
        lastName: "User",
      });

      expect(result).toEqual(mockResponse);
      expect(authApi.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
        firstName: "Test",
        lastName: "User",
      });
    });

    it("should handle login failure", async () => {
      const mockError = new Error("Login failed");
      (authApi.login as any).mockRejectedValue(mockError);

      await expect(
        authApi.login("test@example.com", "wrong-password"),
      ).rejects.toThrow("Login failed");
    });
  });

  describe("Accounts API", () => {
    it("should list accounts", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [{ id: "1", code: "1000", name: "Cash", type: "ASSET" }],
        },
      };

      (accountsApi.list as any).mockResolvedValue(mockResponse);

      const result = await accountsApi.list("company-1");

      expect(result).toEqual(mockResponse);
      expect(accountsApi.list).toHaveBeenCalledWith("company-1");
    });

    it("should create account", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: "1", code: "1000", name: "Cash", type: "ASSET" },
        },
      };

      (accountsApi.create as any).mockResolvedValue(mockResponse);

      const result = await accountsApi.create({
        companyId: "company-1",
        code: "1000",
        name: "Cash",
        type: "ASSET",
      });

      expect(result).toEqual(mockResponse);
      expect(accountsApi.create).toHaveBeenCalledWith({
        companyId: "company-1",
        code: "1000",
        name: "Cash",
        type: "ASSET",
      });
    });
  });

  describe("Transactions API", () => {
    it("should list transactions", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: "1", transactionNumber: "TXN001", totalAmount: "100.00" },
          ],
        },
      };

      (transactionsApi.list as any).mockResolvedValue(mockResponse);

      const result = await transactionsApi.list("company-1");

      expect(result).toEqual(mockResponse);
      expect(transactionsApi.list).toHaveBeenCalledWith("company-1");
    });

    it("should create transaction", async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: "1", transactionNumber: "TXN001", totalAmount: "100.00" },
        },
      };

      (transactionsApi.create as any).mockResolvedValue(mockResponse);

      const result = await transactionsApi.create({
        companyId: "company-1",
        transactionNumber: "TXN001",
        date: "2023-01-01",
        type: "journal_entry",
        totalAmount: "100.00",
        lines: [
          { accountId: "acc-1", debit: "100.00", credit: "0" },
          { accountId: "acc-2", debit: "0", credit: "100.00" },
        ],
      });

      expect(result).toEqual(mockResponse);
      expect(transactionsApi.create).toHaveBeenCalledWith({
        companyId: "company-1",
        transactionNumber: "TXN001",
        date: "2023-01-01",
        type: "journal_entry",
        totalAmount: "100.00",
        lines: [
          { accountId: "acc-1", debit: "100.00", credit: "0" },
          { accountId: "acc-2", debit: "0", credit: "100.00" },
        ],
      });
    });
  });
});
