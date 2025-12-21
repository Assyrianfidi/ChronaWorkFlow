/**
 * AI Rate Limiter Middleware
 * Prevents abuse of AI endpoints with tiered rate limiting
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// AI Copilot rate limiter - more restrictive due to OpenAI costs
export const aiCopilotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many AI queries. Please wait before trying again.',
    retryAfter: 60,
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

// AI Categorization rate limiter - moderate limits
export const aiCategorizationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 categorizations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many categorization requests. Please wait before trying again.',
    retryAfter: 60,
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

// Cash Flow Forecast rate limiter
export const forecastLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 forecasts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many forecast requests. Please wait before trying again.',
    retryAfter: 300,
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

// Anomaly Detection rate limiter
export const anomalyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 scans per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many anomaly scan requests. Please wait before trying again.',
    retryAfter: 300,
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

// Migration rate limiter - very restrictive
export const migrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 migrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many migration attempts. Please wait before trying again.',
    retryAfter: 3600,
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

// General AI rate limiter for all AI endpoints
export const generalAiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    retryAfter: 60,
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

export default {
  aiCopilotLimiter,
  aiCategorizationLimiter,
  forecastLimiter,
  anomalyLimiter,
  migrationLimiter,
  generalAiLimiter,
};
