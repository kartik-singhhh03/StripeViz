/**
 * Security Middleware & Utilities
 * 
 * Comprehensive security hardening for the SaaS application.
 * - Rate limiting
 * - CSRF protection
 * - Security headers
 * - Error masking
 * - Input sanitization
 */

import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import { config } from "./env";

// ========================
// RATE LIMITING
// ========================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (req: Request) => string;  // Custom key generator
  skipSuccessfulRequests?: boolean;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || "unknown",
    skipSuccessfulRequests = false,
    message = "Too many requests, please try again later.",
  } = options;

  // Clean up expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}`,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  keyGenerator: (req) => `api:${req.ip}`,
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // Webhooks can be burst-y
  keyGenerator: (req) => `webhook:${req.ip}`,
});

export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 exports per minute
  keyGenerator: (req: any) => `export:${req.userId || req.ip}`,
  message: "Export rate limit exceeded. Please wait before exporting again.",
});

// ========================
// CSRF PROTECTION
// ========================

const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const entry = csrfTokens.get(sessionId);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(entry.token),
    Buffer.from(token)
  );
}

export const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for:
  // - GET, HEAD, OPTIONS requests (safe methods)
  // - Webhook endpoints (use signature verification instead)
  // - API endpoints with Bearer token auth (token itself is CSRF protection)
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  // If using Bearer token auth, skip CSRF (the token IS the CSRF protection)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    next();
    return;
  }

  // For session-based auth, validate CSRF token
  const csrfToken = req.headers["x-csrf-token"] as string || req.body?._csrf;
  const sessionId = (req as any).sessionID;

  if (!sessionId || !csrfToken) {
    res.status(403).json({ error: "CSRF token missing" });
    return;
  }

  if (!validateCsrfToken(sessionId, csrfToken)) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }

  next();
};

// Endpoint to get CSRF token
export const getCsrfToken: RequestHandler = (req: Request, res: Response): void => {
  const sessionId = (req as any).sessionID;
  if (!sessionId) {
    res.status(400).json({ error: "No session" });
    return;
  }
  const token = generateCsrfToken(sessionId);
  res.json({ csrfToken: token });
};

// ========================
// SECURITY HEADERS
// ========================

export const securityHeaders: RequestHandler = (_req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy (disable unnecessary browser features)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(self)"
  );
  
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.paddle.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://accounts.google.com https://github.com https://api.paddle.com https://sandbox-api.paddle.com https://checkout.paddle.com https://sandbox-checkout.paddle.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.paddle.com https://sandbox-checkout.paddle.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  
  // HSTS (only in production with HTTPS)
  if (config.isProduction) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  
  next();
};

// ========================
// ERROR MASKING
// ========================

export interface SafeError {
  error: string;
  code?: string;
  requestId?: string;
}

// Generate unique request ID for tracking
export function generateRequestId(): string {
  return crypto.randomBytes(8).toString("hex");
}

// Safely mask errors - never expose internal details
export function maskError(error: unknown, requestId?: string): SafeError {
  // Log full error internally
  console.error(`[${requestId || "unknown"}] Internal error:`, error);

  // Known safe errors to expose
  if (error instanceof Error) {
    // Zod validation errors
    if (error.name === "ZodError") {
      return {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        requestId,
      };
    }

    // Prisma known errors
    if (error.message.includes("Unique constraint")) {
      return {
        error: "Resource already exists",
        code: "DUPLICATE_RESOURCE",
        requestId,
      };
    }

    if (error.message.includes("Record to update not found")) {
      return {
        error: "Resource not found",
        code: "NOT_FOUND",
        requestId,
      };
    }
  }

  // Default safe error
  return {
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
    requestId,
  };
}

// Error handler middleware
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req as any).requestId || generateRequestId();
  const safeError = maskError(err, requestId);
  
  // Determine status code
  let statusCode = 500;
  if (safeError.code === "VALIDATION_ERROR") statusCode = 400;
  if (safeError.code === "NOT_FOUND") statusCode = 404;
  if (safeError.code === "DUPLICATE_RESOURCE") statusCode = 409;
  
  res.status(statusCode).json(safeError);
};

// Request ID middleware
export const requestIdMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  (req as any).requestId = generateRequestId();
  next();
};

// ========================
// INPUT SANITIZATION
// ========================

// Sanitize string input - remove potential XSS vectors
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Sanitization middleware
export const sanitizeInput: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize request body (mutable)
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  // Note: req.query is read-only in Express 5+, sanitization handled by Zod validation
  // Query params are validated/sanitized at the route level via validateQuery middleware
  next();
};

// ========================
// SECURE COOKIE SETTINGS
// ========================

export const cookieSettings = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

// Set secure cookie
export function setSecureCookie(
  res: Response,
  name: string,
  value: string,
  options?: Partial<typeof cookieSettings>
): void {
  res.cookie(name, value, { ...cookieSettings, ...options });
}

// Clear secure cookie
export function clearSecureCookie(res: Response, name: string): void {
  res.clearCookie(name, { path: "/" });
}

// ========================
// IP BLOCKING
// ========================

const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

export function blockIP(ip: string): void {
  blockedIPs.add(ip);
}

export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
}

export function recordSuspiciousActivity(ip: string): void {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);
  
  // Auto-block after 10 suspicious activities
  if (count >= 10) {
    blockIP(ip);
    console.warn(`IP ${ip} auto-blocked due to suspicious activity`);
  }
}

export const ipBlockMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || "unknown";
  
  if (blockedIPs.has(ip)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  
  next();
};

// ========================
// WEBHOOK SIGNATURE VERIFICATION
// ========================

export function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(",");
    const signatureMap: Record<string, string> = {};
    
    for (const element of elements) {
      const [key, value] = element.split("=");
      signatureMap[key] = value;
    }
    
    const timestamp = signatureMap["t"];
    const v1Signature = signatureMap["v1"];
    
    if (!timestamp || !v1Signature) {
      return false;
    }
    
    // Check timestamp is within tolerance (5 minutes)
    const timestampAge = Date.now() / 1000 - parseInt(timestamp);
    if (Math.abs(timestampAge) > 300) {
      console.warn("Webhook timestamp too old");
      return false;
    }
    
    // Compute expected signature
    const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
    const signedPayload = `${timestamp}.${payloadString}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");
    
    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(v1Signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return false;
  }
}

// ========================
// AUDIT LOGGING
// ========================

interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// In production, send to a proper logging service
export function auditLog(entry: Omit<AuditLogEntry, "timestamp">): void {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  
  // Log to console (in production, send to logging service)
  console.log("[AUDIT]", JSON.stringify(logEntry));
}

// Audit middleware for sensitive routes
export function createAuditMiddleware(action: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    auditLog({
      action,
      userId: (req as any).userId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      details: {
        method: req.method,
        path: req.path,
      },
    });
    next();
  };
}
