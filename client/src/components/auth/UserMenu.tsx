"use client";

import Button from "../ui/button";
import { useAuthStore } from "@/store/auth-store";

export function UserMenu() {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="ghost"
        onClick={() => (window.location.href = "/auth/signin")}
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{user.name}</span>
      <Button variant="ghost" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}
