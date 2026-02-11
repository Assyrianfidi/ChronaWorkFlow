import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  requireAdmin,
  getKPIs,
  getRevenueAnalytics,
  getAdminUsers,
  performUserAction,
  getAuditLogs,
  performEmergencyAction,
  getSystemStatus,
} from "../controllers/admin.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analytics endpoints (require admin/owner)
router.get("/analytics/kpis", requireAdmin, getKPIs);
router.get("/analytics/revenue", requireAdmin, getRevenueAnalytics);

// Admin user management (require admin/owner)
router.get("/admin/users", requireAdmin, getAdminUsers);
router.post("/admin/users/:id/:action", requireAdmin, performUserAction);

// Audit logs (require admin/owner)
router.get("/admin/audit-logs", requireAdmin, getAuditLogs);

// Emergency controls (require owner only - checked in controller)
router.post("/admin/emergency/:action", requireAdmin, performEmergencyAction);

// System status (require admin/owner)
router.get("/admin/system/status", requireAdmin, getSystemStatus);

export default router;
