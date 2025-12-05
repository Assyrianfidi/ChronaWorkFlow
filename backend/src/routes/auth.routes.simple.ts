import express from 'express';
import { body, validationResult } from 'express-validator';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  forgotPassword, 
  resetPassword, 
  verifyEmail 
} from '../controllers/auth.controller.simple';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', 
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'USER', 'AUDITOR', 'INVENTORY_MANAGER']).withMessage('Invalid role')
  ],
  handleValidationErrors,
  register
);

// @desc    Login user and get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  login
);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', getMe);

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', logout);

// @desc    Forgot password
// @route   POST /api/auth/forgot
// @access  Public
router.post('/forgot',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  handleValidationErrors,
  forgotPassword
);

// @desc    Reset password
// @route   POST /api/auth/reset
// @access  Public
router.post('/reset',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  handleValidationErrors,
  resetPassword
);

// @desc    Verify email
// @route   POST /api/auth/verify
// @access  Public
router.post('/verify',
  [
    body('token').notEmpty().withMessage('Verification token is required')
  ],
  handleValidationErrors,
  verifyEmail
);

export { router as authRoutes };
