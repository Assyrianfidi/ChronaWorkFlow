import { PrismaClient } from "@prisma/client";
import { ApiError } from "../middleware/errorHandler.js";
import { ROLES } from "../constants/roles.js";

const prisma = PrismaClientSingleton.getInstance();

/**
 * @desc    Get all reports (admin/manager can see all, others see only their own)
 * @route   GET /api/reports
 * @access  Private
 */
export const getReports = async (req: any, res: any, next: any) => {
  try {
    const { role, id: userId } = req.user;

    // Build where clause based on user role
    const where = {};
    if ([ROLES.USER, ROLES.ASSISTANT_MANAGER].includes(role)) {
      where.userId = userId;
    }

    const reports = await prisma.reconciliationReport.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
export const getReport = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const report = await prisma.reconciliationReport.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    // Check if user is authorized to view this report
    if (report.userId !== userId && !["admin", "manager"].includes(role)) {
      throw new ApiError(403, "Not authorized to access this report");
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new report
 * @route   POST /api/reports
 * @access  Private
 */
export const createReport = async (req: any, res: any, next: any) => {
  try {
    const { title, amount } = req.body;
    const { id: userId } = req.user;

    // Validate input
    if (!title || !amount) {
      throw new ApiError(400, "Please provide title and amount");
    }

    const report = await prisma.reconciliationReport.create({
      data: {
        title,
        amount: parseFloat(amount),
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update report
 * @route   PUT /api/reports/:id
 * @access  Private
 */
export const updateReport = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { title, amount } = req.body;
    const { id: userId, role } = req.user;

    // Check if report exists
    const existingReport = await prisma.reconciliationReport.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingReport) {
      throw new ApiError(404, "Report not found");
    }

    // Check if user is authorized to update this report
    if (
      existingReport.userId !== userId &&
      !["admin", "manager"].includes(role)
    ) {
      throw new ApiError(403, "Not authorized to update this report");
    }

    const updatedReport = await prisma.reconciliationReport.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(title && { title }),
        ...(amount && { amount: parseFloat(amount) }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete report
 * @route   DELETE /api/reports/:id
 * @access  Private (admin/manager only)
 */
export const deleteReport = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Check if report exists
    const report = await prisma.reconciliationReport.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    // Check if user is authorized to delete this report
    if (report.userId !== userId && !["admin", "manager"].includes(role)) {
      throw new ApiError(403, "Not authorized to delete this report");
    }

    await prisma.reconciliationReport.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
};
