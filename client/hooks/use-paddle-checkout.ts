/**
 * Paddle Checkout Hook
 * Handles Paddle.js initialization and checkout flow
 * 
 * Usage:
 * const { openCheckout, isLoading } = usePaddleCheckout();
 * openCheckout({ plan: 'pro', billingCycle: 'monthly' });
 */

import { useEffect, useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { getApiUrl } from '@/lib/api';
import { trackSubscriptionCreated } from '@/lib/analytics';

// Paddle.js types
declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: 'sandbox' | 'production') => void;
      };
      Initialize: (config: { token: string; checkout?: { settings?: Record<string, unknown> } }) => void;
      Checkout: {
        open: (config: {
          transactionId?: string;
          items?: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          customData?: Record<string, string>;
          settings?: {
            displayMode?: 'overlay' | 'inline';
            theme?: 'light' | 'dark';
            locale?: string;
            successUrl?: string;
            allowLogout?: boolean;
          };
        }) => void;
      };
      Status: {
        libraryVersion: string;
      };
    };
  }
}

// Configuration
const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || 'live_08539292255f93d0651c111da8e';
const PADDLE_ENVIRONMENT = (import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

// Price IDs (should match backend)
export const PADDLE_PRICE_IDS = {
  pro: {
    monthly: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID || 'pri_01kda9jzvfrfzbtr9x29x82apr',
    yearly: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID || 'pri_01kda9r59z3ydcfwwdndhdysyd',
  },
  enterprise: {
    monthly: import.meta.env.VITE_PADDLE_ENTERPRISE_MONTHLY_PRICE_ID || 'pri_01kdaa2qk5xgqwer0zsc954k7m',
    yearly: import.meta.env.VITE_PADDLE_ENTERPRISE_YEARLY_PRICE_ID || 'pri_01kdaa6kfzty60z64fj192x8wt',
  },
} as const;

export type PlanType = 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

interface CheckoutOptions {
  plan: PlanType;
  billingCycle: BillingCycle;
  email?: string;
  successUrl?: string;
}

interface UsePaddleCheckoutReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  openCheckout: (options: CheckoutOptions) => Promise<void>;
  openCheckoutWithTransaction: (transactionId: string) => void;
}

/**
 * Load Paddle.js script dynamically
 */
function loadPaddleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Paddle) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="paddle.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Paddle.js')));
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize Paddle with client token
 */
function initializePaddle(): void {
  if (!window.Paddle) {
    throw new Error('Paddle.js not loaded');
  }

  // Set environment (sandbox or production)
  window.Paddle.Environment.set(PADDLE_ENVIRONMENT);

  // Initialize with client token
  window.Paddle.Initialize({
    token: PADDLE_CLIENT_TOKEN,
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: 'en',
      },
    },
  });

  console.log('[Paddle] Initialized in', PADDLE_ENVIRONMENT, 'mode');
}

/**
 * Hook for Paddle checkout functionality
 */
export function usePaddleCheckout(): UsePaddleCheckoutReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load Paddle.js on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadPaddleScript();
        if (mounted) {
          initializePaddle();
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to load Paddle';
          setError(message);
          console.error('[Paddle] Init error:', err);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Open checkout with plan selection
   * Creates a transaction via backend and opens Paddle overlay
   */
  const openCheckout = useCallback(async (options: CheckoutOptions) => {
    if (!isLoaded || !window.Paddle) {
      toast({
        title: 'Please wait',
        description: 'Payment system is loading...',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create checkout transaction via backend
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/payments/create-checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          plan: options.plan,
          billingCycle: options.billingCycle,
          successUrl: options.successUrl || `${window.location.origin}/billing?success=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const data = await response.json();

      // Open Paddle checkout with transaction ID
      if (data.transactionId) {
        // Track subscription creation attempt (GA4)
        // Note: Final tracking happens on webhook success, but we track intent here
        trackSubscriptionCreated(options.plan, options.billingCycle);
        
        window.Paddle.Checkout.open({
          transactionId: data.transactionId,
        });
      } else if (data.checkoutUrl) {
        // Fallback to redirect if no transaction ID
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL or transaction ID returned');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      setError(message);
      toast({
        title: 'Checkout Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, toast]);

  /**
   * Open checkout directly with a transaction ID
   * Used when transaction is already created
   */
  const openCheckoutWithTransaction = useCallback((transactionId: string) => {
    if (!isLoaded || !window.Paddle) {
      toast({
        title: 'Please wait',
        description: 'Payment system is loading...',
        variant: 'destructive',
      });
      return;
    }

    window.Paddle.Checkout.open({
      transactionId,
    });
  }, [isLoaded, toast]);

  return {
    isLoaded,
    isLoading,
    error,
    openCheckout,
    openCheckoutWithTransaction,
  };
}

/**
 * Get price display info
 */
export function getPriceDisplay(plan: PlanType, billingCycle: BillingCycle): {
  amount: number;
  currency: string;
  interval: string;
  yearlyAmount?: number;
  savings?: string;
} {
  const prices = {
    pro: {
      monthly: { amount: 29, currency: 'USD', interval: 'month' },
      yearly: { amount: 290, currency: 'USD', interval: 'year', savings: '2 months free' },
    },
    enterprise: {
      monthly: { amount: 99, currency: 'USD', interval: 'month' },
      yearly: { amount: 990, currency: 'USD', interval: 'year', savings: '2 months free' },
    },
  };

  return prices[plan][billingCycle];
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
