const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    // Build the where clause
    const where = {};
    
    // Filter by user ID if provided
    if (userId) {
      where.userId = parseInt(userId);
    } else if (req.user.role !== 'ADMIN') {
      // Non-admin users can only see their own reports
      where.userId = req.user.id;
    }

    const reports = await prisma.reconciliationReport.findMany({
      where,
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
        createdAt: 'desc',
      },
    });

    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await prisma.reconciliationReport.findUnique({
      where: { id: parseInt(req.params.id) },
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
      return next(new ApiError(404, 'Report not found'));
    }

    // Check if user has permission to view this report
    if (req.user.role !== 'ADMIN' && report.userId !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to access this report'));
    }

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res, next) => {
  try {
    console.log('Create report request body:', req.body);
    console.log('User from request:', req.user);
    
    if (!req.user) {
      console.error('No user found in request');
      throw new ApiError(401, 'Authentication required');
    }

    const { title, amount } = req.body;
    const userId = req.user.id;

    if (!title || amount === undefined) {
      console.error('Missing required fields:', { title, amount });
      return next(new ApiError(400, 'Title and amount are required'));
    }

    // Check if a report with the same title already exists for this user
    const existingReport = await prisma.reconciliationReport.findFirst({
      where: {
        title,
        userId,
      },
    });

    if (existingReport) {
      console.log('Duplicate report found:', existingReport);
      return next(new ApiError(400, 'A report with this title already exists'));
    }

    const report = await prisma.reconciliationReport.create({
      data: {
        title,
        amount: parseFloat(amount),
        userId,
      },
    });

    console.log('Report created successfully:', report);
    return res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount } = req.body;

    // Check if report exists
    const report = await prisma.reconciliationReport.findUnique({
      where: { id: parseInt(id) },
    });

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    // Only admin or report owner can update
    if (req.user.role !== 'ADMIN' && report.userId !== req.user.id) {
      throw new ApiError(403, 'Not authorized to update this report');
    }

    // Check if title is being updated to a duplicate
    if (title && title !== report.title) {
      const existingReport = await prisma.reconciliationReport.findFirst({
        where: {
          title,
          userId: report.userId,
          NOT: { id: parseInt(id) },
        },
      });

      if (existingReport) {
        throw new ApiError(400, 'A report with this title already exists');
      }
    }

    // Update report
    const updatedReport = await prisma.reconciliationReport.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
      },
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

    res.status(200).json(updatedReport);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if report exists
    const report = await prisma.reconciliationReport.findUnique({
      where: { id: parseInt(id) },
    });

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    // Only admin or report owner can delete
    if (req.user.role !== 'ADMIN' && report.userId !== req.user.id) {
      throw new ApiError(403, 'Not authorized to delete this report');
    }

    await prisma.reconciliationReport.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
};
