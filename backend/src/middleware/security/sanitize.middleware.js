// Custom XSS sanitizer since xss-clean is deprecated
function sanitizeXSS(req, res, next) {
  if (req.body) {
    // Simple XSS sanitization for JSON body
    const sanitizeString = (str) => {
      if (typeof str !== "string") return str;
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    };

    const sanitizeObject = (obj) => {
      if (typeof obj === "string") {
        return sanitizeString(obj);
      }

      if (typeof obj !== "object" || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    };

    // Replace the entire request body with sanitized version
    req.body = sanitizeObject(req.body);
  }
  next();
}

export default function sanitizeMiddleware(app) {
  app.use(sanitizeXSS);
}
