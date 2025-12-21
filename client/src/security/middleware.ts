// Security middleware for API requests
import { NextRequest, NextResponse } from "next/server";
import { rateLimiter, validateCSRFToken, securityHeaders } from "./utils";

// Rate limiting middleware
export const rateLimitMiddleware = (
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000,
) => {
  return (req: NextRequest) => {
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!rateLimiter.isAllowed(identifier, limit, windowMs)) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            ...securityHeaders,
            "Retry-After": "60",
          },
        },
      );
    }

    return null; // Continue to next middleware
  };
};

// CSRF protection middleware
export const csrfMiddleware = (req: NextRequest) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return null; // Skip CSRF for safe methods
  }

  const token = req.headers.get("x-csrf-token");
  const sessionToken = req.cookies.get("csrf-token")?.value;

  if (!token || !sessionToken || !validateCSRFToken(token, sessionToken)) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      {
        status: 403,
        headers: securityHeaders,
      },
    );
  }

  return null; // Continue to next middleware
};

// Security headers middleware
export const securityHeadersMiddleware = (response: NextResponse) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });

  return response;
};

// Input validation middleware
export const inputValidationMiddleware = (req: NextRequest) => {
  const contentType = req.headers.get("content-type");

  // Validate content type for POST/PUT requests
  if (
    (req.method === "POST" || req.method === "PUT") &&
    !contentType?.includes("application/json") &&
    !contentType?.includes("multipart/form-data")
  ) {
    return NextResponse.json(
      { error: "Invalid content type" },
      {
        status: 400,
        headers: securityHeaders,
      },
    );
  }

  return null; // Continue to next middleware
};

// Authentication middleware
export const authMiddleware = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authorization required" },
      {
        status: 401,
        headers: securityHeaders,
      },
    );
  }

  const token = authHeader.substring(7);

  // Add your JWT validation logic here
  try {
    // const decoded = verifyJWT(token);
    // if (!decoded) {
    //   throw new Error('Invalid token');
    // }

    // Add user info to request for downstream use
    // req.user = decoded;

    return null; // Continue to next middleware
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid authentication token" },
      {
        status: 401,
        headers: securityHeaders,
      },
    );
  }
};

// CORS middleware
export const corsMiddleware = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? ["https://yourdomain.com"]
      : ["http://localhost:3000", "http://localhost:5173"];

  if (origin && allowedOrigins.includes(origin)) {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token",
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      return response;
    }
  }

  return null; // Continue to next middleware
};

// Combined security middleware
export const securityMiddleware = async (req: NextRequest) => {
  // Apply CORS middleware first
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware()(req);
  if (rateLimitResponse) return rateLimitResponse;

  // Apply input validation
  const validationResponse = inputValidationMiddleware(req);
  if (validationResponse) return validationResponse;

  // Apply CSRF protection
  const csrfResponse = csrfMiddleware(req);
  if (csrfResponse) return csrfResponse;

  // Apply authentication (for protected routes)
  if (req.nextUrl.pathname.startsWith("/api/protected")) {
    const authResponse = authMiddleware(req);
    if (authResponse) return authResponse;
  }

  return null; // Continue to the actual handler
};

export default {
  rateLimitMiddleware,
  csrfMiddleware,
  securityHeadersMiddleware,
  inputValidationMiddleware,
  authMiddleware,
  corsMiddleware,
  securityMiddleware,
};
