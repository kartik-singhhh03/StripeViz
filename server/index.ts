import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import { handleSignup } from "./routes/signup";
import { handleLogin } from "./routes/login";
import { handleGetUser } from "./routes/user";
import { authMiddleware } from "./lib/middleware";
import { handleStripeWebhook } from "./routes/stripe-webhook";
import { handleStripeOAuthCallback, handleGetStripeConnectUrl } from "./routes/stripe-connect";
import { handleGetMetrics } from "./routes/metrics";
import { getMetrics } from "./routes/metrics-new";
import { connectStripeWithKey } from "./routes/stripe-key-connect";
import { getCurrentUser } from "./routes/auth";
import { getCustomers } from "./routes/customers";
import { getInvoices } from "./routes/invoices";
import { getAnalytics } from "./routes/analytics";
import { initiateGoogleOAuth, handleGoogleCallback } from "./routes/oauth-google";
import { initiateGitHubOAuth, handleGitHubCallback } from "./routes/oauth-github";
import {
  handleCreateCheckoutSession,
  handleCreatePortalSession,
  handleGetSubscriptionStatus,
  handleVerifyCheckout,
  handleGetPricing,
  handleCancelSubscription,
  handleReactivateSubscription,
} from "./routes/stripe-checkout";
import {
  exportInvoices,
  exportPayments,
  exportSubscriptions,
  exportRevenue,
  checkExportAccess,
} from "./routes/export";
import { requireProPlan } from "./lib/subscription";

// Security imports
import {
  securityHeaders,
  requestIdMiddleware,
  sanitizeInput,
  ipBlockMiddleware,
  authRateLimiter,
  apiRateLimiter,
  webhookRateLimiter,
  exportRateLimiter,
  errorHandler,
  getCsrfToken,
  createAuditMiddleware,
} from "./lib/security";
import {
  validateBody,
  validateQuery,
  loginSchema,
  signupSchema,
  connectStripeSchema,
  upgradeSubscriptionSchema,
  exportQuerySchema,
} from "./lib/validation";

export function createServer() {
  const app = express();

  // ========================
  // SECURITY: First layer - IP blocking & request tracking
  // ========================
  app.use(requestIdMiddleware);
  app.use(ipBlockMiddleware);
  app.use(securityHeaders);

  // Trust proxy for rate limiting (if behind load balancer)
  app.set("trust proxy", 1);

  // ========================
  // STRIPE WEBHOOK - Must be before body parsers for raw body access
  // ========================
  app.post(
    "/api/stripe/webhook",
    webhookRateLimiter,
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  // ========================
  // Session middleware for OAuth state management
  // ========================
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
      resave: false,
      saveUninitialized: true, // Need to save for OAuth state
      name: isProduction ? "__Host-session" : "session", // __Host- requires HTTPS
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 10 * 60 * 1000, // 10 minutes (only for OAuth flow)
        sameSite: isProduction ? "strict" : "lax", // Lax needed for OAuth redirects in dev
        path: "/",
      },
    })
  );

  // ========================
  // CORS configuration - Strict origin control
  // ========================
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:8080",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // In development, allow localhost on any port
        if (!isProduction && origin?.startsWith("http://localhost:")) {
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Request-ID"],
      exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
      maxAge: 86400, // 24 hours
    })
  );

  // ========================
  // Body parsing & sanitization
  // ========================
  app.use(express.json({ limit: "10kb" })); // Limit body size
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(sanitizeInput); // Sanitize all inputs

  // ========================
  // Global API rate limiter
  // ========================
  app.use("/api/", apiRateLimiter);

  // CSRF token endpoint
  app.get("/api/csrf-token", getCsrfToken);

  // ========================
  // Auth routes - with specific rate limiting
  // ========================
  app.post("/api/auth/signup", authRateLimiter, validateBody(signupSchema), handleSignup);
  app.post("/api/auth/login", authRateLimiter, validateBody(loginSchema), handleLogin);
  app.get("/api/auth/me", authMiddleware, getCurrentUser);

  // OAuth routes (Google)
  app.get("/api/auth/google", authRateLimiter, initiateGoogleOAuth);
  app.get("/api/auth/google/callback", authRateLimiter, handleGoogleCallback);

  // OAuth routes (GitHub)
  app.get("/api/auth/github", authRateLimiter, initiateGitHubOAuth);
  app.get("/api/auth/github/callback", authRateLimiter, handleGitHubCallback);

  // ========================
  // Stripe routes - with validation
  // ========================
  app.post(
    "/api/stripe/connect",
    authMiddleware,
    createAuditMiddleware("stripe_connect"),
    validateBody(connectStripeSchema),
    connectStripeWithKey
  );
  app.get("/api/stripe/connect-url", authMiddleware, handleGetStripeConnectUrl);
  app.get("/api/stripe/oauth-callback", authMiddleware, handleStripeOAuthCallback);
  
  // Checkout & Billing routes
  app.post("/api/stripe/checkout", authMiddleware, createAuditMiddleware("checkout_create"), handleCreateCheckoutSession);
  app.post("/api/stripe/portal", authMiddleware, createAuditMiddleware("portal_access"), handleCreatePortalSession);
  app.get("/api/stripe/subscription", authMiddleware, handleGetSubscriptionStatus);
  app.get("/api/stripe/verify-checkout", authMiddleware, handleVerifyCheckout);
  app.post("/api/stripe/cancel", authMiddleware, createAuditMiddleware("subscription_cancel"), handleCancelSubscription);
  app.post("/api/stripe/reactivate", authMiddleware, createAuditMiddleware("subscription_reactivate"), handleReactivateSubscription);
  
  // Public pricing endpoint
  app.get("/api/pricing", handleGetPricing);

  // ========================
  // Metrics routes
  // ========================
  app.get("/api/metrics", authMiddleware, getMetrics);
  app.get("/api/customers", authMiddleware, getCustomers);
  app.get("/api/invoices", authMiddleware, getInvoices);
  app.get("/api/analytics", authMiddleware, getAnalytics);

  // ========================
  // Export routes (Pro feature) - with rate limiting & plan check
  // ========================
  app.get("/api/export/invoices", authMiddleware, requireProPlan, exportRateLimiter, validateQuery(exportQuerySchema), exportInvoices);
  app.get("/api/export/payments", authMiddleware, requireProPlan, exportRateLimiter, validateQuery(exportQuerySchema), exportPayments);
  app.get("/api/export/subscriptions", authMiddleware, requireProPlan, exportRateLimiter, validateQuery(exportQuerySchema), exportSubscriptions);
  app.get("/api/export/revenue", authMiddleware, requireProPlan, exportRateLimiter, validateQuery(exportQuerySchema), exportRevenue);
  app.get("/api/export/access", authMiddleware, checkExportAccess);

  // ========================
  // Public routes
  // ========================
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ========================
  // Error handler - must be last
  // ========================
  app.use(errorHandler);

  return app;
}
