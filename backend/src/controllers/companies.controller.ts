import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";
import { MemberRole, Role } from "@prisma/client";
import crypto from "crypto";

export const getCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Not authenticated");
    }

    const companies = await prisma.companies.findMany({
      where: {
        company_members: {
          some: {
            userId: user.id,
            isActive: true,
          },
        },
        isActive: true,
      },
      include: {
        company_members: {
          where: {
            userId: user.id,
            isActive: true,
          },
          select: {
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      results: companies.length,
      data: {
        companies,
      },
    });
  } catch (error: any) {
    logger.error("Failed to retrieve companies", {
      event: "COMPANIES_RETRIEVAL_ERROR",
      userId: (req as any).user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const getCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Not authenticated");
    }

    const { id } = req.params;

    const company = await prisma.companies.findFirst({
      where: {
        id,
        company_members: {
          some: {
            userId: user.id,
            isActive: true,
          },
        },
        isActive: true,
      },
    });

    if (!company) {
      throw new ApiError(404, "Company not found or access denied");
    }

    res.status(200).json({
      status: "success",
      data: {
        company,
      },
    });
  } catch (error: any) {
    logger.error("Failed to retrieve company", {
      event: "COMPANY_RETRIEVAL_ERROR",
      userId: (req as any).user?.id,
      companyId: req.params.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Not authenticated");
    }

    const { name } = req.body;

    if (!name) {
      throw new ApiError(400, "Company name is required");
    }

    const company = await prisma.$transaction(async (tx: any) => {
      const newCompany = await tx.companies.create({
        data: {
          id: crypto.randomUUID(),
          name,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      await tx.company_members.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          companyId: newCompany.id,
          role: MemberRole.OWNER,
          isActive: true,
        },
      });

      return newCompany;
    });

    res.status(201).json({
      status: "success",
      data: {
        company,
      },
    });
  } catch (error: any) {
    logger.error("Failed to create company", {
      event: "COMPANY_CREATION_ERROR",
      userId: (req as any).user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Not authenticated");
    }

    const { id } = req.params;
    const { name } = req.body;

    // Verify ownership/admin role in company or global admin
    const membership = await prisma.company_members.findFirst({
      where: {
        companyId: id,
        userId: user.id,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
        isActive: true,
      },
    });

    if (!membership && user.role !== Role.ADMIN) {
      throw new ApiError(403, "Access denied");
    }

    const company = await prisma.companies.update({
      where: { id },
      data: {
        name,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        company,
      },
    });
  } catch (error: any) {
    logger.error("Failed to update company", {
      event: "COMPANY_UPDATE_ERROR",
      userId: (req as any).user?.id,
      companyId: req.params.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new ApiError(401, "Not authenticated");
    }

    const { id } = req.params;

    // Only OWNER or global ADMIN can soft-delete company
    const membership = await prisma.company_members.findFirst({
      where: {
        companyId: id,
        userId: user.id,
        role: MemberRole.OWNER,
        isActive: true,
      },
    });

    if (!membership && user.role !== Role.ADMIN) {
      throw new ApiError(403, "Access denied. Only company owner or admin can delete.");
    }

    await prisma.companies.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

    res.status(204).send();
  } catch (error: any) {
    logger.error("Failed to delete company", {
      event: "COMPANY_DELETION_ERROR",
      userId: (req as any).user?.id,
      companyId: req.params.id,
      error: (error as Error).message,
    });
    next(error);
  }
};
