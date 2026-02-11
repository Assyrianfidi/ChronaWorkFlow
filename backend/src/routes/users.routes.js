import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, createUserSchema, updateUserSchema } from '../middleware/validation.middleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// GET all users (with pagination, search, filter, sort)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role,
      isActive,
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build where clause
    const where = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Role filter
    if (role) {
      where.role = role;
    }
    
    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        currentCompanyId: true,
        companies: {
          select: {
            id: true,
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

// POST create new user
router.post('/', validate(createUserSchema), async (req, res) => {
  try {
    const { email, name, password, role = 'USER' } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    // Hash password if provided
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash('defaultPassword123', 10); // Default password
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
});

// PUT update user
router.put('/:id', validate(updateUserSchema), async (req, res) => {
  try {
    const { email, name, password, role, isActive } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });
      
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});

// GET user statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole.map(r => ({
          role: r.role,
          count: r._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
});

export default router;
