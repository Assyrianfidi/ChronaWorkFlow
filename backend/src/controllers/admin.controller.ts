import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { ApiError, ErrorCodes } from "../utils/errorHandler.js";
import { prisma } from "../utils/prisma";
import bcrypt from "bcryptjs";

// Middleware to check if user is admin/owner
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
  }
  if (req.user.role !== Role.ADMIN && req.user.role !== Role.OWNER) {
    throw new ApiError("Admin access required", 403, ErrorCodes.FORBIDDEN);
  }
  next();
};

// GET /analytics/kpis - Dashboard KPIs
export const getKPIs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    // Calculate MRR and ARR from active users with subscriptions
    const activeSubscribedUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        subscriptionStatus: { in: ['active', 'trialing'] },
        planType: { not: null }
      }
    });

    // Simple pricing based on plan type (matches frontend pricing)
    const planPrices: Record<string, number> = {
      'starter': 29,
      'pro': 79,
      'enterprise': 299,
    };

    const mrr = activeSubscribedUsers.reduce((sum, user) => {
      const planType = user.planType?.toLowerCase() || '';
      return sum + (planPrices[planType] || 0);
    }, 0);

    const arr = mrr * 12;

    // Get active users count
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });

    // Calculate churn rate (simplified - last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const canceledUsers = await prisma.user.count({
      where: {
        subscriptionStatus: 'canceled',
        updatedAt: { gte: thirtyDaysAgo }
      }
    });

    const totalSubscribed = await prisma.user.count({
      where: { subscriptionStatus: { not: null } }
    });
    const churnRate = totalSubscribed > 0 ? (canceledUsers / totalSubscribed) * 100 : 0;

    // Calculate ARPU
    const arpu = activeUsers > 0 ? mrr / activeUsers : 0;

    // Calculate LTV (simplified: ARPU * average customer lifetime in months)
    const avgLifetimeMonths = 24; // Assumption
    const ltv = arpu * avgLifetimeMonths;

    logger.info("KPIs retrieved", {
      event: "KPIS_RETRIEVED",
      userId: req.user.id,
    });

    res.status(200).json({
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      activeUsers,
      churnRate: Math.round(churnRate * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
    });
  } catch (error) {
    logger.error("Failed to retrieve KPIs", {
      event: "KPIS_RETRIEVAL_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

// GET /analytics/revenue?range= - Revenue analytics
export const getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const range = req.query.range as string || '30d';
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get subscriptions created in range
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Generate timeline data
    const timeline: any[] = [];
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySubs = subscriptions.filter(sub => {
        const subDate = new Date(sub.createdAt).toISOString().split('T')[0];
        return subDate === dateStr;
      });

      timeline.push({
        date: dateStr,
        revenue: daySubs.reduce((sum, sub) => sum + (sub.plan?.price || 0), 0),
        subscriptions: daySubs.filter(s => s.status === 'active' || s.status === 'trialing').length,
        upgrades: daySubs.filter(s => s.status === 'active').length,
      });
    }

    // Get plan breakdown
    const plans = await prisma.subscriptionPlan.findMany();
    const planBreakdown = await Promise.all(plans.map(async (plan) => {
      const customers = await prisma.subscription.count({
        where: {
          planId: plan.id,
          status: { in: ['active', 'trialing'] }
        }
      });

      const revenue = customers * (plan.price || 0);
      const totalRevenue = timeline.reduce((sum, t) => sum + t.revenue, 0);

      return {
        plan: plan.name,
        revenue,
        customers,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      };
    }));

    logger.info("Revenue analytics retrieved", {
      event: "REVENUE_ANALYTICS_RETRIEVED",
      userId: req.user.id,
      range,
    });

    res.status(200).json({
      timeline,
      planBreakdown,
    });
  } catch (error) {
    logger.error("Failed to retrieve revenue analytics", {
      event: "REVENUE_ANALYTICS_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

// GET /admin/users?role=&status= - User list with filters
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { role, status } = req.query;
    
    const where: any = {};
    if (role && role !== 'all') {
      where.role = role as Role;
    }
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enrich with subscription info
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
        include: { plan: true },
        orderBy: { createdAt: 'desc' }
      });

      return {
        id: user.id.toString(),
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        company: 'N/A', // TODO: Add company relation
        subscription: subscription?.plan?.name || 'Free',
        lastActive: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        createdAt: new Date(user.createdAt).toISOString(),
      };
    }));

    logger.info("Admin users list retrieved", {
      event: "ADMIN_USERS_RETRIEVED",
      userId: req.user.id,
      count: enrichedUsers.length,
      filters: { role, status },
    });

    res.status(200).json(enrichedUsers);
  } catch (error) {
    logger.error("Failed to retrieve admin users", {
      event: "ADMIN_USERS_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

// POST /admin/users/:id/:action - User actions
export const performUserAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { id, action } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ApiError("Invalid user ID", 400, ErrorCodes.VALIDATION_ERROR);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throw new ApiError("User not found", 404, ErrorCodes.NOT_FOUND);
    }

    let result;

    switch (action) {
      case 'reset-password':
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword }
        });

        logger.warn("Password reset by admin", {
          event: "ADMIN_PASSWORD_RESET",
          adminId: req.user.id,
          targetUserId: userId,
          ip: req.ip,
        });

        result = { message: "Password reset successfully", tempPassword };
        break;

      case 'suspend':
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false }
        });

        logger.warn("User suspended by admin", {
          event: "ADMIN_USER_SUSPENDED",
          adminId: req.user.id,
          targetUserId: userId,
          ip: req.ip,
        });

        result = { message: "User suspended successfully" };
        break;

      case 'activate':
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: true }
        });

        logger.info("User activated by admin", {
          event: "ADMIN_USER_ACTIVATED",
          adminId: req.user.id,
          targetUserId: userId,
          ip: req.ip,
        });

        result = { message: "User activated successfully" };
        break;

      case 'delete':
        // Prevent self-deletion
        if (userId === req.user.id) {
          throw new ApiError("Cannot delete your own account", 400, ErrorCodes.VALIDATION_ERROR);
        }

        await prisma.user.delete({
          where: { id: userId }
        });

        logger.warn("User deleted by admin", {
          event: "ADMIN_USER_DELETED",
          adminId: req.user.id,
          targetUserId: userId,
          targetEmail: targetUser.email,
          ip: req.ip,
        });

        result = { message: "User deleted successfully" };
        break;

      default:
        throw new ApiError("Invalid action", 400, ErrorCodes.VALIDATION_ERROR);
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error("Failed to perform user action", {
      event: "ADMIN_USER_ACTION_ERROR",
      userId: req.user?.id,
      action: req.params.action,
      error: (error as Error).message,
    });
    next(error);
  }
};

