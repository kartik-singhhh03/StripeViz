/**
 * Paddle Webhook Handler
 * Processes Paddle webhook events for subscription lifecycle management
 * 
 * SECURITY:
 * - All webhooks verified with HMAC signature (timing-safe)
 * - Idempotency: Duplicate events are rejected via event ID tracking
 * - Replay protection: Events older than 5 minutes are rejected
 * 
 * Handled Events:
 * - transaction.completed: Payment successful, activate subscription
 * - subscription.created: New subscription created
 * - subscription.updated: Subscription modified (plan change, renewal)
 * - subscription.canceled: Subscription canceled
 * - subscription.paused: Subscription paused
 * - subscription.resumed: Subscription resumed
 * - subscription.past_due: Payment failed, subscription at risk
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  verifyWebhookSignature, 
  parseWebhookHeaders,
  getPlanFromPriceId,
} from '../lib/paddle';
import { auditLog } from '../lib/security';
import { 
  sendSubscriptionConfirmationEmail, 
  sendSubscriptionCanceledEmail,
  sendPaymentFailedEmail 
} from '../lib/email';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// Idempotency & Replay Protection
// ============================================

// Track processed events to prevent duplicate processing
const processedEvents = new Map<string, number>();
const EVENT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_EVENT_AGE = 5 * 60 * 1000; // 5 minutes - reject events older than this

// Cleanup old events periodically
setInterval(() => {
  const now = Date.now();
  for (const [eventId, timestamp] of processedEvents) {
    if (now - timestamp > EVENT_CACHE_TTL) {
      processedEvents.delete(eventId);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

/**
 * Check if event was already processed (idempotency)
 */
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());
}

/**
 * Check if timestamp is within acceptable range (replay protection)
 */
function isTimestampValid(timestamp: string): boolean {
  const eventTime = parseInt(timestamp, 10) * 1000; // Paddle timestamp is in seconds
  const now = Date.now();
  
  // Reject events from the future or too old
  if (eventTime > now + 60000) { // Allow 1 minute clock skew
    console.error('[Paddle Webhook] Event timestamp is in the future');
    return false;
  }
  
  if (now - eventTime > MAX_EVENT_AGE) {
    console.error('[Paddle Webhook] Event is too old (replay attack?)');
    return false;
  }
  
  return true;
}

// Note: After adding new fields to schema.prisma, run `pnpm prisma generate`
// Until then, we use type assertions for the new Paddle fields

// ============================================
// Types for Paddle Webhook Events
// ============================================

interface PaddleWebhookEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: Record<string, unknown>;
}

interface TransactionData {
  id: string;
  status: string;
  customer_id: string;
  subscription_id?: string;
  items: Array<{
    price: {
      id: string;
      product_id: string;
    };
    quantity: number;
  }>;
  custom_data?: {
    userId?: string;
    plan?: string;
    billingCycle?: string;
  };
  details?: {
    totals: {
      total: string;
      currency_code: string;
    };
  };
}

interface SubscriptionData {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing';
  customer_id: string;
  items: Array<{
    price: {
      id: string;
      product_id: string;
    };
    quantity: number;
  }>;
  current_billing_period?: {
    starts_at: string;
    ends_at: string;
  };
  scheduled_change?: {
    action: 'cancel' | 'pause';
    effective_at: string;
  };
  canceled_at?: string;
  custom_data?: {
    userId?: string;
    plan?: string;
    billingCycle?: string;
  };
}

// ============================================
// Webhook Route
// ============================================

/**
 * POST /api/webhooks/paddle
 * Main webhook endpoint - receives all Paddle events
 * 
 * Security checks:
 * 1. Signature verification (HMAC-SHA256)
 * 2. Timestamp validation (replay attack prevention)
 * 3. Idempotency (duplicate event rejection)
 */
