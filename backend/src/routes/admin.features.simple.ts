import express from "express";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

export type FeatureKey =
  | "DASHBOARD"
  | "INVOICES"
  | "REPORTS"
  | "CUSTOMERS"
  | "EXPORT_TOOLS"
  | "TRANSACTIONS"
  | "SETTINGS";

export const FEATURE_CATALOG: Array<{
  name: FeatureKey;
  label: string;
  description: string;
}> = [
  {
    name: "DASHBOARD",
    label: "Dashboard",
    description: "Core dashboard and overview analytics.",
  },
  {
    name: "INVOICES",
    label: "Invoices",
    description: "Create, manage, and send invoices.",
  },
  {
    name: "REPORTS",
    label: "Reports",
    description: "Financial and operational reporting.",
  },
  {
    name: "CUSTOMERS",
    label: "Customer Management",
    description: "Manage customers, contacts, and CRM-like data.",
  },
  {
    name: "EXPORT_TOOLS",
    label: "Export Tools",
    description: "Export data to CSV/PDF/Excel and integrations.",
  },
  {
    name: "TRANSACTIONS",
    label: "Transactions",
    description: "View and manage transactions and reconciliations.",
  },
  {
    name: "SETTINGS",
    label: "Settings",
    description: "Application settings and configuration.",
  },
];

type RoleKey = "ADMIN" | "MANAGER" | "USER" | "AUDITOR" | "INVENTORY_MANAGER";

const MOCK_USERS: Array<{ id: string; name: string; email: string; role: RoleKey }> = [
  { id: "1", name: "Admin User", email: "admin@accubooks.com", role: "ADMIN" },
  { id: "2", name: "Manager User", email: "manager@accubooks.com", role: "MANAGER" },
  { id: "3", name: "Regular User", email: "user@accubooks.com", role: "USER" },
  { id: "4", name: "Auditor User", email: "auditor@accubooks.com", role: "AUDITOR" },
  {
    id: "5",
    name: "Inventory Manager",
    email: "inventory@accubooks.com",
    role: "INVENTORY_MANAGER",
  },
];

// In-memory store for dev server-simple mode.
// Key: userId -> featureName -> enabled
const userOverrides: Record<string, Record<FeatureKey, boolean>> = {};

const handleValidationErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
  }
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers["x-user-role"];

  if (!authHeader || !authHeader.toString().startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing Bearer token" });
  }

  if (roleHeader !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  next();
};

const normalizeAssignments = (userId: string): Record<FeatureKey, boolean> => {
  const overrides = userOverrides[userId] || {};
  const out: Record<FeatureKey, boolean> = {} as any;

  for (const f of FEATURE_CATALOG) {
    out[f.name] = overrides[f.name] ?? true;
  }

  return out;
};

router.get("/features", requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      features: FEATURE_CATALOG,
      users: MOCK_USERS,
      assignments: Object.fromEntries(MOCK_USERS.map((u) => [u.id, normalizeAssignments(u.id)])),
    },
  });
});

router.patch(
  "/features/:userId",
  requireAdmin,
  [
    param("userId").notEmpty().withMessage("userId is required"),
    body("overrides").isObject().withMessage("overrides must be an object"),
  ],
  handleValidationErrors,
  (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    const { overrides } = req.body as { overrides: Record<string, boolean> };

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const allowed = new Set(FEATURE_CATALOG.map((f) => f.name));
    for (const key of Object.keys(overrides)) {
      if (!allowed.has(key as FeatureKey)) {
        return res.status(400).json({ success: false, message: `Invalid feature name: ${key}` });
      }
      if (typeof overrides[key] !== "boolean") {
        return res.status(400).json({ success: false, message: `Invalid enabled value for: ${key}` });
      }
    }

    userOverrides[userId] = {
      ...(userOverrides[userId] || {}),
      ...(overrides as Partial<Record<FeatureKey, boolean>>),
    } as Record<FeatureKey, boolean>;

    res.json({
      success: true,
      data: {
        userId,
        assignments: normalizeAssignments(userId),
      },
    });
  },
);

export default router;
