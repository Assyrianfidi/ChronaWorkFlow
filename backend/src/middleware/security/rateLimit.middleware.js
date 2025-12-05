import rateLimit from 'express-rate-limit';

// Auth limiter - 5 login attempts per minute
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many login attempts, please try again later.',
      retryAfter: 60
    });
  }
});

// Global API limiter - 60 requests per minute
export const globalAPILimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many requests, please try again later.',
      retryAfter: 60
    });
  }
});

// Sensitive routes limiter - 10 requests per 30 seconds
export const sensitiveRouteLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many sensitive operations, please try again later.',
      retryAfter: 30
    });
  }
});
