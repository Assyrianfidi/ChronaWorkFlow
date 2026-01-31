import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type Role =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "INVENTORY_MANAGER"
  | "EMPLOYEE";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role?: string;
  roles: Role[];
  currentCompanyId?: string;
};

function normalizeRole(role: unknown): Role {
  if (typeof role !== "string") return "EMPLOYEE";
  const r = role.trim().toLowerCase();
  if (r === "owner") return "OWNER";
  if (r === "admin") return "ADMIN";
  if (r === "manager") return "MANAGER";
  if (r === "accountant") return "ACCOUNTANT";
  if (r === "auditor") return "AUDITOR";
  if (r === "inventory_manager" || r === "inventory-manager" || r === "inventory") {
    return "INVENTORY_MANAGER";
  }
  if (r === "employee") return "EMPLOYEE";
  if (r === "user") return "ACCOUNTANT";
  return "EMPLOYEE";
}

function isOwnerEmail(email?: string | null) {
  const owner = process.env.OWNER_EMAIL?.toLowerCase();
  if (!owner) return false;
  if (!email) return false;
  return email.toLowerCase() === owner;
}

const PUBLIC_PATHS = new Set<string>([
  "/api/auth/register",
  "/api/auth/login",
  "/api/health",
  "/api/webhooks/stripe",
  "/api/stripe/webhooks",
  "/api/plaid/webhooks",
  "/api/stripe/health",
  "/api/plaid/health",
]);

function fullPath(req: Request): string {
  const baseUrl = typeof (req as any).baseUrl === "string" ? (req as any).baseUrl : "";
  const path = typeof (req as any).path === "string" ? (req as any).path : "";
  if (baseUrl || path) return `${baseUrl}${path}`;
  return String((req as any).originalUrl ?? req.url ?? "");
}

export function authenticate() {
  const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET or SESSION_SECRET must be set in environment variables');
  }

  return function authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
    if (PUBLIC_PATHS.has(fullPath(req))) {
      return next();
    }

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const data = (payload ?? {}) as any;
      const id = String(data.id ?? "");
      const email = typeof data.email === "string" ? data.email : undefined;
      const currentCompanyId = typeof data.currentCompanyId === "string" ? data.currentCompanyId : undefined;
      const baseRole = normalizeRole(data.role);
      const roles = new Set<Role>();
      roles.add(baseRole);
      if (baseRole === "OWNER" || isOwnerEmail(email)) {
        roles.add("OWNER");
      }

      req.user = {
        ...(data as any),
        id,
        email,
        role: typeof data.role === "string" ? data.role : undefined,
        roles: Array.from(roles),
        currentCompanyId,
      } as any;

      return next();
    });
  };
}
