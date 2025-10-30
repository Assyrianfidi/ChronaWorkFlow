const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../config');
const { logger } = require('../utils/logger');

/**
 * Rate limiting middleware to prevent abuse of the API
 */
const rateLimiter = rateLimit({
  windowMs: Number(RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
  max: Number(RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(
      `Rate limit exceeded for IP: ${req.ip}, Path: ${req.originalUrl}, Method: ${req.method}`
    );
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    if (req.path === '/health') {
      return true;
    }
    return false;
  },
});

module.exports = rateLimiter;
