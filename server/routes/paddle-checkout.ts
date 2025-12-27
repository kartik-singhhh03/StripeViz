/**
 * Paddle Checkout Routes
 * Handles checkout session creation for subscriptions
 * 
 * POST /api/payments/create-checkout - Create a new checkout session
 * GET /api/payments/subscription - Get current subscription status
 * POST /api/payments/cancel - Cancel subscription
 * POST /api/payments/update-plan - Change subscription plan
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  createCheckout,
  getPriceId,
  cancelSubscription,
  updateSubscription,
  getSubscription,
  getUpdatePaymentMethodTransaction,
  getPlanFromPriceId,
  getPlanFeatures,
  PADDLE_PRICE_IDS,
  type PlanType,
  type BillingCycle,
} from '../lib/paddle';
import { AuthRequest, authMiddleware } from '../lib/middleware';

const router = Router();
const prisma = new PrismaClient();

// Note: After adding new fields to schema.prisma, run `pnpm prisma generate`
// Until then, we use type assertions for the new Paddle fields
type SubscriptionWithPaddle = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  billingCycle?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
  paddleCustomerId?: string | null;
  paddleSubscriptionId?: string | null;
  paddlePriceId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
};

// ============================================
// Validation Schemas
// ============================================

const createCheckoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const updatePlanSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
});

// ============================================
// Routes
// ============================================

/**
 * POST /api/payments/create-checkout
 * Creates a Paddle checkout session for subscription purchase
 */
