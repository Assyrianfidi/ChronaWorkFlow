import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error.middleware.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: any;
    currentCompanyId?: string;
  };
}

export class DashboardController {
  async getHealthMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await dashboardService.getHealthMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Dashboard health metrics error', { error: (error as Error).message });
      next(error);
    }
  }

  async getFinancialMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await dashboardService.getFinancialMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Dashboard financial metrics error', { error: (error as Error).message });
      next(error);
    }
  }

  async getCustomerMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await dashboardService.getCustomerMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Dashboard customer metrics error', { error: (error as Error).message });
      next(error);
    }
  }

  async getExternalServicesStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = await dashboardService.getExternalServicesStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Dashboard external services error', { error: (error as Error).message });
      next(error);
    }
  }

  async getAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const alerts = await dashboardService.getAlerts();
      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      logger.error('Dashboard alerts error', { error: (error as Error).message });
      next(error);
    }
  }

  async getComplianceMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await dashboardService.getComplianceMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Dashboard compliance metrics error', { error: (error as Error).message });
      next(error);
    }
  }

  async getAPIPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const performance = await dashboardService.getAPIPerformance();
      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error: any) {
      logger.error('Dashboard API performance error', { error: (error as Error).message });
      next(error);
    }
  }

  async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await dashboardService.getOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error: any) {
      logger.error('Dashboard overview error', { error: (error as Error).message });
      next(error);
    }
  }

  async sendTestEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { to } = req.body;

      if (!to) {
        throw new AppError('Email address is required', 400);
      }

      const result = await dashboardService.sendTestEmail(to);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Dashboard test email error', { error: (error as Error).message });
      next(error);
    }
  }

  async sendTestSMS(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { to } = req.body;

      if (!to) {
        throw new AppError('Phone number is required', 400);
      }

      const result = await dashboardService.sendTestSMS(to);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Dashboard test SMS error', { error: (error as Error).message });
      next(error);
    }
  }

  async generateTestPDF(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { invoiceId } = req.body;

      if (!invoiceId) {
        throw new AppError('Invoice ID is required', 400);
      }

      const result = await dashboardService.generateTestPDF(invoiceId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Dashboard test PDF error', { error: (error as Error).message });
      next(error);
    }
  }

  async runHealthCheck(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.runHealthCheck();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Dashboard health check error', { error: (error as Error).message });
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
