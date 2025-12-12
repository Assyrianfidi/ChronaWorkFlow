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
  login: (email: string, password: string) => Promise<void>;
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

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Replace with your actual API endpoint
          const response = await axios.post("/api/auth/login", {
            email,
            password,
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
