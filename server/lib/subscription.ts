/**
 * StripeViz Subscription Management
 * 
 * Production-ready subscription system with:
 * - Plan definitions and feature gating
 * - Stripe price mapping
 * - Access control utilities
 * - Middleware for route protection
 */

import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "./middleware";

const prisma = new PrismaClient();

// ========================
// TYPE DEFINITIONS
// ========================

export type PlanType = "free" | "pro" | "business" | "lifetime";
export type BillingInterval = "monthly" | "yearly" | "lifetime";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete";

export interface PlanFeatures {
  name: string;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    historyDays: number;       // -1 for unlimited
    exportsPerMonth: number;   // -1 for unlimited
    apiAccess: boolean;
    slackAlerts: boolean;
    multiMetricExports: boolean;
    prioritySupport: boolean;
    fasterSync: boolean;       // 5min vs 15min
  };
}

// ========================
// PLAN DEFINITIONS
// ========================

export const PLANS: Record<PlanType, PlanFeatures> = {
  free: {
    name: "free",
    displayName: "Free",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Connect 1 Stripe account",
      "Core dashboard (MRR, ARR, Active Subs)",
      "7-day data history",
      "Weekly summary (basic)",
      "Data freshness indicator",
      "Health status (simple)",
    ],
    limits: {
      historyDays: 7,
      exportsPerMonth: 0,
      apiAccess: false,
      slackAlerts: false,
      multiMetricExports: false,
      prioritySupport: false,
      fasterSync: false,
    },
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    price: { monthly: 29, yearly: 290 },
    features: [
      "Everything in Free",
      "Unlimited data history",
      "Weekly summary (full)",
      "Rule-based insights",
      "Health indicators (detailed)",
      "Failed payment monitoring",
      "CSV exports",
      "Date comparisons",
      "Priority email support",
    ],
    limits: {
      historyDays: -1,
      exportsPerMonth: -1,
      apiAccess: false,
      slackAlerts: false,
      multiMetricExports: false,
      prioritySupport: true,
      fasterSync: false,
    },
  },
  business: {
    name: "business",
    displayName: "Business",
    price: { monthly: 79, yearly: 790 },
    features: [
      "Everything in Pro",
      "Slack/Discord alerts",
      "Multi-metric exports",
      "API access (read-only)",
      "Faster sync frequency (5 min)",
      "Dedicated support",
    ],
    limits: {
      historyDays: -1,
      exportsPerMonth: -1,
      apiAccess: true,
      slackAlerts: true,
      multiMetricExports: true,
      prioritySupport: true,
      fasterSync: true,
    },
  },
  lifetime: {
    name: "lifetime",
    displayName: "Lifetime",
    price: { monthly: 99, yearly: 99 }, // One-time
    features: [
      "All Pro features forever",
      "Early adopter badge",
      "Locked-in pricing",
      "No recurring payments",
    ],
    limits: {
      historyDays: -1,
      exportsPerMonth: -1,
      apiAccess: false,
      slackAlerts: false,
      multiMetricExports: false,
      prioritySupport: true,
      fasterSync: false,
    },
  },
};

// ========================
// STRIPE PRICE IDS
// Configure these in your Stripe Dashboard first!
// ========================

export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_placeholder",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly_placeholder",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "price_business_monthly_placeholder",
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || "price_business_yearly_placeholder",
  },
  lifetime: {
    oneTime: process.env.STRIPE_PRICE_LIFETIME || "price_lifetime_placeholder",
  },
} as const;

// Reverse lookup: Price ID → Plan + Interval
export function getPlanFromPriceId(priceId: string): { plan: PlanType; interval: BillingInterval } | null {
  if (priceId === STRIPE_PRICES.pro.monthly) return { plan: "pro", interval: "monthly" };
  if (priceId === STRIPE_PRICES.pro.yearly) return { plan: "pro", interval: "yearly" };
  if (priceId === STRIPE_PRICES.business.monthly) return { plan: "business", interval: "monthly" };
  if (priceId === STRIPE_PRICES.business.yearly) return { plan: "business", interval: "yearly" };
  if (priceId === STRIPE_PRICES.lifetime.oneTime) return { plan: "lifetime", interval: "lifetime" };
  return null;
}

// Get price ID for plan + interval
export function getPriceId(plan: PlanType, interval: BillingInterval): string | null {
  if (plan === "pro" && interval === "monthly") return STRIPE_PRICES.pro.monthly;
  if (plan === "pro" && interval === "yearly") return STRIPE_PRICES.pro.yearly;
  if (plan === "business" && interval === "monthly") return STRIPE_PRICES.business.monthly;
  if (plan === "business" && interval === "yearly") return STRIPE_PRICES.business.yearly;
  if (plan === "lifetime") return STRIPE_PRICES.lifetime.oneTime;
  return null;
}

// ========================
// SUBSCRIPTION INFO
// ========================

