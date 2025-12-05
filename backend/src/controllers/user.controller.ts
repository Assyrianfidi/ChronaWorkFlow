import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ApiError, ErrorCodes } from '../utils/errorHandler.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Only admins can get all users
    if (req.user.role !== Role.ADMIN) {
      throw new ApiError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('All users retrieved', {
      event: 'ALL_USERS_RETRIEVED',
      userId: req.user.id,
      count: users.length
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve all users', {
      event: 'ALL_USERS_RETRIEVAL_ERROR',
      userId: req.user?.id,
      error: (error as Error).message
    });
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Users can only get their own profile unless they're admin
    if (userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ApiError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      throw new ApiError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    logger.info('User retrieved', {
      event: 'USER_RETRIEVED',
      userId: req.user.id,
      targetUserId: userId,
      isSelf: userId === req.user.id
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve user', {
      event: 'USER_RETRIEVAL_ERROR',
      userId: req.user?.id,
      targetUserId: req.params.id,
      error: (error as Error).message
    });
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Only admins can create users
    if (req.user.role !== Role.ADMIN) {
      throw new ApiError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    const { name, email, password, role = Role.USER } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      throw new ApiError('Missing required fields', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError('User already exists', 400, ErrorCodes.CONFLICT);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User created', {
      event: 'USER_CREATED',
      userId: req.user.id,
      newUserId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Failed to create user', {
      event: 'USER_CREATION_ERROR',
      userId: req.user?.id,
      error: (error as Error).message
    });
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    const { id } = req.params;
    const userId = parseInt(id);
    const { name, email, role, isActive } = req.body;

    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Users can only update their own profile (name, email only) unless they're admin
    if (userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ApiError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    const updateData: any = {};
    
    // Only admins can update role and isActive
    if (req.user.role === Role.ADMIN) {
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }
    
    // Any user can update their own name and email
    if (userId === req.user.id) {
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) {
        // Check if email is already taken by another user
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });
        if (emailExists && emailExists.id !== userId) {
          throw new ApiError('Email already taken', 400, ErrorCodes.CONFLICT);
        }
        updateData.email = email;
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User updated', {
      event: 'USER_UPDATED',
      userId: req.user.id,
      targetUserId: userId,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Failed to update user', {
      event: 'USER_UPDATE_ERROR',
      userId: req.user?.id,
      targetUserId: req.params.id,
      error: (error as Error).message
    });
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Only admins can delete users
    if (req.user.role !== Role.ADMIN) {
      throw new ApiError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Prevent self-deletion
    if (userId === req.user.id) {
      throw new ApiError('Cannot delete your own account', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted', {
      event: 'USER_DELETED',
      userId: req.user.id,
      deletedUserId: userId,
      deletedUserEmail: existingUser.email
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete user', {
      event: 'USER_DELETION_ERROR',
      userId: req.user?.id,
      targetUserId: req.params.id,
      error: (error as Error).message
    });
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    const { name, email } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists && emailExists.id !== req.user.id) {
        throw new ApiError('Email already taken', 400, ErrorCodes.CONFLICT);
      }
      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated', {
      event: 'USER_PROFILE_UPDATED',
      userId: req.user.id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Failed to update user profile', {
      event: 'USER_PROFILE_UPDATE_ERROR',
      userId: req.user?.id,
      error: (error as Error).message
    });
    next(error);
  }
};

export const deleteMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401, ErrorCodes.UNAUTHORIZED);
    }

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    logger.info('User self-deleted', {
      event: 'USER_SELF_DELETED',
      userId: req.user.id
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete user profile', {
      event: 'USER_SELF_DELETION_ERROR',
      userId: req.user?.id,
      error: (error as Error).message
    });
    next(error);
  }
};
