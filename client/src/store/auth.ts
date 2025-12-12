import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest } from '../lib/api.js';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await apiRequest.post<LoginResponse>(
            "/auth/login",
            { email, password },
          );

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token in localStorage for persistence
          localStorage.setItem("token", token);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("token");

        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return;
        }

        try {
          set({ isLoading: true });
          // Set the token in the API client
          const user = await apiRequest.get<User>("/auth/me");

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
