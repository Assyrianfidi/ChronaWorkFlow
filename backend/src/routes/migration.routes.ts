/**
 * Migration Routes
 * API endpoints for QuickBooks migration (QBO/IIF file import)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { quickBooksMigrationService } from '../services/quickbooks-migration.service';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedExtensions = ['.qbo', '.iif', '.ofx', '.qfx'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
});

// Apply auth middleware to all routes
router.use(auth);

/**
 * POST /api/migration/qbo
 * Import from QBO/OFX file
 */
router.post('/qbo', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;
    const file = (req as any).file;

    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (!companyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No company selected',
      });
    }

    const fileContent = file.buffer.toString('utf-8');

    logger.info('Starting QBO migration', {
      userId,
      companyId,
      fileName: file.originalname,
      fileSize: file.size,
    });

    const result = await quickBooksMigrationService.importFromQBO(
      fileContent,
      companyId,
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('QBO migration failed', { error });
    next(error);
  }
});

/**
 * POST /api/migration/iif
 * Import from IIF file (QuickBooks Desktop)
 */
router.post('/iif', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.currentCompanyId;
    const file = (req as any).file;

    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (!companyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No company selected',
      });
    }

    const fileContent = file.buffer.toString('utf-8');

    logger.info('Starting IIF migration', {
      userId,
      companyId,
      fileName: file.originalname,
      fileSize: file.size,
    });

    const result = await quickBooksMigrationService.importFromIIF(
      fileContent,
      companyId,
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('IIF migration failed', { error });
    next(error);
  }
});

/**
 * GET /api/migration/:id/status
 * Get migration status
 */
router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const status = quickBooksMigrationService.getMigrationStatus(id);

    if (!status) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Migration not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migration/supported-formats
 * Get list of supported import formats
 */
router.get('/supported-formats', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          extension: '.qbo',
          name: 'QuickBooks Online',
          description: 'OFX format exported from QuickBooks Online or banks',
        },
        {
          extension: '.ofx',
          name: 'Open Financial Exchange',
          description: 'Standard bank export format',
        },
        {
          extension: '.qfx',
          name: 'Quicken Financial Exchange',
          description: 'Quicken export format (compatible with OFX)',
        },
        {
          extension: '.iif',
          name: 'Intuit Interchange Format',
          description: 'QuickBooks Desktop export format',
        },
      ],
      maxFileSize: '50MB',
      features: [
        'Automatic account mapping',
        'AI-powered transaction categorization',
        'Customer and vendor import',
        'Invoice and bill import',
        'Historical transaction import',
      ],
    },
  });
});

export default router;
