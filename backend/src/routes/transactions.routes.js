import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, createTransactionSchema } from '../middleware/validation.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all transactions (with pagination, search, filter, sort)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type,
      status,
      startDate,
      endDate,
      companyId,
      sortBy = 'date', 
      order = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transactions.findMany({
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
      prisma.transactions.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

// GET transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transactions.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        transactionLines: true,
      },
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }
    
    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message,
    });
  }
});

// POST create new transaction
router.post('/', validate(createTransactionSchema), async (req, res) => {
  try {
    const { amount, description, date, type, companyId, status, referenceNumber } = req.body;
    
    const transaction = await prisma.transactions.create({
      data: {
        amount,
        description,
        date: new Date(date),
        type,
        companyId,
        status: status || 'PENDING',
        referenceNumber,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
    });
  }
});

// PUT update transaction
router.put('/:id', validate(createTransactionSchema), async (req, res) => {
  try {
    const { amount, description, date, type, status, referenceNumber } = req.body;
    
    const existingTransaction = await prisma.transactions.findUnique({
      where: { id: req.params.id },
    });
    
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (description) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;
    
    const transaction = await prisma.transactions.update({
      where: { id: req.params.id },
      data: updateData,
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
      data: transaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message,
    });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transactions.findUnique({
      where: { id: req.params.id },
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }
    
    await prisma.transactions.delete({
      where: { id: req.params.id },
    });
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message,
    });
  }
});

// GET transaction statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const [
      totalTransactions,
      totalAmount,
      byType,
      byStatus,
    ] = await Promise.all([
      prisma.transactions.count({ where }),
      prisma.transactions.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.transactions.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.transactions.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalTransactions,
        totalAmount: totalAmount._sum.amount || 0,
        byType: byType.map(t => ({
          type: t.type,
          count: t._count,
          amount: t._sum.amount || 0,
        })),
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message,
    });
  }
});

export default router;
