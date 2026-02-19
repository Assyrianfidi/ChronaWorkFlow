import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { Role } from '@prisma/client';

const router = Router();
export const dashboardRoutes = router;

// All dashboard routes require admin/CEO authentication
router.use(protect);
router.use(authorize(Role.ADMIN, Role.MANAGER));

/**
 * @route GET /api/dashboard/health
 * @desc Get comprehensive system health metrics
 * @access Admin/CEO only
 */
router.get('/health', (req: any, res: any, next: any) => dashboardController.getHealthMetrics(req, res, next));

/**
 * @route GET /api/dashboard/financial
 * @desc Get financial KPIs (revenue, invoices, payments)
 * @access Admin/CEO only
 */
router.get('/financial', (req: any, res: any, next: any) => dashboardController.getFinancialMetrics(req, res, next));

/**
 * @route GET /api/dashboard/customers
 * @desc Get customer/tenant metrics
 * @access Admin/CEO only
 */
router.get('/customers', (req: any, res: any, next: any) => dashboardController.getCustomerMetrics(req, res, next));

/**
 * @route GET /api/dashboard/external-services
 * @desc Get external services status (SendGrid, Twilio, Stripe, PDF)
 * @access Admin/CEO only
 */
router.get('/external-services', (req: any, res: any, next: any) => dashboardController.getExternalServicesStatus(req, res, next));

/**
 * @route GET /api/dashboard/alerts
 * @desc Get active alerts and notifications
 * @access Admin/CEO only
 */
router.get('/alerts', (req: any, res: any, next: any) => dashboardController.getAlerts(req, res, next));

/**
 * @route GET /api/dashboard/compliance
 * @desc Get GDPR and compliance metrics
 * @access Admin/CEO only
 */
router.get('/compliance', (req, res, next) => dashboardController.getComplianceMetrics(req, res, next));

/**
 * @route GET /api/dashboard/api-performance
 * @desc Get API endpoint performance metrics
 * @access Admin/CEO only
 */
router.get('/api-performance', (req, res, next) => dashboardController.getAPIPerformance(req, res, next));

/**
 * @route POST /api/dashboard/actions/test-email
 * @desc Send test email
 * @access Admin/CEO only
 */
router.post('/actions/test-email', (req, res, next) => dashboardController.sendTestEmail(req, res, next));

/**
 * @route POST /api/dashboard/actions/test-sms
 * @desc Send test SMS
 * @access Admin/CEO only
 */
router.post('/actions/test-sms', (req, res, next) => dashboardController.sendTestSMS(req, res, next));

/**
 * @route POST /api/dashboard/actions/generate-pdf
 * @desc Generate test PDF
 * @access Admin/CEO only
 */
router.post('/actions/generate-pdf', (req, res, next) => dashboardController.generateTestPDF(req, res, next));

/**
 * @route POST /api/dashboard/actions/run-health-check
 * @desc Run comprehensive health check
 * @access Admin/CEO only
 */
router.post('/actions/run-health-check', (req, res, next) => dashboardController.runHealthCheck(req, res, next));

/**
 * @route GET /api/dashboard/overview
 * @desc Get dashboard overview with all critical metrics
 * @access Admin/CEO only
 */
router.get('/overview', (req, res, next) => dashboardController.getOverview(req, res, next));

export default router;
