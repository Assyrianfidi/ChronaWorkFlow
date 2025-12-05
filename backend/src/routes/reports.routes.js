import express from 'express';
import { auth, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import * as reportController from '../controllers/reports.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

/**
 * @api {get} /api/reports Get All Reports
 * @apiName GetReports
 * @apiGroup Reports
 * @apiHeader {String} Authorization Bearer token
 * @apiDescription Get all reports (admin/manager can see all, others see only their own)
 */
router.get('/', reportController.getReports);

/**
 * @api {get} /api/reports/:id Get Report by ID
 * @apiName GetReport
 * @apiGroup Reports
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {Number} id Report ID
 */
router.get('/:id', reportController.getReport);

/**
 * @api {post} /api/reports Create New Report
 * @apiName CreateReport
 * @apiGroup Reports
 * @apiHeader {String} Authorization Bearer token
 * @apiBody {String} title Report title
 * @apiBody {Number} amount Report amount
 */
router.post(
  '/',
  authorizeRoles(ROLES.USER, ROLES.ASSISTANT_MANAGER, ROLES.MANAGER, ROLES.ADMIN),
  reportController.createReport
);

/**
 * @api {put} /api/reports/:id Update Report
 * @apiName UpdateReport
 * @apiGroup Reports
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {Number} id Report ID
 * @apiBody {String} [title] Updated report title
 * @apiBody {Number} [amount] Updated report amount
 */
router.put(
  '/:id',
  authorizeRoles(ROLES.USER, ROLES.ASSISTANT_MANAGER, ROLES.MANAGER, ROLES.ADMIN),
  reportController.updateReport
);

/**
 * @api {delete} /api/reports/:id Delete Report
 * @apiName DeleteReport
 * @apiGroup Reports
 * @apiHeader {String} Authorization Bearer token
 * @apiParam {Number} id Report ID
 */
router.delete(
  '/:id',
  authorizeRoles(ROLES.MANAGER, ROLES.ADMIN),
  reportController.deleteReport
);

export default router;
