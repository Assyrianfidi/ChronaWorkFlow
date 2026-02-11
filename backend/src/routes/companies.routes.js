import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, createCompanySchema } from '../middleware/validation.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET all companies (with pagination, search, filter, sort)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      industry,
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (industry) {
      where.industry = industry;
    }
    
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          _count: {
            select: {
              users: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message,
    });
  }
});

// GET company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            transactions: true,
          },
        },
      },
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }
    
    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: error.message,
    });
  }
});

// POST create new company
router.post('/', validate(createCompanySchema), async (req, res) => {
  try {
    const { name, description, industry, website, email, phone } = req.body;
    
    const company = await prisma.company.create({
      data: {
        name,
        description,
        industry,
        website,
        email,
        phone,
      },
    });
    
    res.status(201).json({
      success: true,
      data: company,
      message: 'Company created successfully',
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create company',
      error: error.message,
    });
  }
});

// PUT update company
router.put('/:id', validate(createCompanySchema), async (req, res) => {
  try {
    const { name, description, industry, website, email, phone } = req.body;
    
    const existingCompany = await prisma.company.findUnique({
      where: { id: req.params.id },
    });
    
    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (industry) updateData.industry = industry;
    if (website) updateData.website = website;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json({
      success: true,
      data: company,
      message: 'Company updated successfully',
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update company',
      error: error.message,
    });
  }
});

// DELETE company
router.delete('/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }
    
    await prisma.company.delete({
      where: { id: req.params.id },
    });
    
    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message,
    });
  }
});

// GET company statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalCompanies, companiesByIndustry] = await Promise.all([
      prisma.company.count(),
      prisma.company.groupBy({
        by: ['industry'],
        _count: true,
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalCompanies,
        byIndustry: companiesByIndustry.map(c => ({
          industry: c.industry || 'Unknown',
          count: c._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company statistics',
      error: error.message,
    });
  }
});

export default router;