export interface SubscriptionInfo {
  plan: PlanType;
  status: SubscriptionStatus;
  isActive: boolean;
  isPaid: boolean;
  isLifetime: boolean;
  features: PlanFeatures;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Get full subscription info for a user
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  }) as any;

  // Default to free if no subscription exists
  if (!subscription) {
    return {
      plan: "free",
      status: "active",
      isActive: true,
      isPaid: false,
      isLifetime: false,
      features: PLANS.free,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  const plan = subscription.plan as PlanType;
  const status = subscription.status as SubscriptionStatus;
  const isLifetime = subscription.isLifetime || false;
  
  // Active means: subscription is active OR lifetime (never expires)
  const isActive = isLifetime || status === "active" || status === "trialing";
  const isPaid = plan !== "free";

  // For lifetime users, use pro features
  const effectivePlan = isLifetime ? "pro" : plan;

  return {
    plan,
    status,
    isActive,
    isPaid,
    isLifetime,
    features: PLANS[effectivePlan] || PLANS.free,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId || null,
  };
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures["limits"]
): Promise<boolean> {
  const { isActive, features } = await getUserSubscription(userId);
  
  if (!isActive) return false;
  
  const value = features.limits[feature];
  
  // Boolean features
  if (typeof value === "boolean") return value;
  
  // Numeric features (-1 means unlimited, 0 means no access)
  return value !== 0;
}

/**
 * Check if user can access Pro features (Pro, Business, or Lifetime)
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  const { plan, isActive, isLifetime } = await getUserSubscription(userId);
  
  if (!isActive) return false;
  if (isLifetime) return true;
  
  return plan === "pro" || plan === "business";
}

/**
 * Check if user can access Business features
 */
export async function hasBusinessAccess(userId: string): Promise<boolean> {
  const { plan, isActive } = await getUserSubscription(userId);
  
  if (!isActive) return false;
  
  return plan === "business";
}

// ========================
// SUBSCRIPTION MANAGEMENT
// ========================

export interface CreateSubscriptionData {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  plan: PlanType;
  interval?: BillingInterval;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  isLifetime?: boolean;
}

/**
 * Create or update subscription in database
 */
export async function upsertSubscription(data: CreateSubscriptionData) {
  return prisma.subscription.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripePriceId: data.stripePriceId,
      plan: data.plan,
      interval: data.interval,
      status: data.status || "active",
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      isLifetime: data.isLifetime || false,
      lifetimePurchasedAt: data.isLifetime ? new Date() : null,
    },
    update: {
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripePriceId: data.stripePriceId,
      plan: data.plan,
      interval: data.interval,
      status: data.status || "active",
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      isLifetime: data.isLifetime || undefined,
      lifetimePurchasedAt: data.isLifetime ? new Date() : undefined,
    },
  });
}

/**
 * Create free subscription for new user
 */
export async function createFreeSubscription(userId: string, stripeCustomerId: string) {
  return prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId,
      plan: "free",
      status: "active",
    },
  });
}

/**
 * Downgrade user to free plan
 */
export async function downgradeToFree(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      plan: "free",
      status: "canceled",
      stripeSubscriptionId: null,
      stripePriceId: null,
      interval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
    },
  });
}

/**
 * Mark subscription as canceled at period end
 */
export async function markCanceledAtPeriodEnd(stripeSubscriptionId: string, cancelAtEnd: boolean) {
  // Use raw query until Prisma client is regenerated
  return (prisma.subscription.update as any)({
    where: { stripeSubscriptionId },
    data: {
      cancelAtPeriodEnd: cancelAtEnd,
    },
  });
}

/**
 * Update subscription from Stripe webhook data
 */
export async function updateSubscriptionFromStripe(
  stripeSubscriptionId: string,
  data: {
    status?: SubscriptionStatus;
    plan?: PlanType;
    interval?: BillingInterval;
    stripePriceId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
  }
) {
  // Use type assertion until Prisma client is regenerated
  return (prisma.subscription.update as any)({
    where: { stripeSubscriptionId },
    data,
  });
}

/**
 * Find subscription by Stripe customer ID
 */
export async function findSubscriptionByCustomerId(stripeCustomerId: string) {
  return prisma.subscription.findUnique({
    where: { stripeCustomerId },
    include: { user: true },
  });
}

/**
 * Find subscription by Stripe subscription ID
 */
export async function findSubscriptionByStripeId(stripeSubscriptionId: string) {
  // Use type assertion until Prisma client is regenerated
  return (prisma.subscription.findUnique as any)({
    where: { stripeSubscriptionId },
    include: { user: true },
  });
}

// ========================
// MIDDLEWARE
// ========================

/**
 * Middleware to check if user has an active subscription
 */
export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const subscription = await getUserSubscription(req.userId);

    if (!subscription.isActive) {
      res.status(402).json({ 
        error: "Subscription is not active", 
        plan: subscription.plan,
        status: subscription.status,
      });
      return;
    }

    // Attach subscription to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Middleware to require Pro or higher plan
 */
export const requireProPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const hasAccess = await hasProAccess(req.userId);

    if (!hasAccess) {
      res.status(403).json({ 
        error: "Pro plan required",
        upgrade: true,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Pro plan check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Middleware to require Business plan
 */
export const requireBusinessPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const hasAccess = await hasBusinessAccess(req.userId);

    if (!hasAccess) {
      res.status(403).json({ 
        error: "Business plan required",
        upgrade: true,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Business plan check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Extend AuthRequest to include subscription
declare global {
  namespace Express {
    interface Request {
      subscription?: SubscriptionInfo;
    }
  }
}
