import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, createInvoiceSchema } from '../middleware/validation.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all invoices (with pagination, search, filter, sort)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status,
      startDate,
      endDate,
      companyId,
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    });
  }
});

// GET invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        invoiceLines: true,
      },
    });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
});

// POST create new invoice
router.post('/', validate(createInvoiceSchema), async (req, res) => {
  try {
    const { 
      invoiceNumber, 
      amount, 
      dueDate, 
      status, 
      customerId, 
      customerName,
      companyId,
      items 
    } = req.body;
    
    const invoiceData = {
      invoiceNumber,
      amount,
      dueDate: new Date(dueDate),
      status: status || 'DRAFT',
      customerId,
      customerName,
      companyId,
    };
    
    // Create invoice with line items if provided
    if (items && items.length > 0) {
      invoiceData.invoiceLines = {
        create: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      };
    }
    
    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        invoiceLines: true,
      },
    });
    
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    });
  }
});

// PUT update invoice
router.put('/:id', validate(createInvoiceSchema), async (req, res) => {
  try {
    const { 
      invoiceNumber, 
      amount, 
      dueDate, 
      status, 
      customerName 
    } = req.body;
    
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
    });
    
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    
    const updateData = {};
    if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status) updateData.status = status;
    if (customerName) updateData.customerName = customerName;
    
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        invoiceLines: true,
      },
    });
    
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message,
    });
  }
});

// DELETE invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
    });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    
    await prisma.invoice.delete({
      where: { id: req.params.id },
    });
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message,
    });
  }
});

// PATCH update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }
    
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      data: invoice,
      message: `Invoice status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message,
    });
  }
});

// GET invoice statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }
    
    const [
      totalInvoices,
      totalAmount,
      byStatus,
      overdue,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: {
          ...where,
          status: { not: 'PAID' },
          dueDate: { lt: new Date() },
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalInvoices,
        totalAmount: totalAmount._sum.amount || 0,
        overdue,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
          amount: s._sum.amount || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice statistics',
      error: error.message,
    });
  }
});

export default router;
