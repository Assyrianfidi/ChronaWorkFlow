/**
 * Request Logging Middleware
 * Production-grade request logging for monitoring and debugging
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('User-Agent') || '';

  // Log request
  console.log(`📝 ${method} ${originalUrl} - ${ip} - ${userAgent}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`✅ ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${method} ${originalUrl} took ${duration}ms`);
    }
    
    // Log errors
    if (statusCode >= 400) {
      console.error(`❌ Error response: ${method} ${originalUrl} - ${statusCode}`);
    }
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};