router.post('/', async (req: Request, res: Response) => {
  const requestIp = req.ip || 'unknown';
  
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    
    // SECURITY CHECK 1: Parse and verify signature headers
    const headers = parseWebhookHeaders(req.headers);
    if (!headers) {
      console.error('[Paddle Webhook] Missing signature headers');
      auditLog({
        action: 'paddle_webhook_rejected',
        ip: requestIp,
        details: { reason: 'missing_signature' },
      });
      return res.status(400).json({ error: 'Missing signature' });
    }

    // SECURITY CHECK 2: Validate timestamp (replay attack prevention)
    if (!isTimestampValid(headers.timestamp)) {
      console.error('[Paddle Webhook] Invalid timestamp - possible replay attack');
      auditLog({
        action: 'paddle_webhook_rejected',
        ip: requestIp,
        details: { reason: 'invalid_timestamp', timestamp: headers.timestamp },
      });
      return res.status(400).json({ error: 'Invalid timestamp' });
    }

    // SECURITY CHECK 3: Verify signature
    const isValid = verifyWebhookSignature(rawBody, headers.signature, headers.timestamp);
    if (!isValid) {
      console.error('[Paddle Webhook] Invalid signature');
      auditLog({
        action: 'paddle_webhook_rejected',
        ip: requestIp,
        details: { reason: 'invalid_signature' },
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse event
    const event = req.body as PaddleWebhookEvent;
    
    // SECURITY CHECK 4: Idempotency - check for duplicate events
    if (isEventProcessed(event.event_id)) {
      console.log(`[Paddle Webhook] Duplicate event ignored: ${event.event_id}`);
      // Return 200 to acknowledge - Paddle should not retry
      return res.status(200).json({ received: true, duplicate: true });
    }
    
    console.log(`[Paddle Webhook] Processing: ${event.event_type}`, { eventId: event.event_id });
    
    auditLog({
      action: 'paddle_webhook_received',
      ip: requestIp,
      details: { eventType: event.event_type, eventId: event.event_id },
    });

    // Route to appropriate handler
    switch (event.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(event.data as unknown as TransactionData);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(event.data as unknown as SubscriptionData);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data as unknown as SubscriptionData);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data as unknown as SubscriptionData);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(event.data as unknown as SubscriptionData);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(event.data as unknown as SubscriptionData);
        break;

      case 'subscription.past_due':
        await handleSubscriptionPastDue(event.data as unknown as SubscriptionData);
        break;

      default:
        console.log(`[Paddle Webhook] Unhandled event type: ${event.event_type}`);
    }

    // Mark event as processed for idempotency
    markEventProcessed(event.event_id);

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('[Paddle Webhook] Processing error:', error);
    auditLog({
      action: 'paddle_webhook_error',
      ip: requestIp,
      details: { error: String(error) },
    });
    // Return 200 anyway to prevent retries for processing errors
    // Log error for debugging but acknowledge receipt
    res.status(200).json({ received: true, error: 'Processing error logged' });
  }
});

// ============================================
// Event Handlers
// ============================================

/**
 * Handle successful transaction (payment completed)
 * This is where we activate subscriptions after payment
 */
