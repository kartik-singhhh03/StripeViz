/**
 * Stripe Checkout & Billing Routes
 * 
 * Handles:
 * - Checkout session creation (subscription + one-time)
 * - Billing portal access
 * - Subscription status
 * - Plan changes
 */

import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { getStripeInstance } from "../lib/stripe";
import { AuthRequest } from "../lib/middleware";
import { auditLog } from "../lib/security";
import {
  STRIPE_PRICES,
  PLANS,
  getPriceId,
  getUserSubscription,
  createFreeSubscription,
  PlanType,
  BillingInterval,
} from "../lib/subscription";

const prisma = new PrismaClient();

const APP_URL = process.env.APP_URL || "http://localhost:8080";

// ========================
// CREATE CHECKOUT SESSION
// ========================

interface CheckoutBody {
  plan: "pro" | "business" | "lifetime";
  interval?: "monthly" | "yearly";
}

export const handleCreateCheckoutSession: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { plan, interval = "monthly" } = req.body as CheckoutBody;

    // Validate plan
    if (!["pro", "business", "lifetime"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Validate interval (not needed for lifetime)
    if (plan !== "lifetime" && !["monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ error: "Invalid billing interval" });
    }

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stripe = await getStripeInstance();
    let stripeCustomerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Create free subscription record with customer ID
      await createFreeSubscription(user.id, stripeCustomerId);
    }

    // Get the price ID
    const priceId = getPriceId(plan, plan === "lifetime" ? "lifetime" : interval as BillingInterval);
    
    if (!priceId || priceId.includes("placeholder")) {
      return res.status(500).json({ 
        error: "Stripe prices not configured. Please set STRIPE_PRICE_* environment variables." 
      });
    }

    // Determine checkout mode
    const isLifetime = plan === "lifetime";
    const mode: Stripe.Checkout.SessionCreateParams.Mode = isLifetime ? "payment" : "subscription";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${APP_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing?checkout=canceled`,
      metadata: {
        userId: user.id,
        plan,
        interval: isLifetime ? "lifetime" : interval,
      },
      // Allow promo codes
      allow_promotion_codes: true,
      // Collect billing address for tax
      billing_address_collection: "required",
      // For subscriptions, allow plan changes in portal
      ...(mode === "subscription" && {
        subscription_data: {
          metadata: {
            userId: user.id,
            plan,
            interval,
          },
        },
      }),
      // For one-time payments (lifetime)
      ...(mode === "payment" && {
        payment_intent_data: {
          metadata: {
            userId: user.id,
            plan: "lifetime",
            interval: "lifetime",
          },
        },
      }),
    });

    auditLog({
      action: "checkout_session_created",
      userId: req.userId,
      details: {
        sessionId: session.id,
        plan,
        interval: isLifetime ? "lifetime" : interval,
        mode,
        customerId: stripeCustomerId,
      },
    });

    // Return checkout URL for redirect
    res.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Checkout session error:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
};

// ========================
// CREATE BILLING PORTAL SESSION
// ========================

export const handleCreatePortalSession: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const subscription = await getUserSubscription(req.userId);

    if (!subscription.stripeCustomerId) {
      return res.status(400).json({ error: "No billing account found" });
    }

    // Lifetime users can't manage subscription (no recurring billing)
    if (subscription.isLifetime) {
      return res.status(400).json({ 
        error: "Lifetime plans don't have recurring billing to manage",
        isLifetime: true,
      });
    }

    const stripe = await getStripeInstance();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${APP_URL}/dashboard`,
    });

    auditLog({
      action: "billing_portal_accessed",
      userId: req.userId,
      details: {
        customerId: subscription.stripeCustomerId,
      },
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Portal session error:", error);
    res.status(500).json({ error: error.message || "Failed to create portal session" });
  }
};

// ========================
// GET SUBSCRIPTION STATUS
// ========================

export const handleGetSubscriptionStatus: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const subscription = await getUserSubscription(req.userId);

    res.json({
      plan: subscription.plan,
      status: subscription.status,
      isActive: subscription.isActive,
      isPaid: subscription.isPaid,
      isLifetime: subscription.isLifetime,
      features: subscription.features.features,
      limits: subscription.features.limits,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canManageBilling: subscription.isPaid && !subscription.isLifetime,
    });
  } catch (error: any) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
};

// ========================
// VERIFY CHECKOUT SUCCESS
// ========================

export const handleVerifyCheckout: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "Session ID required" });
    }

    const stripe = await getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify session belongs to this user
    if (session.metadata?.userId !== req.userId) {
      return res.status(403).json({ error: "Session does not belong to this user" });
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      return res.status(400).json({ 
        error: "Payment not completed",
        status: session.payment_status,
      });
    }

    // Get updated subscription
    const subscription = await getUserSubscription(req.userId);

    res.json({
      success: true,
      plan: subscription.plan,
      isLifetime: subscription.isLifetime,
    });
  } catch (error: any) {
    console.error("Verify checkout error:", error);
    res.status(500).json({ error: "Failed to verify checkout" });
  }
};

// ========================
// GET PRICING INFO (Public)
// ========================

export const handleGetPricing: RequestHandler = async (_req, res) => {
  try {
    res.json({
      plans: {
        free: {
          ...PLANS.free,
          priceId: null,
        },
        pro: {
          ...PLANS.pro,
          priceIds: {
            monthly: STRIPE_PRICES.pro.monthly,
            yearly: STRIPE_PRICES.pro.yearly,
          },
        },
        business: {
          ...PLANS.business,
          priceIds: {
            monthly: STRIPE_PRICES.business.monthly,
            yearly: STRIPE_PRICES.business.yearly,
          },
        },
        lifetime: {
          ...PLANS.lifetime,
          priceId: STRIPE_PRICES.lifetime.oneTime,
          isLimited: true,
          remaining: 30, // TODO: Track actual remaining
        },
      },
    });
  } catch (error) {
    console.error("Get pricing error:", error);
    res.status(500).json({ error: "Failed to get pricing" });
  }
};

// ========================
// CANCEL SUBSCRIPTION
// ========================

export const handleCancelSubscription: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const subscription = await getUserSubscription(req.userId);

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: "No active subscription to cancel" });
    }

    if (subscription.isLifetime) {
      return res.status(400).json({ error: "Lifetime plans cannot be canceled" });
    }

    const stripe = await getStripeInstance();

    // Cancel at period end (user keeps access until then)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    auditLog({
      action: "subscription_cancel_requested",
      userId: req.userId,
      details: {
        subscriptionId: subscription.stripeSubscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });

    res.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      cancelAt: subscription.currentPeriodEnd,
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: error.message || "Failed to cancel subscription" });
  }
};

// ========================
// REACTIVATE SUBSCRIPTION
// ========================

export const handleReactivateSubscription: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const subscription = await getUserSubscription(req.userId);

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: "No subscription to reactivate" });
    }

    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ error: "Subscription is not scheduled for cancellation" });
    }

    const stripe = await getStripeInstance();

    // Remove cancellation
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    auditLog({
      action: "subscription_reactivated",
      userId: req.userId,
      details: {
        subscriptionId: subscription.stripeSubscriptionId,
      },
    });

    res.json({
      success: true,
      message: "Subscription reactivated",
    });
  } catch (error: any) {
    console.error("Reactivate subscription error:", error);
    res.status(500).json({ error: error.message || "Failed to reactivate subscription" });
  }
};

// Legacy export for backward compatibility
export const handleUpgradeSubscription = handleCreateCheckoutSession;
export const handleGetCheckoutStatus = handleGetSubscriptionStatus;
