import { ApiError } from "../utils/errorHandler.js";
import { ROLES } from "../constants/roles.js";
import { prisma } from "../utils/prisma.js";

/**
 * @desc    Get all reports (admin/manager can see all, others see only their own)
 * @route   GET /api/reports
 * @access  Private
 */
export const getReports = async (req: any, res: any, next: any) => {
  try {
    const { role, id: userId } = req.user;

    // Build where clause based on company
    const companyId = (req as any).user?.currentCompanyId;
    const where: any = companyId ? { companyId } : {};

    const reports = await prisma.reconciliation_reports.findMany({
      where,
      orderBy: {
        generatedAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error: any) {
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

    const report = await prisma.reconciliation_reports.findUnique({
      where: { id: id },
    });

    if (!report) {
      throw new ApiError("Report not found", 404);
    }

    // Check if user is authorized to view this report (company-level)
    const companyId = (req as any).user?.currentCompanyId;
    if (companyId && report.companyId !== companyId && !["admin", "manager"].includes(role)) {
      throw new ApiError("Not authorized to access this report", 403);
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
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
    const { title, amount, reportType, description, status } = req.body;
    const { id: userId } = req.user;

    // Validate input
    if (!title || !amount) {
      throw new ApiError("Please provide title and amount", 400);
    }

    const companyId = (req as any).user?.currentCompanyId || '';
    const report = await prisma.reconciliation_reports.create({
      data: {
        id: `report_${Date.now()}`,
        companyId,
        reportType: reportType || "",
        data: { title, description: description || "", status: status || "" },
      },
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
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
    const { title, amount, description, status, reportType } = req.body || {};
    const { id: userId, role } = req.user;

    // Check if report exists
    const existingReport = await prisma.reconciliation_reports.findUnique({
      where: { id: id },
    });

    if (!existingReport) {
      throw new ApiError("Report not found", 404);
    }

    // Check if user is authorized to update this report
    if (
      existingReport.companyId !== (req as any).user?.currentCompanyId &&
      !["admin", "manager"].includes(role)
    ) {
      throw new ApiError("Not authorized to update this report", 403);
    }

    const updatedReport = await prisma.reconciliation_reports.update({
      where: { id: id },
      data: {
        ...(title && { data: { ...(existingReport.data as any), title } }),
        ...(amount && { data: { ...(existingReport.data as any), amount } }),
        ...(description && { data: { ...(existingReport.data as any), description } }),
        ...(status && { data: { ...(existingReport.data as any), status: status || "" } }),
        ...(reportType && { reportType }),
      },
    });

    res.status(200).json({
      success: true,
      data: updatedReport,
    });
  } catch (error: any) {
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
    const report = await prisma.reconciliation_reports.findUnique({
      where: { id: id },
    });

    if (!report) {
      throw new ApiError("Report not found", 404);
    }

    // Check if user is authorized to delete this report
    if (report.companyId !== (req as any).user?.currentCompanyId && !["admin", "manager"].includes(role)) {
      throw new ApiError("Not authorized to delete this report", 403);
    }

    await prisma.reconciliation_reports.delete({
      where: { id: id },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error: any) {
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
