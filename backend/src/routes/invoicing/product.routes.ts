import { Router } from 'express';
import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { auth, authorizeRoles } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(auth);

// GET /api/products - List products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        invoiceLines: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/products - Create product (ADMIN, ACCOUNTANT only
router.post('/', 
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  [
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').optional().isString(),
    body('unitPrice').isInt({ min: 0 }).withMessage('Unit price must be a non-negative integer'),
    body('taxInclusive').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const product = await prisma.product.create({
        data: req.body
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// PUT /api/products/:id - Update product (ADMIN, ACCOUNTANT only)
router.put('/:id', 
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  [
    body('sku').optional().notEmpty().withMessage('SKU is required'),
    body('name').optional().notEmpty().withMessage('Product name is required'),
    body('description').optional().isString(),
    body('unitPrice').optional().isInt({ min: 0 }).withMessage('Unit price must be a non-negative integer'),
    body('taxInclusive').optional().isBoolean()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      
      const product = await prisma.product.update({
        where: { id },
        data: req.body
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// DELETE /api/products/:id - Delete product (ADMIN only)
router.delete('/:id', 
  authorizeRoles([ROLES.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if product is used in invoices
      const usageCount = await prisma.invoiceLine.count({
        where: { productId: id }
      });

      if (usageCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete product that is used in invoices'
        });
      }

      await prisma.product.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router;
