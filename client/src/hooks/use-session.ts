"use client";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export function useSession() {
  const status: SessionStatus = "unauthenticated";
  const session = null;

  return {
    session,
    status,
    isLoading: false,
    isAuthenticated: false,
    update: async () => session,
  };
}
