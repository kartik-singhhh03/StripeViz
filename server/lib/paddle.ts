/**
 * Paddle Payment Service
 * Handles all interactions with Paddle API for subscription management
 * 
 * Security: All API calls are server-side only. Webhook signatures verified.
 */

import crypto from 'crypto';
import { config } from './env';

// ============================================
// Configuration (from centralized env config)
// ============================================

const PADDLE_API_KEY = config.paddle.apiKey;
const PADDLE_WEBHOOK_SECRET = config.paddle.webhookSecret;
const PADDLE_API_BASE = config.paddle.apiBase;

// Price ID mapping - from centralized config
export const PADDLE_PRICE_IDS = config.paddle.priceIds;

// ============================================
// Types
// ============================================

export type PlanType = 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface CheckoutOptions {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  successUrl?: string;
  passthrough?: Record<string, string>;
}

export interface PaddleCustomer {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface PaddleSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing';
  customerId: string;
  priceId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  scheduledChange?: {
    action: 'cancel' | 'pause';
    effectiveAt: string;
  };
}

export interface PaddleTransaction {
  id: string;
  status: string;
  customerId: string;
  subscriptionId?: string;
  items: Array<{
    price: {
      id: string;
      productId: string;
    };
    quantity: number;
  }>;
  checkout?: {
    url: string;
  };
}

// ============================================
// API Client
// ============================================

async function paddleRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  if (!PADDLE_API_KEY) {
    throw new Error('PADDLE_API_KEY is not configured');
  }

  const { method = 'GET', body } = options;

  const response = await fetch(`${PADDLE_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Paddle API Error]', {
      endpoint,
      status: response.status,
      error: data,
    });
    throw new Error(data.error?.detail || 'Paddle API request failed');
  }

  return data.data;
}

// ============================================
// Checkout Functions
// ============================================

/**
 * Get price ID for a plan and billing cycle
 */
export function getPriceId(plan: PlanType, billingCycle: BillingCycle): string {
  const priceId = PADDLE_PRICE_IDS[plan]?.[billingCycle];
  if (!priceId) {
    throw new Error(`Invalid plan or billing cycle: ${plan}/${billingCycle}`);
  }
  return priceId;
}

/**
 * Create a checkout transaction for a new subscription
 * Returns the checkout URL to redirect the user to
 */
export async function createCheckout(options: CheckoutOptions): Promise<PaddleTransaction> {
  const { priceId, customerId, customerEmail, customerName, successUrl, passthrough } = options;

  const body: Record<string, unknown> = {
    items: [{ price_id: priceId, quantity: 1 }],
  };

  // Add customer info if provided
  if (customerId) {
    body.customer_id = customerId;
  } else if (customerEmail) {
    body.customer = {
      email: customerEmail,
      ...(customerName && { name: customerName }),
    };
  }

  // Add success URL for redirect after checkout
  if (successUrl) {
    body.checkout = {
      success_url: successUrl,
    };
  }

  // Add custom data (passthrough) for tracking
  if (passthrough) {
    body.custom_data = passthrough;
  }

  return paddleRequest<PaddleTransaction>('/transactions', {
    method: 'POST',
    body,
  });
}

// ============================================
// Customer Functions
// ============================================

/**
 * Create a new Paddle customer
 */
export async function createCustomer(
  email: string,
  name?: string
): Promise<PaddleCustomer> {
  return paddleRequest<PaddleCustomer>('/customers', {
    method: 'POST',
    body: {
      email,
      ...(name && { name }),
    },
  });
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<PaddleCustomer> {
  return paddleRequest<PaddleCustomer>(`/customers/${customerId}`);
}

/**
 * Find customer by email
 */
export async function findCustomerByEmail(email: string): Promise<PaddleCustomer | null> {
  const customers = await paddleRequest<PaddleCustomer[]>(
    `/customers?email=${encodeURIComponent(email)}`
  );
  return customers[0] || null;
}

// ============================================
// Subscription Functions
// ============================================

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<PaddleSubscription> {
  return paddleRequest<PaddleSubscription>(`/subscriptions/${subscriptionId}`);
}

/**
 * Get all subscriptions for a customer
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<PaddleSubscription[]> {
  return paddleRequest<PaddleSubscription[]>(
    `/subscriptions?customer_id=${customerId}`
  );
}

/**
 * Cancel a subscription (at period end by default)
 */
export async function cancelSubscription(
  subscriptionId: string,
  effectiveFrom: 'immediately' | 'next_billing_period' = 'next_billing_period'
): Promise<PaddleSubscription> {
  return paddleRequest<PaddleSubscription>(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: {
      effective_from: effectiveFrom,
    },
  });
}

/**
 * Update subscription (change plan/price)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  proration: 'prorated_immediately' | 'full_immediately' | 'full_next_billing_period' = 'prorated_immediately'
): Promise<PaddleSubscription> {
  return paddleRequest<PaddleSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: {
      items: [{ price_id: newPriceId, quantity: 1 }],
      proration_billing_mode: proration,
    },
  });
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(
  subscriptionId: string,
  resumeAt?: Date
): Promise<PaddleSubscription> {
  return paddleRequest<PaddleSubscription>(`/subscriptions/${subscriptionId}/pause`, {
    method: 'POST',
    body: resumeAt ? { resume_at: resumeAt.toISOString() } : {},
  });
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(
  subscriptionId: string,
  effectiveFrom: 'immediately' | 'next_billing_period' = 'immediately'
): Promise<PaddleSubscription> {
  return paddleRequest<PaddleSubscription>(`/subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
    body: {
      effective_from: effectiveFrom,
    },
  });
}