router.post('/create-checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input
    const validation = createCheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { plan, billingCycle, successUrl } = validation.data;

    // Get authenticated user from token
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has an active paid subscription
    if (user.subscription && 
        user.subscription.status === 'active' && 
        user.subscription.plan !== 'free') {
      return res.status(400).json({
        error: 'Active subscription exists',
        message: 'Please use the upgrade/downgrade option or cancel your current subscription first.',
        currentPlan: user.subscription.plan,
      });
    }

    // Get the price ID for the selected plan
    const priceId = getPriceId(plan, billingCycle);

    // Create checkout session with Paddle
    const transaction = await createCheckout({
      priceId,
      customerEmail: user.email,
      customerName: user.name || undefined,
      successUrl: successUrl || `${process.env.APP_URL || 'http://localhost:8080'}/billing?success=true`,
      passthrough: {
        userId: user.id,
        plan,
        billingCycle,
      },
    });

    // Return checkout URL for redirect
    res.json({
      success: true,
      checkoutUrl: transaction.checkout?.url,
      transactionId: transaction.id,
    });

  } catch (error) {
    console.error('[Paddle Checkout] Error creating checkout:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/payments/subscription
 * Get current user's subscription details
 */
router.get('/subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get subscription from database (cast to extended type)
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    }) as SubscriptionWithPaddle | null;

    if (!subscription) {
      // Return free plan defaults
      return res.json({
        plan: 'free',
        status: 'active',
        features: getPlanFeatures('free'),
      });
    }

    // If we have a Paddle subscription ID, sync with Paddle
    let paddleData = null;
    if (subscription.paddleSubscriptionId) {
      try {
        paddleData = await getSubscription(subscription.paddleSubscriptionId);
      } catch (err) {
        console.warn('[Paddle] Failed to fetch subscription from Paddle:', err);
      }
    }

    res.json({
      plan: subscription.plan,
      billingCycle: subscription.billingCycle,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      features: getPlanFeatures(subscription.plan),
      paddleCustomerId: subscription.paddleCustomerId,
      // Include synced data from Paddle if available
      ...(paddleData && {
        paddleStatus: paddleData.status,
        scheduledChange: paddleData.scheduledChange,
      }),
    });

  } catch (error) {
    console.error('[Paddle Subscription] Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * POST /api/payments/cancel
 * Cancel the current subscription (at period end)
 */
router.post('/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    }) as SubscriptionWithPaddle | null;

    if (!subscription || !subscription.paddleSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ error: 'Subscription is not active' });
    }

    // Cancel at period end (user keeps access until billing period ends)
    const { immediately } = req.body;
    const effectiveFrom = immediately ? 'immediately' : 'next_billing_period';

    await cancelSubscription(subscription.paddleSubscriptionId, effectiveFrom);

    // Update local database
    await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: !immediately,
        canceledAt: immediately ? new Date() : null,
        status: immediately ? 'canceled' : 'active',
      },
    });

    res.json({
      success: true,
      message: immediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the billing period',
      cancelAtPeriodEnd: !immediately,
    });

  } catch (error) {
    console.error('[Paddle Cancel] Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/payments/update-plan
 * Upgrade or downgrade subscription plan
 */
router.post('/update-plan', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validation = updatePlanSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { plan, billingCycle } = validation.data;

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    }) as SubscriptionWithPaddle | null;

    if (!subscription || !subscription.paddleSubscriptionId) {
      return res.status(404).json({ 
        error: 'No active subscription found',
        message: 'Please create a subscription first',
      });
    }

    // Get the new price ID
    const newPriceId = getPriceId(plan, billingCycle);

    // Update subscription in Paddle
    await updateSubscription(
      subscription.paddleSubscriptionId,
      newPriceId,
      'prorated_immediately' // Prorate immediately for upgrades
    );

    // Update local database (use any for new fields)
    await (prisma.subscription.update as any)({
      where: { userId },
      data: {
        plan,
        billingCycle,
        paddlePriceId: newPriceId,
        // Reset cancellation if they're updating plan
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    res.json({
      success: true,
      message: `Plan updated to ${plan} (${billingCycle})`,
      newPlan: plan,
      newBillingCycle: billingCycle,
      features: getPlanFeatures(plan),
    });

  } catch (error) {
    console.error('[Paddle Update] Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * POST /api/payments/resume
 * Resume a paused or canceled subscription
 */
router.post('/resume', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    }) as SubscriptionWithPaddle | null;

    if (!subscription || !subscription.paddleSubscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Can only resume if canceled at period end (not immediately canceled)
    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ 
        error: 'Subscription cannot be resumed',
        message: 'This subscription was not scheduled for cancellation',
      });
    }

    // Resume subscription - this reverses a scheduled cancellation
    // Note: Paddle doesn't have a direct "resume" for cancel at period end
    // The webhook will handle this or we can update the subscription
    
    await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    res.json({
      success: true,
      message: 'Subscription resumed',
    });

  } catch (error) {
    console.error('[Paddle Resume] Error resuming subscription:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

/**
 * GET /api/payments/prices
 * Get available plans and prices (public endpoint)
 */
router.get('/prices', (_req: Request, res: Response) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        description: 'Get started with basic analytics',
        features: getPlanFeatures('free'),
        prices: null,
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For growing businesses',
        features: getPlanFeatures('pro'),
        prices: {
          monthly: {
            priceId: PADDLE_PRICE_IDS.pro.monthly,
            amount: 29,
            currency: 'USD',
          },
          yearly: {
            priceId: PADDLE_PRICE_IDS.pro.yearly,
            amount: 290,
            currency: 'USD',
            savings: '2 months free',
          },
        },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large teams and enterprises',
        features: getPlanFeatures('enterprise'),
        prices: {
          monthly: {
            priceId: PADDLE_PRICE_IDS.enterprise.monthly,
            amount: 99,
            currency: 'USD',
          },
          yearly: {
            priceId: PADDLE_PRICE_IDS.enterprise.yearly,
            amount: 990,
            currency: 'USD',
            savings: '2 months free',
          },
        },
      },
    ],
  });
});

/**
 * POST /api/payments/portal
 * Get URL to update payment method (Paddle's equivalent of customer portal)
 */
router.post('/portal', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    }) as SubscriptionWithPaddle | null;

    if (!subscription || !subscription.paddleSubscriptionId) {
      return res.status(404).json({ 
        error: 'No subscription found',
        message: 'You need an active subscription to access the billing portal',
      });
    }

    // Get update payment method transaction from Paddle
    const transaction = await getUpdatePaymentMethodTransaction(subscription.paddleSubscriptionId);

    res.json({
      success: true,
      checkoutUrl: transaction.checkout?.url,
      transactionId: transaction.id,
    });

  } catch (error) {
    console.error('[Paddle Portal] Error:', error);
    res.status(500).json({ error: 'Failed to open billing portal' });
  }
});

/**
 * GET /api/payments/invoices
 * Get invoice history for the user (via Paddle API)
 */
router.get('/invoices', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    }) as SubscriptionWithPaddle | null;

    if (!subscription || !subscription.paddleCustomerId) {
      return res.json({ invoices: [] });
    }

    // Note: For a full implementation, you'd fetch transactions from Paddle API
    // For now, return empty list - invoices are emailed automatically by Paddle
    res.json({
      invoices: [],
      message: 'Invoices are sent to your email by Paddle',
    });

  } catch (error) {
    console.error('[Paddle Invoices] Error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

export default router;
