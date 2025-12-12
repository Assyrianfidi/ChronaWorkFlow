const authAttempts = [];

export default function ipLoggerMiddleware(req, res, next) {
  // Only log auth routes
  if (req.path.startsWith("/api/auth") && req.method === "POST") {
    const logEntry = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      email: req.body?.email || "anonymous",
    };

    authAttempts.push(logEntry);

    // Keep only last 1000 entries to prevent memory issues
    if (authAttempts.length > 1000) {
      authAttempts.splice(0, 100);
    }

    // Log to console (will be replaced with DB logging in Phase 6.3)
    console.log(
      `[AUTH ATTEMPT] ${logEntry.timestamp} - IP: ${logEntry.ip} - Email: ${logEntry.email} - Path: ${logEntry.path}`,
    );
  }

  next();
}

export { authAttempts };
