/**
 * Stripe Key Utilities
 * 
 * Helper functions for detecting and handling Stripe test vs live keys.
 * SECURITY: Never log actual key values, only key type detection results.
 */

/**
 * Stripe key mode type
 */
export type StripeMode = 'test' | 'live';

/**
 * Determines if a Stripe secret key is a test key
 * @param stripeKey - The Stripe secret key to check
 * @returns true if the key is a test key (sk_test_*)
 */
export function isTestKey(stripeKey: string): boolean {
  return stripeKey.startsWith('sk_test_');
}

/**
 * Determines if a Stripe secret key is a live key
 * @param stripeKey - The Stripe secret key to check
 * @returns true if the key is a live key (sk_live_*)
 */
export function isLiveKey(stripeKey: string): boolean {
  return stripeKey.startsWith('sk_live_');
}

/**
 * Gets the Stripe mode from a secret key
 * @param stripeKey - The Stripe secret key
 * @returns 'test' or 'live' based on key prefix
 */
export function getStripeMode(stripeKey: string): StripeMode {
  return isTestKey(stripeKey) ? 'test' : 'live';
}

/**
 * Validates that a Stripe key has the correct format
 * @param stripeKey - The key to validate
 * @returns true if the key format is valid
 */
export function isValidStripeKeyFormat(stripeKey: string): boolean {
  // Stripe secret keys start with sk_test_ or sk_live_
  return /^sk_(test|live)_[a-zA-Z0-9]+$/.test(stripeKey);
}

/**
 * Gets a safe description of the key type for logging (never logs actual key)
 * @param stripeKey - The Stripe secret key
 * @returns Description like "test key" or "live key"
 */
export function getKeyTypeDescription(stripeKey: string): string {
  if (isTestKey(stripeKey)) {
    return 'test key';
  }
  if (isLiveKey(stripeKey)) {
    return 'live key';
  }
  return 'unknown key type';
}

/**
 * Restricted features when using test mode
 * These features show simulated/limited data in test mode
 */
export const TEST_MODE_RESTRICTED_FEATURES = [
  'revenue_trends',
  'churn_insights', 
  'advanced_analytics',
  'benchmarking',
  'revenue_forecasting',
  'pareto_analysis',
  'cohort_retention',
] as const;

export type TestModeRestrictedFeature = typeof TEST_MODE_RESTRICTED_FEATURES[number];

/**
 * Check if a feature is restricted in test mode
 * @param feature - The feature to check
 * @returns true if the feature is restricted in test mode
 */
export function isFeatureRestrictedInTestMode(feature: string): boolean {
  return TEST_MODE_RESTRICTED_FEATURES.includes(feature as TestModeRestrictedFeature);
}
