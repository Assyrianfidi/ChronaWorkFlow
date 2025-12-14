import { useAuth as useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { user, isLoading, isAuthenticated, login, logout, register } =
    useAuthContext();

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    session: user ? { user } : null,
    status: isLoading
      ? "loading"
      : isAuthenticated
        ? "authenticated"
        : "unauthenticated",
  };
}
