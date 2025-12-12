import { getSession, signOut } from "next-auth/react";
import { useAuthStore } from '../store/auth-store.js';
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
    // Trigger a session refresh by calling getSession
    const session = await getSession();

    if (!session) {
      // No session means we need to logout
      await signOut({ redirect: false });
      return false;
    }

    // Update the auth store with the refreshed session
    const { setUser, setSession } = useAuthStore.getState();
// @ts-ignore
// @ts-ignore
    setUser(session.user as any);
    setSession(session);

    return true;
  } catch (error) {
    console.error("Failed to refresh session:", error);
    // On error, logout the user
    await signOut({ redirect: false });
    return false;
  }
};

// Setup automatic token refresh
export const setupTokenRefresh = (): (() => void) => {
  const refreshInterval: NodeJS.Timeout = setInterval(
    async () => {
      const session = await getSession();

      if (session && isTokenExpiringSoon(session)) {
        await refreshSession();
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
