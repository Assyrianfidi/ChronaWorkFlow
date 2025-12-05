import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { authService, AuthTokens, UserRole, generateAccessToken } from '../services/auth.service.js';
import { RefreshTokenService } from '../services/refreshToken.service.ts';
import { ApiError, ErrorCodes } from '../utils/errorHandler.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import AuditLoggerService from '../services/auditLogger.service.js';

// Zod schemas for request validation
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Set HTTP-only cookie with refresh token
const setRefreshTokenCookie = (res: Response, token: string) => {
  const maxAge = RefreshTokenService.getRefreshTokenExpiry() * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/',
    // Additional security flags
    ...(process.env.NODE_ENV === 'production' && {
      domain: process.env.COOKIE_DOMAIN,
    })
  });
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Authenticate user
    const { user, tokens } = await authService.login({ email, password });

    // Create refresh token using RefreshTokenService
    const refreshToken = await RefreshTokenService.createRefreshToken(user.id);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    // Log successful login
    logger.info(`User logged in: ${user.email} (ID: ${user.id}) from IP: ${req.ip}`);
    
    // Audit log successful login
    await AuditLoggerService.logAuthEvent({
      action: 'LOGIN',
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      details: {
        loginMethod: 'password',
        timestamp: new Date()
      },
      severity: 'INFO'
    });

    // Return access token and user data
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError('Validation failed', StatusCodes.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, true, error.errors));
    }
    
    // Log failed login attempt
    logger.error(`Login failed for email: ${req.body?.email} from IP: ${req.ip}`);
    
    // Audit log failed login
    await AuditLoggerService.logAuthEvent({
      action: 'LOGIN_FAILED',
      userId: null,
      email: req.body?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      details: {
        reason: (error as Error).message || 'Invalid credentials',
        timestamp: new Date(),
        bruteForce: true // Flag for potential brute force
      },
      severity: 'WARNING'
    });
    
    next(error);
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { name, email, password, role } = registerSchema.parse(req.body);

    // Create new user
    const { user, tokens } = await authService.register({
      name,
      email,
      password,
      role
    });

    // Create refresh token using RefreshTokenService
    const refreshToken = await RefreshTokenService.createRefreshToken(user.id);

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    // Log successful registration
    logger.info(`User registered: ${user.email} (ID: ${user.id}) from IP: ${req.ip}`);
    
    // Audit log successful registration
    await AuditLoggerService.logAuthEvent({
      action: 'REGISTER',
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      details: {
        role: user.role,
        timestamp: new Date()
      },
      severity: 'INFO'
    });

    // Return access token and user data
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError('Validation failed', StatusCodes.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, true, error.errors));
    }
    
    // Log failed registration
    logger.error(`Registration failed for email: ${req.body?.email} from IP: ${req.ip}`);
    
    // Audit log failed registration
    await AuditLoggerService.logAuthEvent({
      action: 'REGISTER_FAILED',
      userId: null,
      email: req.body?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      details: {
        reason: (error as Error).message || 'Registration failed',
        timestamp: new Date()
      },
      severity: 'WARNING'
    });
    
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError('No refresh token provided', StatusCodes.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
    }

    // Rotate refresh token - create new one and invalidate old
    const newRefreshToken = await RefreshTokenService.rotateRefreshToken(refreshToken);

    // Get user info for access token generation
    const { user } = await RefreshTokenService.verifyRefreshToken(newRefreshToken);
    
    // Generate new access token
    const tokens = generateAccessToken(user);

    // Set new refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, newRefreshToken);

    // Log token refresh
    logger.info(`Token refreshed for user: ${user.email} (ID: ${user.id}) from IP: ${req.ip}`);

    // Return new access token
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error) {
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    logger.error(`Token refresh failed from IP: ${req.ip}`);
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Invalidate the specific refresh token
      await RefreshTokenService.invalidateRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    // Log successful logout
    logger.info(`User logged out from IP: ${req.ip}`);
    
    // Audit log successful logout
    await AuditLoggerService.logAuthEvent({
      action: 'LOGOUT',
      userId: req.user?.id,
      email: req.user?.email || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      details: {
        logoutMethod: 'explicit',
        timestamp: new Date()
      },
      severity: 'INFO'
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error(`Logout failed from IP: ${req.ip}`);
    
    // Audit log failed logout
    await AuditLoggerService.logAuthEvent({
      action: 'LOGOUT_FAILED',
      userId: req.user?.id,
      email: req.user?.email || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      details: {
        reason: (error as Error).message || 'Logout failed',
        timestamp: new Date()
      },
      severity: 'WARNING'
    });
    
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', StatusCodes.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
    }

    // Validate request body
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    // Invalidate all refresh tokens for this user when password changes
    await RefreshTokenService.invalidateUserRefreshTokens(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    logger.info(`Password changed for user ID: ${req.user.id} from IP: ${req.ip}`);
    
    // Audit log password change
    await AuditLoggerService.logAuthEvent({
      action: 'PASSWORD_CHANGE',
      userId: req.user.id,
      email: req.user.email || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      details: {
        timestamp: new Date(),
        allTokensInvalidated: true
      },
      severity: 'INFO'
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', StatusCodes.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, true, error.errors);
    }
    
    // Audit log failed password change
    await AuditLoggerService.logAuthEvent({
      action: 'PASSWORD_CHANGE_FAILED',
      userId: req.user?.id,
      email: req.user?.email || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      details: {
        reason: (error as Error).message || 'Password change failed',
        timestamp: new Date()
      },
      severity: 'WARNING'
    });
    
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', StatusCodes.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
    }

    const user = await authService.getCurrentUser(req.user.id);
    res.status(StatusCodes.OK).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user from all sessions
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', StatusCodes.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
    }

    // Invalidate all refresh tokens for this user
    await RefreshTokenService.invalidateUserRefreshTokens(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    logger.info(`User logged out from all sessions - User ID: ${req.user.id} from IP: ${req.ip}`);

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error(`Logout all sessions failed for user ID: ${req.user?.id} from IP: ${req.ip}`);
    next(error);
  }
};
