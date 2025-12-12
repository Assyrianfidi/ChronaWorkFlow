import * as React from "react";
import { create } from "zustand";
import { authApi } from "@/api";

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "INVENTORY_MANAGER";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

// Helper function to get permissions for a role
function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case "ADMIN":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:users",
        "write:users",
        "read:reports",
        "write:reports",
        "read:billing",
        "write:billing",
        "read:settings",
        "write:settings",
      ];
    case "MANAGER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:reports",
        "write:reports",
        "read:team",
        "write:team",
        "read:settings",
        "write:settings",
      ];
    case "ACCOUNTANT":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:reports",
        "write:reports",
        "read:transactions",
        "write:transactions",
      ];
    case "AUDITOR":
      return [
        "read:dashboard",
        "read:invoices",
        "read:reports",
        "read:audit",
        "read:compliance",
        "read:settings",
      ];
    case "INVENTORY_MANAGER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:inventory",
        "write:inventory",
        "read:reports",
        "write:reports",
        "read:settings",
        "write:settings",
      ];
    default:
      return [];
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await authApi.login(email, password);
      const { user, accessToken } = response.data.data;

      const role = (user?.role as UserRole) || "ACCOUNTANT";
      const name =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.email ||
        "User";

      const transformedUser: User = {
        id: String(user?.id ?? ""),
        name,
        email: String(user?.email ?? email),
        avatar: user?.avatar,
        role,
        permissions: getPermissionsForRole(role),
      };

      localStorage.setItem("accubooks_token", accessToken);
      localStorage.setItem("accubooks_user", JSON.stringify(transformedUser));

      set({
        user: transformedUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    set({ isLoading: true });

    try {
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: getPermissionsForRole(userData.role),
      };

      const token = "mock-jwt-token-" + Date.now();

      // Store token and user
      localStorage.setItem("accubooks_token", token);
      localStorage.setItem("accubooks_user", JSON.stringify(newUser));

      set({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
    } catch (error) {
    }

    set({
      user: null,
      isAuthenticated: false,
    });

    // Clear all stored data
    localStorage.removeItem("accubooks_token");
    localStorage.removeItem("accubooks_user");
    localStorage.removeItem("accubooks_remember");
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
      localStorage.setItem("accubooks_user", JSON.stringify(updatedUser));
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    return user?.permissions.includes(permission) || false;
  },

  hasRole: (role: UserRole | UserRole[]) => {
    const { user } = get();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  },
}));

// @ts-ignore
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  React.useEffect(() => {
    try {
      const token = localStorage.getItem("accubooks_token");
      const storedUser = localStorage.getItem("accubooks_user");

      if (token && storedUser) {
        // @ts-ignore
        const parsed = JSON.parse(storedUser) as User;

        const userWithPermissions: User = {
          ...parsed,
          permissions:
            parsed.permissions && parsed.permissions.length > 0
              ? parsed.permissions
              : getPermissionsForRole(parsed.role),
        };

        useAuth.setState({
          user: userWithPermissions,
          isAuthenticated: true,
          isLoading: false,
        });

        console.log(
          "[AuthProvider] init success for",
          userWithPermissions.email,
        );
      } else {
        useAuth.setState({ isLoading: false });
        console.log("[AuthProvider] no stored auth, marking not loading");
      }
    } catch (error) {
      console.error("[AuthProvider] init error", error);
      localStorage.removeItem("accubooks_token");
      localStorage.removeItem("accubooks_user");
      useAuth.setState({ isLoading: false });
    } finally {
// @ts-ignore
      // Safety guard: never leave isLoading stuck as true
      useAuth.setState({ isLoading: false });
      console.log("[AuthProvider] init final state", useAuth.getState());
    }
  }, []);

  return <>{children}</>;
};
