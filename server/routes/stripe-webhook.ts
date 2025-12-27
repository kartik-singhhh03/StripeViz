/**
 * Stripe Webhook Handler
 * 
 * Production-ready webhook processing for:
 * - checkout.session.completed (subscription & one-time payments)
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * 
 * Security:
 * - Signature verification (MANDATORY)
 * - Idempotency via event ID tracking
 * - DB is source of truth
 */

import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { auditLog, recordSuspiciousActivity } from "../lib/security";
import { config, isFeatureEnabled } from "../lib/env";
import {
  upsertSubscription,
  updateSubscriptionFromStripe,
  findSubscriptionByCustomerId,
  findSubscriptionByStripeId,
  downgradeToFree,
  markCanceledAtPeriodEnd,
  getPlanFromPriceId,
  PlanType,
  BillingInterval,
  SubscriptionStatus,
} from "../lib/subscription";

const prisma = new PrismaClient();

// Webhook secret for signature verification
const WEBHOOK_SECRET = config.stripe.webhookSecret;

// Helper to get Stripe instance
function getStripe(): Stripe {
  if (!isFeatureEnabled('stripe')) {
    throw new Error("Stripe is not configured");
  }
  return new Stripe(config.stripe.secretKey, {
    apiVersion: "2025-12-15.clover",
  });
}

// Track processed events for idempotency
const processedEvents = new Set<string>();
const EVENT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup old events periodically
setInterval(() => {
  processedEvents.clear();
}, EVENT_CACHE_TTL);

// ========================
// MAIN WEBHOOK HANDLER
// ========================

export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  // Security: Require signature
  if (!sig) {
    console.warn("[SECURITY] Webhook request missing signature");
    recordSuspiciousActivity(req.ip || "unknown");
    return res.status(400).json({ error: "Missing signature" });
  }

  // Security: Require webhook secret
  if (!WEBHOOK_SECRET) {
    console.error("[CRITICAL] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();

    // CRITICAL: Use raw body for signature verification
    const rawBody = req.body;
    
    if (!Buffer.isBuffer(rawBody)) {
      console.error("[SECURITY] Webhook body is not a Buffer - check middleware order");
      return res.status(400).json({ error: "Invalid request body" });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);

    // Log successful webhook receipt
    auditLog({
      action: "stripe_webhook_received",
      ip: req.ip,
      details: {
        eventType: event.type,
        eventId: event.id,
      },
    });
  } catch (err: any) {
    console.error("[SECURITY] Webhook signature verification failed:", err.message);
    recordSuspiciousActivity(req.ip || "unknown");
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Idempotency: Skip already processed events
  if (processedEvents.has(event.id)) {
    console.log(`[WEBHOOK] Skipping duplicate event: ${event.id}`);
    return res.json({ received: true, duplicate: true });
  }

  try {
    // Process event based on type
    switch (event.type) {
      // ========================
      // CHECKOUT COMPLETED
      // ========================
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // ========================
      // SUBSCRIPTION EVENTS
      // ========================
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // ========================
      // INVOICE EVENTS
      // ========================
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // ========================
      // OTHER EVENTS
      // ========================
      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    processedEvents.add(event.id);
    
    res.json({ received: true });
  } catch (error: any) {
    console.error(`[WEBHOOK] Processing error for ${event.type}:`, error);
    // Return 200 to prevent Stripe retries for unrecoverable errors
    res.json({ received: true, error: error.message });
  }
};

// ========================
// CHECKOUT COMPLETED
// ========================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[WEBHOOK] Processing checkout.session.completed: ${session.id}`);

  const userId = session.metadata?.userId;
  const planFromMetadata = session.metadata?.plan as PlanType | undefined;
  const intervalFromMetadata = session.metadata?.interval as BillingInterval | undefined;

  if (!userId) {
    console.error("[WEBHOOK] No userId in checkout session metadata");
    return;
  }

  const customerId = typeof session.customer === "string" 
    ? session.customer 
    : session.customer?.id;

  if (!customerId) {
    console.error("[WEBHOOK] No customer ID in checkout session");
    return;
  }

  // Handle one-time payment (Lifetime)
  if (session.mode === "payment") {
    console.log(`[WEBHOOK] Processing lifetime purchase for user: ${userId}`);

    await upsertSubscription({
      userId,
      stripeCustomerId: customerId,
      plan: "lifetime",
      interval: "lifetime",
      status: "active",
      isLifetime: true,
    });

    auditLog({
      action: "lifetime_purchase_completed",
      userId,
      details: {
        sessionId: session.id,
        customerId,
        amount: session.amount_total,
      },
    });

    console.log(`[WEBHOOK] User ${userId} upgraded to lifetime`);
    return;
  }

  // Handle subscription checkout
  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

    // Get full subscription details from Stripe
    const stripe = getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

    // Get plan from price ID
    const priceId = stripeSubscription.items.data[0]?.price.id;
    const planInfo = priceId ? getPlanFromPriceId(priceId) : null;
    const plan = planInfo?.plan || planFromMetadata || "pro";
    const interval = planInfo?.interval || intervalFromMetadata || "monthly";

    await upsertSubscription({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      plan,
      interval,
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start * 1000) : undefined,
      currentPeriodEnd: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : undefined,
    });

    auditLog({
      action: "subscription_checkout_completed",
      userId,
      details: {
        sessionId: session.id,
        subscriptionId,
        plan,
        interval,
      },
    });

    console.log(`[WEBHOOK] User ${userId} subscribed to ${plan} (${interval})`);
  }
}