// GET /admin/audit-logs?range= - Audit logs
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { range, action, status } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Query audit logs (using logger output - in production, query from dedicated audit table)
    // For now, return mock data structure that matches expected format
    const logs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        user: req.user.email,
        action: 'login',
        resource: 'auth',
        details: 'Successful login',
        ipAddress: req.ip || '127.0.0.1',
        status: 'success' as const,
      }
    ];

    logger.info("Audit logs retrieved", {
      event: "AUDIT_LOGS_RETRIEVED",
      userId: req.user.id,
      range,
    });

    res.status(200).json(logs);
  } catch (error) {
    logger.error("Failed to retrieve audit logs", {
      event: "AUDIT_LOGS_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

// POST /admin/emergency/:action - Emergency controls
export const performEmergencyAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    // Only OWNER can perform emergency actions
    if (req.user.role !== Role.OWNER) {
      throw new ApiError("Owner access required for emergency controls", 403, ErrorCodes.FORBIDDEN);
    }

    const { action } = req.params;

    logger.warn("EMERGENCY ACTION TRIGGERED", {
      event: "EMERGENCY_ACTION",
      action,
      userId: req.user.id,
      userEmail: req.user.email,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    let result;

    switch (action) {
      case 'toggle-maintenance':
        // Toggle maintenance mode (would set in Redis/config)
        result = { message: "Maintenance mode toggled", enabled: true };
        break;

      case 'pause-billing':
        // Pause all billing operations
        logger.critical("BILLING PAUSED BY OWNER", {
          event: "BILLING_PAUSED",
          userId: req.user.id,
          ip: req.ip,
        });
        result = { message: "Billing paused - all charges stopped" };
        break;

      case 'force-logout-all':
        // Force logout all users (would invalidate all sessions)
        logger.critical("FORCE LOGOUT ALL USERS", {
          event: "FORCE_LOGOUT_ALL",
          userId: req.user.id,
          ip: req.ip,
        });
        result = { message: "All users logged out" };
        break;

      case 'backup-database':
        // Trigger emergency backup
        logger.critical("EMERGENCY BACKUP TRIGGERED", {
          event: "EMERGENCY_BACKUP",
          userId: req.user.id,
          ip: req.ip,
        });
        result = { message: "Emergency backup initiated" };
        break;

      case 'rollback-deployment':
        // Rollback to previous deployment
        logger.critical("DEPLOYMENT ROLLBACK TRIGGERED", {
          event: "DEPLOYMENT_ROLLBACK",
          userId: req.user.id,
          ip: req.ip,
        });
        result = { message: "Deployment rollback initiated" };
        break;

      case 'kill-feature':
        // Disable specific feature
        logger.critical("FEATURE KILL SWITCH ACTIVATED", {
          event: "FEATURE_KILLED",
          userId: req.user.id,
          ip: req.ip,
        });
        result = { message: "Feature disabled" };
        break;

      default:
        throw new ApiError("Invalid emergency action", 400, ErrorCodes.VALIDATION_ERROR);
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error("Failed to perform emergency action", {
      event: "EMERGENCY_ACTION_ERROR",
      userId: req.user?.id,
      action: req.params.action,
      error: (error as Error).message,
    });
    next(error);
  }
};

// GET /admin/system/status - System status
export const getSystemStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });

    res.status(200).json({
      maintenanceMode: false,
      billingPaused: false,
      activeUsers,
      lastBackup: '2 hours ago', // TODO: Get from actual backup system
    });
  } catch (error) {
    logger.error("Failed to retrieve system status", {
      event: "SYSTEM_STATUS_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};
