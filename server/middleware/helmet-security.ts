/**
 * Helmet.js Security Headers Configuration
 * Implements comprehensive security headers for production
 */

import helmet from 'helmet';
import { Express } from 'express';

export function configureHelmetSecurity(app: Express): void {
  // Apply Helmet with comprehensive security headers
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          ...(process.env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
        },
      },

      // HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // X-Frame-Options: Prevent clickjacking
      frameguard: {
        action: 'deny',
      },

      // X-Content-Type-Options: Prevent MIME sniffing
      noSniff: true,

      // X-XSS-Protection: Enable XSS filter
      xssFilter: true,

      // Referrer-Policy: Control referrer information
      referrerPolicy: {
        policy: 'no-referrer',
      },

      // X-DNS-Prefetch-Control: Control DNS prefetching
      dnsPrefetchControl: {
        allow: false,
      },

      // X-Download-Options: Prevent IE from executing downloads
      ieNoOpen: true,

      // X-Permitted-Cross-Domain-Policies: Restrict cross-domain policies
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },

      // Hide X-Powered-By header
      hidePoweredBy: true,
    })
  );

  // Additional custom security headers
  app.use((req, res, next) => {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Additional security headers
    res.setHeader('X-Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-WebKit-CSP', "default-src 'self'");
    
    next();
  });
}
