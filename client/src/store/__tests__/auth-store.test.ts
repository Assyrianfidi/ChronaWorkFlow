import { act } from "@testing-library/react";
import { useAuthStore } from '../auth-store.js';
import api from '../lib/api.js';

// Mock the API
vi.mock("../lib/api", () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  };

  return {
    __esModule: true,
    default: mockApi,
    apiRequest: {
      get: mockApi.get,
      post: mockApi.post,
      put: mockApi.put,
    },
    getCurrentCompanyId: vi.fn(),
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset all mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();

    // Reset the store state
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });
  });

  describe("login", () => {
    it("should set user and token on successful login", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };
      const mockToken = "test-token";

      // Mock successful API response
      const mockApi = vi.mocked(api, true);
      mockApi.post.mockResolvedValueOnce({
        data: {
          data: {
            user: mockUser,
            token: mockToken,
          },
        },
      });

      let authState: any;
      await act(async () => {
        authState = useAuthStore.getState();
        await authState.login("test@example.com", "password123");
      });

      // Check if API was called with correct arguments
      expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "password123",
      });

      // Check if state was updated correctly
      const { user, token, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(token).toBe(mockToken);
      expect(isAuthenticated).toBe(true);
    });

    it("should handle login error", async () => {
      const errorMessage = "Invalid credentials";

      // Mock API error
      const mockApi = vi.mocked(api, true);
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      let authState: any;
      let error: any;

      await act(async () => {
        authState = useAuthStore.getState();
        try {
          await authState.login("wrong@example.com", "wrongpassword");
        } catch (err) {
          error = err;
        }
      });

      // Check if API was called
      expect(mockApi.post).toHaveBeenCalled();

      // Check if error was set
      const { error: storeError, isAuthenticated } = useAuthStore.getState();
      expect(storeError).toBe(errorMessage);
      expect(isAuthenticated).toBe(false);
      expect(error).toBeUndefined();
    });
  });

  describe("logout", () => {
    it("should clear user data and token", async () => {
      // Set initial state
      act(() => {
        useAuthStore.setState({
          user: { id: "1", name: "Test User", email: "test@example.com" },
          token: "test-token",
          isAuthenticated: true,
        });
      });

      // Mock API
      const mockApi = vi.mocked(api, true);

      // Call logout
      await act(async () => {
        const { logout } = useAuthStore.getState();
        logout();
      });

      // Check if state was cleared
      const { user, token, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(token).toBeNull();
      expect(isAuthenticated).toBe(false);

      // Check if token was removed from localStorage
      expect(localStorage.getItem("token")).toBeNull();

      // Check if auth header was removed
      expect(mockApi.defaults.headers.common["Authorization"]).toBeUndefined();
    });
  });

  describe("checkAuth", () => {
    it("should set user if token is valid", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };
      const mockToken = "test-token";

      // Set initial state with token
      act(() => {
        useAuthStore.setState({
          token: mockToken,
        });
      });

      // Mock successful API response
      const mockApi = vi.mocked(api, true);
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: {
            user: mockUser,
          },
        },
      });

      // Call checkAuth
      await act(async () => {
        const { checkAuth } = useAuthStore.getState();
        await checkAuth();
      });

      // Check if API was called with correct headers
      expect(mockApi.get).toHaveBeenCalledWith("/auth/me");

      // Check if state was updated
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it("should clear auth state if token is invalid", async () => {
      // Set initial state with token
      act(() => {
        useAuthStore.setState({
          token: "invalid-token",
          isAuthenticated: true,
          user: { id: "1", name: "Test User", email: "test@example.com" },
        });
      });

      // Mock failed API response
      const mockApi = vi.mocked(api, true);
      mockApi.get.mockRejectedValueOnce(new Error("Invalid token"));

      // Call checkAuth
      await act(async () => {
        const { checkAuth } = useAuthStore.getState();
        await checkAuth();
      });

      // Check if state was cleared
      const { user, token, isAuthenticated, error } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(token).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(error).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