// ========================
// SUBSCRIPTION CREATED
// ========================

async function handleSubscriptionCreated(subscription: any) {
  console.log(`[WEBHOOK] Processing subscription.created: ${subscription.id}`);

  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  // Find user by customer ID
  const existingSubscription = await findSubscriptionByCustomerId(customerId);

  if (!existingSubscription) {
    console.log(`[WEBHOOK] No subscription record found for customer: ${customerId}`);
    return;
  }

  const priceId = subscription.items?.data[0]?.price?.id;
  const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

  await updateSubscriptionFromStripe(subscription.id, {
    status: subscription.status as SubscriptionStatus,
    plan: planInfo?.plan,
    interval: planInfo?.interval,
    stripePriceId: priceId,
    currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
  });

  auditLog({
    action: "subscription_created",
    userId: existingSubscription.userId,
    details: {
      subscriptionId: subscription.id,
      status: subscription.status,
      plan: planInfo?.plan,
    },
  });

  console.log(`[WEBHOOK] Subscription created for user: ${existingSubscription.userId}`);
}

// ========================
// SUBSCRIPTION UPDATED
// ========================

async function handleSubscriptionUpdated(subscription: any) {
  console.log(`[WEBHOOK] Processing subscription.updated: ${subscription.id}`);

  const existingSubscription = await findSubscriptionByStripeId(subscription.id);

  if (!existingSubscription) {
    console.log(`[WEBHOOK] No subscription record found for: ${subscription.id}`);
    return;
  }

  const priceId = subscription.items?.data[0]?.price?.id;
  const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

  // Map Stripe status to our status
  let status: SubscriptionStatus = "active";
  if (subscription.status === "past_due") status = "past_due";
  else if (subscription.status === "canceled") status = "canceled";
  else if (subscription.status === "trialing") status = "trialing";
  else if (subscription.status === "incomplete") status = "incomplete";
  else if (subscription.status === "active") status = "active";

  await updateSubscriptionFromStripe(subscription.id, {
    status,
    plan: planInfo?.plan,
    interval: planInfo?.interval,
    stripePriceId: priceId,
    currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
  });

  auditLog({
    action: "subscription_updated",
    userId: existingSubscription.userId,
    details: {
      subscriptionId: subscription.id,
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: planInfo?.plan,
    },
  });

  console.log(`[WEBHOOK] Subscription updated for user: ${existingSubscription.userId}, status: ${status}`);
}

// ========================
// SUBSCRIPTION DELETED
// ========================

async function handleSubscriptionDeleted(subscription: any) {
  console.log(`[WEBHOOK] Processing subscription.deleted: ${subscription.id}`);

  const existingSubscription = await findSubscriptionByStripeId(subscription.id) as any;

  if (!existingSubscription) {
    console.log(`[WEBHOOK] No subscription record found for: ${subscription.id}`);
    return;
  }

  // Don't downgrade lifetime users
  if (existingSubscription.isLifetime) {
    console.log(`[WEBHOOK] Skipping downgrade for lifetime user: ${existingSubscription.userId}`);
    return;
  }

  // Downgrade to free
  await downgradeToFree(existingSubscription.userId);

  auditLog({
    action: "subscription_deleted",
    userId: existingSubscription.userId,
    details: {
      subscriptionId: subscription.id,
      downgradedToFree: true,
    },
  });

  console.log(`[WEBHOOK] User ${existingSubscription.userId} downgraded to free`);
}

// ========================
// INVOICE PAYMENT SUCCEEDED
// ========================

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`[WEBHOOK] Processing invoice.payment_succeeded: ${invoice.id}`);

  // Skip non-subscription invoices
  if (!invoice.subscription) {
    console.log(`[WEBHOOK] Invoice ${invoice.id} is not for a subscription`);
    return;
  }

  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription.id;

  const existingSubscription = await findSubscriptionByStripeId(subscriptionId);

  if (!existingSubscription) {
    console.log(`[WEBHOOK] No subscription found for: ${subscriptionId}`);
    return;
  }

  // Update status to active (in case it was past_due)
  await updateSubscriptionFromStripe(subscriptionId, {
    status: "active",
    currentPeriodEnd: invoice.lines?.data[0]?.period?.end 
      ? new Date(invoice.lines.data[0].period.end * 1000)
      : undefined,
  });

  auditLog({
    action: "invoice_payment_succeeded",
    userId: existingSubscription.userId,
    details: {
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_paid,
    },
  });

  console.log(`[WEBHOOK] Invoice paid for user: ${existingSubscription.userId}`);
}

// ========================
// INVOICE PAYMENT FAILED
// ========================

async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`[WEBHOOK] Processing invoice.payment_failed: ${invoice.id}`);

  if (!invoice.subscription) {
    return;
  }

  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription.id;

  const existingSubscription = await findSubscriptionByStripeId(subscriptionId);

  if (!existingSubscription) {
    console.log(`[WEBHOOK] No subscription found for: ${subscriptionId}`);
    return;
  }

  // Mark as past_due
  await updateSubscriptionFromStripe(subscriptionId, {
    status: "past_due",
  });

  auditLog({
    action: "invoice_payment_failed",
    userId: existingSubscription.userId,
    details: {
      invoiceId: invoice.id,
      subscriptionId,
      attemptCount: invoice.attempt_count,
    },
  });

  // TODO: Send email notification to user about failed payment

  console.log(`[WEBHOOK] Payment failed for user: ${existingSubscription.userId}, attempt: ${invoice.attempt_count}`);
}
