import * as React from "react";
import { create } from "zustand";
import { authApi } from "@/api";
import { useNavigate } from "react-router-dom";

const STORAGE_KEYS = {
  token: "chronaworkflow_token",
  user: "chronaworkflow_user",
  demo: "chronaworkflow_demo",
  companyId: "chronaworkflow_company_id",
} as const;

const DEMO_COMPANY_ID = "demo-company";

const DEMO_USERS: Array<{
  email: string;
  password: string;
  role: UserRole;
  name: string;
}> = [];

function storageAvailable() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function persistAuth(user: User, token: string) {
  if (!storageAvailable()) return;
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem("token", token);
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
}

function clearAuthStorage() {
  if (!storageAvailable()) return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.companyId);
  localStorage.removeItem("token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("chronaworkflow_remember");
}

export type UserRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "INVENTORY_MANAGER"
  | "EMPLOYEE"
  | "CUSTOMER"
  | "USER";

function normalizeRole(role: unknown): UserRole {
  if (typeof role !== "string") return "CUSTOMER";

  const normalized = role.trim().toUpperCase();

  if (normalized === "OWNER") return "OWNER";
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "MANAGER") return "MANAGER";
  if (normalized === "ACCOUNTANT") return "ACCOUNTANT";
  if (normalized === "AUDITOR") return "AUDITOR";
  if (normalized === "INVENTORY_MANAGER") return "INVENTORY_MANAGER";
  if (normalized === "EMPLOYEE") return "EMPLOYEE";
  if (normalized === "CUSTOMER") return "CUSTOMER";
  if (normalized === "USER") return "USER";

  return "CUSTOMER";
}

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
    role?: UserRole;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

// Helper function to get permissions for a role
function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case "OWNER":
      return [
        "read:*",
        "write:*",
        "owner:access",
        "owner:impersonate",
        "owner:feature-flags",
        "owner:billing",
        "owner:security",
        "owner:audit",
      ];
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
    case "EMPLOYEE":
      return [
        "read:dashboard",
        "read:reports",
      ];
    case "CUSTOMER":
      return [
        "read:dashboard",
        "read:profile",
        "write:profile",
        "read:invoices",
        "read:billing",
      ];
    case "USER":
      return [
        "read:dashboard",
        "read:profile",
      ];
    default:
      return [];
  }
}

export const useAuth = create<AuthState>((set, get) => {
  const token = storageAvailable()
    ? localStorage.getItem(STORAGE_KEYS.token)
    : null;
  const rawUser = storageAvailable()
    ? localStorage.getItem(STORAGE_KEYS.user)
    : null;
  const hydratedUser = rawUser ? (JSON.parse(rawUser) as User) : null;

  return {
    user: hydratedUser,
    isAuthenticated: Boolean(token && hydratedUser),
    isLoading: false,

    login: async (email: string, password: string) => {
      set({ isLoading: true });

      try {
        const response = await authApi.login(email, password);
        const payload = response?.data as any;
        const user = payload?.user ?? payload?.data?.user ?? payload;
        const accessToken = payload?.token ?? payload?.accessToken ?? payload?.data?.token;

        const role = normalizeRole(user?.role);
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

        persistAuth(transformedUser, String(accessToken || ""));
        set({ user: transformedUser, isAuthenticated: true, isLoading: false });

        // Role-based redirect handled by LoginPage
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    register: async (userData: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
    }) => {
      set({ isLoading: true });

      try {
        const names = userData.name.trim().split(/\s+/);
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";
        const response = await authApi.register({
          email: userData.email,
          password: userData.password,
          firstName,
          lastName,
        });
        const payload = response?.data as any;
        const user = payload?.user ?? payload?.data?.user ?? payload;
        const accessToken = payload?.token ?? payload?.accessToken ?? payload?.data?.token;

        const role = normalizeRole(user?.role);
        const name =
          user?.name ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.email ||
          "User";

        const transformedUser: User = {
          id: String(user?.id ?? ""),
          name,
          email: String(user?.email ?? userData.email),
          avatar: user?.avatar,
          role,
          permissions: getPermissionsForRole(role),
        };

        persistAuth(transformedUser, String(accessToken || ""));
        set({ user: transformedUser, isAuthenticated: true, isLoading: false });

        // Redirect handled by RegisterPage
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set({ user: null, isAuthenticated: false });
        clearAuthStorage();
      }
    },

    updateUser: (userData: Partial<User>) => {
      const currentUser = get().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        set({ user: updatedUser });
        localStorage.setItem("chronaworkflow_user", JSON.stringify(updatedUser));
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
  };
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

const AuthContext = React.createContext<AuthState | null>(null);

export const useAuthContext = () => React.useContext(AuthContext);
