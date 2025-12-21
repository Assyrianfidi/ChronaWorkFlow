import { act } from "@testing-library/react";
import { useAuthStore } from "../auth-store";

const fetchMock = jest.fn();

Object.defineProperty(global, "fetch", {
  value: fetchMock,
  writable: true,
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
    jest.clearAllMocks();
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

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      } as any);

      let authState: any;
      await act(async () => {
        authState = useAuthStore.getState();
        await authState.login("test@example.com", "password123");
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      // Check if state was updated correctly
      const { user, token, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(token).toBe(mockToken);
      expect(isAuthenticated).toBe(true);
    });

    it("should handle login error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

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
      expect(fetchMock).toHaveBeenCalled();

      // Check if error was set
      const { error: storeError, isAuthenticated } = useAuthStore.getState();
      expect(storeError).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(error).toBeInstanceOf(Error);
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
    });
  });
});