async function handleTransactionCompleted(data: TransactionData): Promise<void> {
  console.log('[Paddle] Transaction completed:', data.id);

  // Get user ID from custom data (passthrough)
  const userId = data.custom_data?.userId;
  if (!userId) {
    console.error('[Paddle] No userId in transaction custom_data');
    return;
  }

  // Get price info
  const priceId = data.items[0]?.price?.id;
  if (!priceId) {
    console.error('[Paddle] No price ID in transaction');
    return;
  }

  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) {
    console.error('[Paddle] Unknown price ID:', priceId);
    return;
  }

  // Update or create subscription record (use any for new fields until Prisma is regenerated)
  await (prisma.subscription.upsert as any)({
    where: { userId },
    update: {
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.subscription_id || null,
      paddlePriceId: priceId,
      plan: planInfo.plan,
      billingCycle: planInfo.billingCycle,
      status: 'active',
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
    create: {
      userId,
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.subscription_id || null,
      paddlePriceId: priceId,
      plan: planInfo.plan,
      billingCycle: planInfo.billingCycle,
      status: 'active',
    },
  });

  console.log(`[Paddle] Subscription activated for user ${userId}: ${planInfo.plan}/${planInfo.billingCycle}`);
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(data: SubscriptionData): Promise<void> {
  console.log('[Paddle] Subscription created:', data.id);

  const userId = data.custom_data?.userId;
  const priceId = data.items[0]?.price?.id;
  
  if (!userId || !priceId) {
    console.error('[Paddle] Missing userId or priceId in subscription data');
    return;
  }

  const planInfo = getPlanFromPriceId(priceId);
  if (!planInfo) return;

  // Get user email for notification
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

  await (prisma.subscription.upsert as any)({
    where: { userId },
    update: {
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.id,
      paddlePriceId: priceId,
      plan: planInfo.plan,
      billingCycle: planInfo.billingCycle,
      status: data.status,
      currentPeriodStart: data.current_billing_period?.starts_at 
        ? new Date(data.current_billing_period.starts_at) 
        : null,
      currentPeriodEnd: data.current_billing_period?.ends_at 
        ? new Date(data.current_billing_period.ends_at) 
        : null,
    },
    create: {
      userId,
      paddleCustomerId: data.customer_id,
      paddleSubscriptionId: data.id,
      paddlePriceId: priceId,
      plan: planInfo.plan,
      billingCycle: planInfo.billingCycle,
      status: data.status,
      currentPeriodStart: data.current_billing_period?.starts_at 
        ? new Date(data.current_billing_period.starts_at) 
        : null,
      currentPeriodEnd: data.current_billing_period?.ends_at 
        ? new Date(data.current_billing_period.ends_at) 
        : null,
    },
  });

  // Send confirmation email (non-blocking)
  if (user?.email) {
    sendSubscriptionConfirmationEmail(user.email, planInfo.plan, planInfo.billingCycle).catch((err) => {
      console.error('[Paddle] Failed to send subscription email:', err);
    });
  }
}

/**
 * Handle subscription updated event (renewals, plan changes)
 */
async function handleSubscriptionUpdated(data: SubscriptionData): Promise<void> {
  console.log('[Paddle] Subscription updated:', data.id);

  // Find subscription by Paddle ID (use any until Prisma is regenerated)
  const subscription = await (prisma.subscription.findFirst as any)({
    where: { paddleSubscriptionId: data.id },
  });

  if (!subscription) {
    console.error('[Paddle] Subscription not found for update:', data.id);
    return;
  }

  const priceId = data.items[0]?.price?.id;
  const planInfo = priceId ? getPlanFromPriceId(priceId) : null;

  await (prisma.subscription.update as any)({
    where: { id: subscription.id },
    data: {
      status: data.status,
      ...(planInfo && {
        plan: planInfo.plan,
        billingCycle: planInfo.billingCycle,
        paddlePriceId: priceId,
      }),
      currentPeriodStart: data.current_billing_period?.starts_at 
        ? new Date(data.current_billing_period.starts_at) 
        : subscription.currentPeriodStart,
      currentPeriodEnd: data.current_billing_period?.ends_at 
        ? new Date(data.current_billing_period.ends_at) 
        : subscription.currentPeriodEnd,
      cancelAtPeriodEnd: !!data.scheduled_change?.action,
    },
  });
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(data: SubscriptionData): Promise<void> {
  console.log('[Paddle] Subscription canceled:', data.id);

  const subscription = await (prisma.subscription.findFirst as any)({
    where: { paddleSubscriptionId: data.id },
    include: { user: { select: { email: true } } },
  });

  if (!subscription) {
    console.error('[Paddle] Subscription not found for cancellation:', data.id);
    return;
  }

  const endDate = subscription.currentPeriodEnd || new Date();

  await (prisma.subscription.update as any)({
    where: { id: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: data.canceled_at ? new Date(data.canceled_at) : new Date(),
      // Downgrade to free plan after cancellation takes effect
      plan: 'free',
      billingCycle: null,
    },
  });

  // Send cancellation email (non-blocking)
  if (subscription.user?.email) {
    sendSubscriptionCanceledEmail(subscription.user.email, new Date(endDate)).catch((err) => {
      console.error('[Paddle] Failed to send cancellation email:', err);
    });
  }

  console.log(`[Paddle] Subscription canceled for user ${subscription.userId}`);
}

/**
 * Handle subscription paused event
 */
async function handleSubscriptionPaused(data: SubscriptionData): Promise<void> {
  console.log('[Paddle] Subscription paused:', data.id);

  await (prisma.subscription.updateMany as any)({
    where: { paddleSubscriptionId: data.id },
    data: {
      status: 'paused',
    },
  });
}

/**
 * Handle subscription resumed event
 */
async function handleSubscriptionResumed(data: SubscriptionData): Promise<void> {
  console.log('[Paddle] Subscription resumed:', data.id);

  await (prisma.subscription.updateMany as any)({
    where: { paddleSubscriptionId: data.id },
    data: {
      status: 'active',
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });
}

/**
 * Handle subscription past due (payment failed)
 */
async function handleSubscriptionPastDue(data: SubscriptionData): Promise<void> {
  console.log('[Paddle] Subscription past due:', data.id);

  const subscription = await (prisma.subscription.findFirst as any)({
    where: { paddleSubscriptionId: data.id },
    include: { user: { select: { email: true } } },
  });

  if (!subscription) {
    console.error('[Paddle] Subscription not found for past_due:', data.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'past_due',
    },
  });

  // Send payment failed email (non-blocking)
  if (subscription.user?.email) {
    sendPaymentFailedEmail(subscription.user.email).catch((err) => {
      console.error('[Paddle] Failed to send payment failed email:', err);
    });
  }

  console.log(`[Paddle] Payment failed notification for user ${subscription.userId}`);
}

export default router;
