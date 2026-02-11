/**
 * HTTPS/TLS Enforcement Middleware
 * Redirects HTTP to HTTPS and enforces secure connections
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/structured-logger';

/**
 * Enforce HTTPS in production
 */
export function enforceHTTPS() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only enforce in production
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Check if request is secure
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isSecure) {
      logger.warn('HTTP request redirected to HTTPS', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      // Redirect to HTTPS
      const httpsUrl = `https://${req.get('host')}${req.url}`;
      return res.redirect(301, httpsUrl);
    }

    next();
  };
}

/**
 * Enforce TLS 1.3 minimum version
 * This should be configured at the reverse proxy/load balancer level
 * This middleware just validates the connection
 */
export function validateTLSVersion() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // In production, verify TLS version from headers set by reverse proxy
    const tlsVersion = req.headers['x-forwarded-tls-version'];
    
    if (tlsVersion && tlsVersion !== 'TLSv1.3' && tlsVersion !== 'TLSv1.2') {
      logger.warn('Insecure TLS version detected', {
        ip: req.ip,
        tlsVersion,
        path: req.path
      });

      return res.status(426).json({
        error: 'Upgrade Required',
        message: 'TLS 1.2 or higher required',
        code: 'INSECURE_TLS_VERSION'
      });
    }

    next();
  };
}

/**
 * Add HSTS header
 * This is also handled by Helmet, but we add it here for redundancy
 */
export function addHSTSHeader() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    next();
  };
}
