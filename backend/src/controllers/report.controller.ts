import { Request, Response, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { ApiError, ErrorCodes } from "../utils/errorHandler.js";

const prisma = prisma;

export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query: any = {};
    if (queryStr !== "{}") {
      query = { where: JSON.parse(queryStr) };
    }

    // 3) If user is not admin, only show their reports
    if (req.user.role !== Role.ADMIN) {
      query.where = { ...query.where, userId: req.user.id };
    }

    // 4) Execute query
    const reports = await prisma.reconciliationReport.findMany({
      ...query,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    logger.info("Reports retrieved", {
      event: "REPORTS_RETRIEVED",
      userId: req.user.id,
      count: reports.length,
      isAdmin: req.user.role === Role.ADMIN,
    });

    res.status(200).json({
      status: "success",
      results: reports.length,
      data: {
        reports,
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve reports", {
      event: "REPORTS_RETRIEVAL_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const getReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { id } = req.params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      throw new ApiError("Invalid report ID", 400, ErrorCodes.VALIDATION_ERROR);
    }

    const report = await prisma.reconciliationReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new ApiError("Report not found", 404, ErrorCodes.NOT_FOUND);
    }

    // Check if user owns the report or is admin
    if (report.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ApiError("Access denied", 403, ErrorCodes.FORBIDDEN);
    }

    logger.info("Report retrieved", {
      event: "REPORT_RETRIEVED",
      userId: req.user.id,
      reportId: report.id,
      isOwner: report.userId === req.user.id,
    });

    res.status(200).json({
      status: "success",
      data: {
        report,
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve report", {
      event: "REPORT_RETRIEVAL_ERROR",
      userId: req.user?.id,
      reportId: req.params.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { title, amount } = req.body;

    // Basic validation
    if (!title || amount === undefined) {
      throw new ApiError(
        "Missing required fields",
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const report = await prisma.reconciliationReport.create({
      data: {
        title,
        amount: parseFloat(amount),
        userId: req.user.id,
      },
    });

    logger.info("Report created", {
      event: "REPORT_CREATED",
      userId: req.user.id,
      reportId: report.id,
      title: report.title,
      amount: report.amount,
    });

    res.status(201).json({
      status: "success",
      data: {
        report,
      },
    });
  } catch (error) {
    logger.error("Failed to create report", {
      event: "REPORT_CREATION_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const updateReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { id } = req.params;
    const reportId = parseInt(id);
    const { title, amount } = req.body;

    if (isNaN(reportId)) {
      throw new ApiError("Invalid report ID", 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.reconciliationReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      throw new ApiError("Report not found", 404, ErrorCodes.NOT_FOUND);
    }

    // Only admin or report owner can update
    if (existingReport.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ApiError("Access denied", 403, ErrorCodes.FORBIDDEN);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount);

    const report = await prisma.reconciliationReport.update({
      where: { id: reportId },
      data: updateData,
    });

    logger.info("Report updated", {
      event: "REPORT_UPDATED",
      userId: req.user.id,
      reportId: report.id,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json({
      status: "success",
      data: {
        report,
      },
    });
  } catch (error) {
    logger.error("Failed to update report", {
      event: "REPORT_UPDATE_ERROR",
      userId: req.user?.id,
      reportId: req.params.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const deleteReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const { id } = req.params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      throw new ApiError("Invalid report ID", 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.reconciliationReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      throw new ApiError("Report not found", 404, ErrorCodes.NOT_FOUND);
    }

    // Only admin or report owner can delete
    if (existingReport.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ApiError("Access denied", 403, ErrorCodes.FORBIDDEN);
    }

    await prisma.reconciliationReport.delete({
      where: { id: reportId },
    });

    logger.info("Report deleted", {
      event: "REPORT_DELETED",
      userId: req.user.id,
      reportId,
    });

    res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete report", {
      event: "REPORT_DELETION_ERROR",
      userId: req.user?.id,
      reportId: req.params.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const getReportStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ApiError("Not authenticated", 401, ErrorCodes.UNAUTHORIZED);
    }

    const stats = await prisma.reconciliationReport.groupBy({
      by: ["title"],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
      where: req.user.role === Role.ADMIN ? {} : { userId: req.user.id },
    });

    logger.info("Report stats retrieved", {
      event: "REPORT_STATS_RETRIEVED",
      userId: req.user.id,
      isAdmin: req.user.role === Role.ADMIN,
    });

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve report stats", {
      event: "REPORT_STATS_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};
