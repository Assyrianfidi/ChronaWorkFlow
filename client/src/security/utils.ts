// Security utilities for XSS protection and sanitization
import DOMPurify from "dompurify";

// XSS protection utilities
export const sanitizeHTML = (dirty: string): string => {
  if (typeof window !== "undefined" && DOMPurify) {
    return DOMPurify.sanitize(dirty);
  }
  // Basic server-side sanitization fallback
  return dirty
    .replace(/\<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\>/gi, "")
    .replace(/\<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Content Security Policy
export const cspHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.example.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// CSRF protection
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

export const validateCSRFToken = (
  token: string,
  sessionToken: string,
): boolean => {
  return token === sessionToken;
};

// Rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const rateLimiter = {
  isAllowed: (identifier: string, limit: number, windowMs: number): boolean => {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count++;
    return true;
  },

  cleanup: (): void => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  },
};

// Data masking utilities
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  if (username.length <= 2) {
    return email;
  }
  const maskedUsername =
    username.substring(0, 2) + "*".repeat(username.length - 2);
  return maskedUsername + "@" + domain;
};

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 4) {
    return phone;
  }
  const last4 = cleaned.slice(-4);
  return "*".repeat(cleaned.length - 4) + last4;
};

export const maskSSN = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length !== 9) {
    return ssn;
  }
  return "***-**-" + cleaned.slice(-4);
};

export const maskCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, "");
  if (cleaned.length < 4) {
    return cardNumber;
  }
  const last4 = cleaned.slice(-4);
  return "*".repeat(Math.max(0, cleaned.length - 4)) + last4;
};

// Security validation
export const isValidURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

// Security headers for API responses
export const securityHeaders = {
  ...cspHeaders,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "production" ? "https://yourdomain.com" : "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export default {
  sanitizeHTML,
  sanitizeInput,
  escapeHtml,
  cspHeaders,
  generateCSRFToken,
  validateCSRFToken,
  rateLimiter,
  maskEmail,
  maskPhone,
  maskSSN,
  maskCreditCard,
  isValidURL,
  sanitizeFileName,
  securityHeaders,
};
