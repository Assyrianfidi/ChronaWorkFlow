import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (
    emailOrCredentials: string | { email: string; password: string },
    password?: string,
  ) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (input: { token: string; newPassword: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (
        emailOrCredentials: string | { email: string; password: string },
        password?: string,
      ) => {
        set({ isLoading: true, error: null });

        const credentials =
          typeof emailOrCredentials === "string"
            ? { email: emailOrCredentials, password: String(password ?? "") }
            : emailOrCredentials;

        try {
          // Replace with your actual API endpoint
          const response = await axios.post("/api/auth/login", {
            email: credentials.email,
            password: credentials.password,
          });

          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          let errorMessage = "Failed to log in. Please check your credentials.";

          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.message || errorMessage;
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (input: { name: string; email: string; password: string }) => {
        set({ isLoading: true, error: null });

        try {
          const response = await axios.post("/api/auth/register", input);
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          let errorMessage = "Failed to register. Please try again.";

          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.message || errorMessage;
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          await axios.post("/api/auth/forgot-password", { email });
          set({ isLoading: false });
        } catch (error) {
          let errorMessage = "Failed to request password reset.";

          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.message || errorMessage;
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (input: { token: string; newPassword: string }) => {
        set({ isLoading: true, error: null });

        try {
          await axios.post("/api/auth/reset-password", input);
          set({ isLoading: false });
        } catch (error) {
          let errorMessage = "Failed to reset password.";

          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.message || errorMessage;
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        // Clear auth state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

        // Clear persisted state
        localStorage.removeItem("auth-storage");
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
