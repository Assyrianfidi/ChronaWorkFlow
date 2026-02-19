import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import AuditLoggerService from "../services/auditLogger.service.js";
import { AppError } from "../middleware/error.middleware.js";

/**
 * @desc    Export all user data (GDPR Article 20 — Right to Data Portability)
 * @route   GET /api/gdpr/export
 * @access  Private (authenticated user only)
 */
export const exportUserData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userContext = (req as any).user;
    if (!userContext?.id) {
      throw new AppError("Not authenticated", StatusCodes.UNAUTHORIZED);
    }

    const userId = userContext.id;
    const companyId = userContext.currentCompanyId;

    // Fetch all user-owned data within tenant boundaries
    const [
      userData,
      companyMemberships,
      sessions,
    ] = await Promise.all([
      prisma.users.findFirst({
        where: { id: userId, currentCompanyId: companyId ?? undefined },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          emailVerified: true,
          currentCompanyId: true,
        },
      }),
      prisma.company_members.findMany({
        where: { userId, companyId: companyId ?? undefined },
        include: {
          companies: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.user_sessions.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      format: "GDPR_DATA_EXPORT_V1",
      profile: userData ?? null,
      user: userData ?? null,
      companies: (companyMemberships || []).map((m: any) => ({
        id: m.companies.id,
        name: m.companies.name,
        joinedAt: m.createdAt,
        role: m.role,
      })),
      sessions: sessions || [],
    };

    logger.info("GDPR data export completed", {
      event: "GDPR_DATA_EXPORT",
      userId,
    });

    await AuditLoggerService.logAuthEvent({
      action: "GDPR_DATA_EXPORT",
      userId,
      email: userContext.email,
      ip: req.ip,
      userAgent: req.get?.("User-Agent") || "",
      success: true,
      details: { timestamp: new Date() },
      severity: "INFO",
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: exportBundle,
    });
  } catch (error: any) {
    logger.error("GDPR data export failed", {
      event: "GDPR_DATA_EXPORT_ERROR",
      userId: (req as any).user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

/**
 * @desc    Delete user account and anonymize data (GDPR Article 17 — Right to Erasure)
 * @route   DELETE /api/gdpr/delete-account
 * @access  Private (authenticated user only)
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      throw new AppError("Not authenticated", StatusCodes.UNAUTHORIZED);
    }

    // AUDIT FIX P0-4: GDPR Article 17 compliance - Full PII anonymization
    // Must anonymize or delete personal data within 30 days of request
    // Risk: €20M or 4% of revenue in GDPR fines for non-compliance
    await prisma.users.update({
      where: { id: user.id },
      data: {
        isActive: false,
        // ✅ Anonymize all PII fields
        email: `deleted_${user.id}@anonymized.local`,
        name: '[DELETED USER]',
        // Clear sensitive authentication data
        password: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        // Mark as anonymized with timestamp
        updatedAt: new Date(),
      },
    });

    logger.info("GDPR account deletion requested", {
      event: "GDPR_ACCOUNT_DELETION_REQUESTED",
      userId: user.id,
    });

    await AuditLoggerService.logAuthEvent({
      action: "GDPR_ACCOUNT_DELETE",
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get?.("User-Agent") || "",
      success: true,
      details: {
        originalEmail: "[REDACTED]",
        timestamp: new Date(),
      },
      severity: "WARNING",
    });

    // Clear auth cookies
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: { status: "success" },
    });
  } catch (error: any) {
    logger.error("GDPR account deletion failed", {
      event: "GDPR_ACCOUNT_DELETE_ERROR",
      userId: (req as any).user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};