// ============================================
// Portal Functions
// ============================================

/**
 * Get customer portal URL for subscription management
 * Paddle uses "update payment method" transactions for this
 */
export async function getUpdatePaymentMethodTransaction(
  subscriptionId: string
): Promise<PaddleTransaction> {
  return paddleRequest<PaddleTransaction>('/transactions', {
    method: 'POST',
    body: {
      subscription_id: subscriptionId,
      collection_mode: 'automatic',
      checkout: {
        url: process.env.APP_URL || 'http://localhost:8080',
      },
    },
  });
}

// ============================================
// Webhook Verification
// ============================================

/**
 * Verify Paddle webhook signature
 * CRITICAL: Always verify webhooks to prevent spoofed events
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  timestamp: string
): boolean {
  if (!PADDLE_WEBHOOK_SECRET) {
    console.error('[Paddle] Webhook secret not configured');
    return false;
  }

  try {
    // Paddle signature format: ts=timestamp;h1=signature
    const signedPayload = `${timestamp}:${payload}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Paddle] Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Parse Paddle webhook headers
 */
export function parseWebhookHeaders(headers: Record<string, string | string[] | undefined>): {
  signature: string;
  timestamp: string;
} | null {
  const paddleSignature = headers['paddle-signature'];
  
  if (!paddleSignature || typeof paddleSignature !== 'string') {
    return null;
  }

  // Parse ts=123;h1=abc format
  const parts = paddleSignature.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  if (!parts.ts || !parts.h1) {
    return null;
  }

  return {
    timestamp: parts.ts,
    signature: parts.h1,
  };
}

// ============================================
// Plan Helpers
// ============================================

/**
 * Get plan name from price ID
 */
export function getPlanFromPriceId(priceId: string): { plan: PlanType; billingCycle: BillingCycle } | null {
  for (const [plan, cycles] of Object.entries(PADDLE_PRICE_IDS)) {
    for (const [cycle, id] of Object.entries(cycles)) {
      if (id === priceId) {
        return { plan: plan as PlanType, billingCycle: cycle as BillingCycle };
      }
    }
  }
  return null;
}

/**
 * Get subscription features by plan
 */
export function getPlanFeatures(plan: string): {
  name: string;
  maxConnections: number;
  maxSnapshots: number;
  analyticsRetentionDays: number;
  canExport: boolean;
  canBenchmark: boolean;
  canSmartAlerts: boolean;
  canPublicSnapshot: boolean;
} {
  switch (plan) {
    case 'enterprise':
      return {
        name: 'Enterprise',
        maxConnections: -1, // unlimited
        maxSnapshots: -1,
        analyticsRetentionDays: 365,
        canExport: true,
        canBenchmark: true,
        canSmartAlerts: true,
        canPublicSnapshot: true,
      };
    case 'pro':
      return {
        name: 'Pro',
        maxConnections: 5,
        maxSnapshots: 100,
        analyticsRetentionDays: 90,
        canExport: true,
        canBenchmark: true,
        canSmartAlerts: true,
        canPublicSnapshot: true,
      };
    default: // free
      return {
        name: 'Free',
        maxConnections: 1,
        maxSnapshots: 10,
        analyticsRetentionDays: 7,
        canExport: false,
        canBenchmark: false,
        canSmartAlerts: false,
        canPublicSnapshot: false,
      };
  }
}
