import { useAuthStore } from "@/store/auth-store";
import React from "react";

/**
 * Client-side token refresh utility
 * This handles automatic token refresh and session management
 */

// Check if token is about to expire (within 5 minutes)
export const isTokenExpiringSoon = (token: any): boolean => {
  if (!token?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = token.exp - now;

  return timeUntilExpiry < 300; // Less than 5 minutes
};

// Refresh the session manually
export const refreshSession = async (): Promise<boolean> => {
  try {
    const state = useAuthStore.getState();
    if (!state.user) {
      state.logout();
      return false;
    }

    // No-op refresh for the Vite client (no next-auth session available here).
    // Consider re-validating the token via an API endpoint if/when available.
    return true;
  } catch (error) {
    console.error("Failed to refresh session:", error);
    // On error, logout the user
    useAuthStore.getState().logout();
    return false;
  }
};

// Setup automatic token refresh
export const setupTokenRefresh = (): (() => void) => {
  const refreshInterval: NodeJS.Timeout = setInterval(
    async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      // If the token payload is JWT-like and contains exp, try to refresh/logout.
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        if (isTokenExpiringSoon(payload)) {
          await refreshSession();
        }
      } catch {
        // If parsing fails, do nothing.
      }
    },
    2 * 60 * 1000,
  );

  return () => {
    clearInterval(refreshInterval);
  };
};

// Hook for automatic token refresh in React components
export const useTokenRefresh = () => {
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const cleanup = setupTokenRefresh();

    return cleanup;
  }, [isAuthenticated]);
};
