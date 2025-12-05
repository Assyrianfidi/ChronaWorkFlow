import helmetMiddleware from './helmet.middleware.js';
import corsMiddleware from './cors.middleware.js';
import bodyLimitMiddleware from './bodyLimit.middleware.js';
import { globalAPILimiter, authRateLimiter, sensitiveRouteLimiter } from './rateLimit.middleware.js';
import sanitizeMiddleware from './sanitize.middleware.js';
import contentTypeMiddleware from './contentType.middleware.js';
import ipLoggerMiddleware from './ipLogger.middleware.js';

export default function applySecurityMiddlewares(app) {
  // 1. Apply helmet for secure HTTP headers
  helmetMiddleware(app);
  
  // 2. Apply CORS with strict origin checking
  corsMiddleware(app);
  
  // 3. Apply content type validation BEFORE body parsing
  app.use(contentTypeMiddleware);
  
  // 4. Apply body parsing with limits
  bodyLimitMiddleware(app);
  
  // 5. Apply XSS sanitization
  sanitizeMiddleware(app);
  
  // 6. Apply IP logging for auth routes
  app.use(ipLoggerMiddleware);
  
  // 7. Apply global rate limiting
  app.use(globalAPILimiter);
}

// Export rate limiters for specific route application
export { authRateLimiter, sensitiveRouteLimiter };
