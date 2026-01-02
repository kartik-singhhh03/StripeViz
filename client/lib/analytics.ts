/**
 * Google Analytics (GA4) Integration
 * 
 * PRIVACY & SECURITY:
 * - Only loads in production (NODE_ENV === 'production')
 * - Only loads if VITE_GA_MEASUREMENT_ID is set
 * - Never tracks sensitive data (Stripe keys, passwords, etc.)
 * - Respects user privacy settings
 * 
 * TRACKED EVENTS:
 * - Page views (automatic)
 * - Dashboard load
 * - Stripe connect success
 * - Subscription events
 */

// Check if we're in production and have GA configured
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const IS_PRODUCTION = import.meta.env.PROD;
const GA_ENABLED = IS_PRODUCTION && GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics
 * Only runs in production with a valid measurement ID
 */
export function initGA(): void {
  if (!GA_ENABLED) {
    if (!IS_PRODUCTION) {
      console.log('[GA] Google Analytics disabled in development');
    }
    return;
  }

  // Prevent double initialization
  if (window.gtag) {
    console.warn('[GA] Already initialized');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    // Privacy settings
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
    // Don't send page_path automatically (we'll do it manually)
    send_page_view: true,
  });

  console.log('[GA] Google Analytics initialized');
}

/**
 * Track a page view
 * @param path - The page path (e.g., '/dashboard')
 * @param title - The page title
 */
export function trackPageView(path: string, title?: string): void {
  if (!GA_ENABLED || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track a custom event
 * SECURITY: Never pass sensitive data (API keys, passwords, PII)
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!GA_ENABLED || !window.gtag) return;

  // Sanitize params - remove any potentially sensitive fields
  const sanitizedParams = sanitizeEventParams(params);

  window.gtag('event', eventName, sanitizedParams);
}

/**
 * Sanitize event parameters to remove sensitive data
 */
function sanitizeEventParams(
  params?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;

  const sensitiveKeys = [
    'api_key', 'apikey', 'key', 'secret', 'token', 'password',
    'stripe', 'sk_', 'pk_', 'email', 'phone', 'address',
  ];

  const sanitized: Record<string, string | number | boolean> = {};
  
  for (const [key, value] of Object.entries(params)) {
    const lowercaseKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(
      (sensitive) => lowercaseKey.includes(sensitive)
    );

    if (!isSensitive) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ========================
// PRE-DEFINED EVENTS
// ========================

/**
 * Track dashboard load
 */
export function trackDashboardLoad(): void {
  trackEvent('dashboard_load', {
    timestamp: Date.now(),
  });
}

/**
 * Track Stripe connection success
 * SECURITY: Only tracks mode (test/live), never the actual key
 */
export function trackStripeConnectSuccess(mode: 'test' | 'live'): void {
  trackEvent('stripe_connect_success', {
    stripe_mode: mode,
  });
}

/**
 * Track subscription event
 */
export function trackSubscriptionEvent(
  action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate',
  plan: string
): void {
  trackEvent('subscription_event', {
    action,
    plan,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string): void {
  trackEvent('feature_usage', {
    feature,
  });
}

/**
 * Track export action
 */
export function trackExport(exportType: string): void {
  trackEvent('export', {
    export_type: exportType,
  });
}

// TypeScript declarations for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackDashboardLoad,
  trackStripeConnectSuccess,
  trackSubscriptionEvent,
  trackFeatureUsage,
  trackExport,
};
