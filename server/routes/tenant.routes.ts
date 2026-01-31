/**
 * Tenant Branding API Routes
 */

import { Router } from 'express';
import { resolveTenant, TenantRequest } from '../middleware/tenantResolution';

const router = Router();

/**
 * GET /api/tenant/branding
 * 
 * Get tenant branding configuration
 */
router.get('/branding', resolveTenant, async (req: TenantRequest, res) => {
  try {
    const { tenant } = req;

    if (!tenant) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        name: tenant.name,
        logo: tenant.logo,
        favicon: tenant.favicon,
        theme: tenant.theme,
        settings: tenant.settings,
      },
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch tenant branding:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant branding',
    });
  }
});

/**
 * GET /api/tenant/feature-flags
 * 
 * Get tenant feature flags
 */
router.get('/feature-flags', resolveTenant, async (req: TenantRequest, res) => {
  try {
    const { tenant } = req;

    if (!tenant) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found',
      });
      return;
    }

    res.json({
      success: true,
      data: tenant.featureFlags,
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch feature flags:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch feature flags',
    });
  }
});

export default router;
