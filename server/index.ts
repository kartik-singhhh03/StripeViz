import "dotenv/config";
// IMPORTANT: Load env validation immediately after dotenv
import { config, logConfigStatus } from "./lib/env";

// ============================================
// Process-Level Error Handlers (Production Safety)
// ============================================

// Handle uncaught exceptions - log and exit gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION - Server shutting down...');
  console.error(error);
  // Give time for logging to complete
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // In production, you might want to exit here too
  // For now, just log - process continues
});

// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received - Graceful shutdown initiated...');
  // Close database connections, etc.
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received - Shutting down...');
  process.exit(0);
});

// Log config status on startup
logConfigStatus();

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

// NEW: Advanced features
import { handleWhatIfSimulation, handleBatchWhatIfSimulation } from "./routes/whatif";
import { 
  handleGetAlerts, 
  handleMarkAlertRead, 
  handleMarkAllAlertsRead,
  handleGetAlertPreferences,
  handleUpdateAlertPreferences 
} from "./routes/smart-alerts";
import {
  handleCreateSnapshot,
  handleGetPublicSnapshot,
  handleGetMySnapshot,
  handleDeleteSnapshot,
  handleUpdateSnapshotSettings
} from "./routes/public-snapshot";
import { handleGetBenchmarking, handleGetIndustryBenchmarks } from "./routes/benchmarking";

// Paddle payment routes
import paddleCheckoutRouter from "./routes/paddle-checkout";
import paddleWebhookRouter from "./routes/paddle-webhook";

// User settings routes
import userSettingsRouter from "./routes/user-settings";

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
  // CORS (MUST BE FIRST MIDDLEWARE)
  // ========================
  // Production allowed origins - SECURITY: Only allow known frontend domains
  const allowedOrigins = [
    // Primary production domain
    "https://stripeviz.kartikdev.me",
    // Legacy Vercel URL (fallback for staging/testing)
    "https://stripe-viz-app.vercel.app",
    // Backend API domain (for internal calls)
    "https://api.stripeviz.kartikdev.me",
    // Environment-configured frontend URL
    config.frontendUrl,
    // Development origins (only active in development)
    ...(config.isDevelopment ? [
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:5173",
    ] : []),
  ].filter(Boolean);

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all origins for easier testing
      if (config.isDevelopment) {
        console.warn(`[CORS] Allowing origin in development: ${origin}`);
        return callback(null, true);
      }

      // Production: Log blocked origin attempts for security monitoring
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Request-ID",
    ],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400,
  });

  app.use(corsMiddleware);
  // Note: app.options("*") removed - causes path-to-regexp v8 crash
  // CORS middleware already handles OPTIONS via app.use()

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
  // PADDLE WEBHOOK - Must be before body parsers for raw body access
  // ========================
  app.use(
    "/api/webhooks/paddle",
    webhookRateLimiter,
    express.json(), // Paddle sends JSON
    paddleWebhookRouter
  );

  // ========================
  // Session middleware for OAuth state management
  // ========================
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: true, // Need to save for OAuth state
      name: config.isProduction ? "__Host-session" : "session", // __Host- requires HTTPS
      cookie: {
        secure: config.isProduction,
        httpOnly: true,
        maxAge: 10 * 60 * 1000, // 10 minutes (only for OAuth flow)
        sameSite: config.isProduction ? "strict" : "lax", // Lax needed for OAuth redirects in dev
        path: "/",
      },
    })
  );

  

  // ========================
  // Body parsing & sanitization
  // ========================
  app.use(express.json({ limit: "10kb" })); // Limit body size
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(sanitizeInput); // Sanitze all inputs

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
  // What-If Simulator routes (Pro feature)
  // ========================
  app.post("/api/whatif/simulate", authMiddleware, requireProPlan, handleWhatIfSimulation);
  app.post("/api/whatif/batch", authMiddleware, requireProPlan, handleBatchWhatIfSimulation);

  // ========================
  // Smart Alerts routes (Pro feature)
  // ========================
  app.get("/api/alerts", authMiddleware, handleGetAlerts);
  app.post("/api/alerts/:id/read", authMiddleware, handleMarkAlertRead);
  app.post("/api/alerts/read-all", authMiddleware, handleMarkAllAlertsRead);
  app.get("/api/alerts/preferences", authMiddleware, requireProPlan, handleGetAlertPreferences);
  app.put("/api/alerts/preferences", authMiddleware, requireProPlan, handleUpdateAlertPreferences);

  // ========================
  // Public Snapshot routes (Pro feature)
  // ========================
  app.post("/api/snapshot/create", authMiddleware, requireProPlan, handleCreateSnapshot);
  app.get("/api/snapshot/mine", authMiddleware, handleGetMySnapshot);
  app.delete("/api/snapshot/:token", authMiddleware, handleDeleteSnapshot);
  app.put("/api/snapshot/:token/settings", authMiddleware, requireProPlan, handleUpdateSnapshotSettings);
  // Public endpoint (no auth)
  app.get("/api/snapshot/:token", handleGetPublicSnapshot);

  // ========================
  // Benchmarking routes (Pro feature)
  // ========================
  app.get("/api/benchmarking", authMiddleware, requireProPlan, handleGetBenchmarking);
  app.get("/api/benchmarking/industry", handleGetIndustryBenchmarks);

  // ========================
  // Paddle Payment routes
  // ========================
  app.use("/api/payments", paddleCheckoutRouter);

  // ========================
  // User Settings routes
  // ========================
  app.use("/api/user", userSettingsRouter);

  // ========================
  // Error handler - must be last
  // ========================
  app.use(errorHandler);

  return app;
}
