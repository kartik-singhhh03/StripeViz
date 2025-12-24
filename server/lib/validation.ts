/**
 * Zod Validation Schemas
 * 
 * Centralized validation for all API endpoints.
 * These schemas enforce strict input validation to prevent injection attacks.
 */

import { z } from "zod";

// ========================
// COMMON VALIDATORS
// ========================

// Safe string that doesn't allow HTML/script injection
export const safeString = z.string().transform((val) => 
  val.replace(/[<>]/g, "").trim()
);

// Email with additional validation
export const email = z.string().email().max(255).toLowerCase();

// Strong password requirements
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

// UUID validation
export const uuid = z.string().uuid();

// Stripe key validation
export const stripeSecretKey = z
  .string()
  .regex(/^sk_(test|live)_[a-zA-Z0-9]+$/, "Invalid Stripe secret key format")
  .min(20)
  .max(200);

// Plan validation
export const planType = z.enum(["free", "pro"]);

// Date string validation
export const dateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  "Invalid date format"
);

// Positive integer
export const positiveInt = z.number().int().positive();

// Non-negative number
export const nonNegativeNumber = z.number().min(0);

// ========================
// AUTH SCHEMAS
// ========================

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, "Password is required").max(128),
});

export const signupSchema = z.object({
  email: email,
  password: password,
  name: safeString.pipe(z.string().min(1, "Name is required").max(100)),
});

export const resetPasswordSchema = z.object({
  email: email,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

// ========================
// STRIPE SCHEMAS
// ========================

export const connectStripeSchema = z.object({
  apiKey: stripeSecretKey,
});

export const upgradeSubscriptionSchema = z.object({
  plan: planType,
});

export const checkoutSchema = z.object({
  priceId: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// ========================
// EXPORT SCHEMAS
// ========================

export const exportQuerySchema = z.object({
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  format: z.enum(["csv", "json"]).default("csv"),
});

// ========================
// METRICS SCHEMAS
// ========================

export const metricsQuerySchema = z.object({
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  period: z.enum(["7d", "30d", "90d", "1y"]).optional(),
});

// ========================
// WEBHOOK SCHEMAS
// ========================

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
});

// ========================
// USER SCHEMAS
// ========================

export const updateUserSchema = z.object({
  name: safeString.pipe(z.string().min(1).max(100)).optional(),
  email: email.optional(),
});

export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  timezone: z.string().max(50).optional(),
});

// ========================
// PAGINATION SCHEMAS
// ========================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ========================
// SEARCH/FILTER SCHEMAS
// ========================

export const searchSchema = z.object({
  query: safeString.pipe(z.string().max(200)).optional(),
  filters: z.record(z.string()).optional(),
});

export const customerSearchSchema = paginationSchema.extend({
  search: safeString.pipe(z.string().max(200)).optional(),
  status: z.enum(["active", "inactive", "all"]).default("all"),
});

export const invoiceSearchSchema = paginationSchema.extend({
  search: safeString.pipe(z.string().max(200)).optional(),
  status: z.enum(["paid", "open", "void", "uncollectible", "all"]).default("all"),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
});

// ========================
// OAUTH SCHEMAS
// ========================

export const oauthCallbackSchema = z.object({
  code: z.string().min(1).max(500),
  state: z.string().min(1).max(200),
});

// ========================
// VALIDATION HELPERS
// ========================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ConnectStripeInput = z.infer<typeof connectStripeSchema>;
export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;
export type InvoiceSearchInput = z.infer<typeof invoiceSearchSchema>;

/**
 * Safe parse with error transformation
 * Returns a standardized error format
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Create user-friendly error message
  const firstError = result.error.issues[0];
  const errorMessage = firstError 
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "Validation failed";
  
  return {
    success: false,
    error: errorMessage,
    details: result.error.issues,
  };
}

/**
 * Middleware factory for Zod validation
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any): void => {
    const result = safeParse(schema, req.body);
    
    if (result.success === false) {
      res.status(400).json({
        error: "Validation failed",
        message: result.error,
        details: result.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
      return;
    }
    
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any): void => {
    const result = safeParse(schema, req.query);
    
    if (result.success === false) {
      res.status(400).json({
        error: "Validation failed",
        message: result.error,
        details: result.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
      return;
    }
    
    req.query = result.data;
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any): void => {
    const result = safeParse(schema, req.params);
    
    if (result.success === false) {
      res.status(400).json({
        error: "Validation failed",
        message: result.error,
        details: result.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
      return;
    }
    
    req.params = result.data;
    next();
  };
}
