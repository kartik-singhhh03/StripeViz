/**
 * Environment Variable Validation & Configuration
 * 
 * SECURITY: This module validates ALL environment variables at startup.
 * The server will FAIL FAST if any required variables are missing.
 * 
 * NEVER use process.env directly elsewhere - always import from this module.
 */

import { z } from 'zod';

// ============================================
// Schema Definition
// ============================================

/**
 * Zod schema for all environment variables
 * - Required variables: Server will crash if missing
 * - Optional variables: Have sensible defaults or are truly optional
 */
const envSchema = z.object({
  // ===== NODE ENVIRONMENT =====
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ===== DATABASE (REQUIRED) =====
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ===== JWT & SESSION SECRETS (REQUIRED) =====
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .refine(
      (val) => !val.includes('your-') && !val.includes('change-in-production'),
      'JWT_SECRET cannot be a placeholder value'
    ),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters for security')
    .refine(
      (val) => !val.includes('your-') && !val.includes('change-in-production'),
      'SESSION_SECRET cannot be a placeholder value'
    ),

  // ===== PADDLE CONFIGURATION (REQUIRED for payments) =====
  // Paddle API keys can have various formats: apikey_, test_, pdl_apikey_, live_, etc.
  PADDLE_API_KEY: z
    .string()
    .min(1, 'PADDLE_API_KEY is required for payment processing'),
  PADDLE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'PADDLE_WEBHOOK_SECRET is required for secure webhook verification'),
  PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),

  // Paddle Price IDs (required for checkout)
  PADDLE_PRO_MONTHLY_PRICE_ID: z.string().min(1, 'PADDLE_PRO_MONTHLY_PRICE_ID is required'),
  PADDLE_PRO_YEARLY_PRICE_ID: z.string().min(1, 'PADDLE_PRO_YEARLY_PRICE_ID is required'),
  PADDLE_ENTERPRISE_MONTHLY_PRICE_ID: z.string().min(1, 'PADDLE_ENTERPRISE_MONTHLY_PRICE_ID is required'),
  PADDLE_ENTERPRISE_YEARLY_PRICE_ID: z.string().min(1, 'PADDLE_ENTERPRISE_YEARLY_PRICE_ID is required'),

  // ===== OAUTH CONFIGURATION (OPTIONAL - can disable OAuth if not set) =====
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional().default('http://localhost:8080/api/auth/google/callback'),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional().default('http://localhost:8080/api/auth/github/callback'),

  // ===== STRIPE CONFIGURATION (OPTIONAL - legacy, Paddle is primary) =====
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_OAUTH_CLIENT_ID: z.string().optional(),
  STRIPE_OAUTH_REDIRECT_URI: z.string().url().optional(),

  // Stripe Price IDs (optional - legacy)
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_YEARLY: z.string().optional(),
  STRIPE_PRICE_LIFETIME: z.string().optional(),

  // ===== EMAIL CONFIGURATION (OPTIONAL - will be added) =====
  RESEND_API_KEY: z.string().optional(),
  // EMAIL_FROM can be "email@example.com" or "Name <email@example.com>" format
  EMAIL_FROM: z.string().optional().default('noreply@example.com'),

  // ===== APPLICATION URLS =====
  APP_URL: z.string().url().optional().default('http://localhost:8080'),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:8080'),

  // ===== MISCELLANEOUS =====
  PING_MESSAGE: z.string().optional().default('pong'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  
  // ===== REVERSE PROXY CONFIGURATION =====
  // Set to 'true' when running behind Nginx that handles CORS headers
  // This prevents duplicate CORS headers which cause browser errors
  BEHIND_REVERSE_PROXY: z.string().optional().transform(val => val === 'true'),
});

// ============================================
// Validation & Export
// ============================================

/**
 * Validate environment variables at module load time
 * This ensures the server fails fast if configuration is invalid
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ ENVIRONMENT VALIDATION FAILED\n');
    console.error('The following environment variables are missing or invalid:\n');
    
    const errors = result.error.flatten().fieldErrors;
    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  • ${field}:`);
      messages?.forEach((msg) => console.error(`      - ${msg}`));
    }

    console.error('\n📄 See .env.example for required configuration.');
    console.error('🔒 Generate secure secrets with: openssl rand -base64 64\n');

    // In production, ALWAYS fail. In development, allow some flexibility.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.error('⚠️  WARNING: Running in development mode with invalid config.\n');
      console.error('   This would CRASH in production!\n');
      
      // Return partial config for development
      return result.data as z.infer<typeof envSchema>;
    }
  }

  console.log('✅ Environment variables validated successfully');
  return result.data;
}

// Validate on import - fail fast
const env = validateEnv();

// ============================================
// Type-Safe Exports
// ============================================

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment configuration
 * Use this instead of process.env directly
 */
export const config = {
  // Environment
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  // Database
  databaseUrl: env.DATABASE_URL,

  // Security
  jwtSecret: env.JWT_SECRET,
  sessionSecret: env.SESSION_SECRET,

  // Paddle (Primary Payment Provider)
  paddle: {
    apiKey: env.PADDLE_API_KEY,
    webhookSecret: env.PADDLE_WEBHOOK_SECRET,
    environment: env.PADDLE_ENVIRONMENT,
    apiBase: env.PADDLE_ENVIRONMENT === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com',
    priceIds: {
      pro: {
        monthly: env.PADDLE_PRO_MONTHLY_PRICE_ID,
        yearly: env.PADDLE_PRO_YEARLY_PRICE_ID,
      },
      enterprise: {
        monthly: env.PADDLE_ENTERPRISE_MONTHLY_PRICE_ID,
        yearly: env.PADDLE_ENTERPRISE_YEARLY_PRICE_ID,
      },
    },
  },

  // OAuth (Optional)
  oauth: {
    google: {
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: env.GOOGLE_REDIRECT_URI,
    },
    github: {
      enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
      redirectUri: env.GITHUB_REDIRECT_URI,
    },
  },

  // Stripe (Legacy/Optional)
  stripe: {
    enabled: !!env.STRIPE_SECRET_KEY,
    secretKey: env.STRIPE_SECRET_KEY || '',
    publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    oauthClientId: env.STRIPE_OAUTH_CLIENT_ID || '',
    oauthRedirectUri: env.STRIPE_OAUTH_REDIRECT_URI || 'http://localhost:8080/api/stripe/oauth-callback',
    priceIds: {
      proMonthly: env.STRIPE_PRICE_PRO_MONTHLY || '',
      proYearly: env.STRIPE_PRICE_PRO_YEARLY || '',
      businessMonthly: env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
      businessYearly: env.STRIPE_PRICE_BUSINESS_YEARLY || '',
      lifetime: env.STRIPE_PRICE_LIFETIME || '',
    },
  },

  // Email
  email: {
    enabled: !!env.RESEND_API_KEY,
    apiKey: env.RESEND_API_KEY || '',
    from: env.EMAIL_FROM,
  },

  // URLs
  appUrl: env.APP_URL,
  frontendUrl: env.FRONTEND_URL,

  // Misc
  pingMessage: env.PING_MESSAGE,
  port: env.PORT || 8080,
  
  // Reverse proxy - when true, Express skips CORS headers (Nginx handles them)
  behindReverseProxy: env.BEHIND_REVERSE_PROXY || false,
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a feature is enabled based on its configuration
 */
export function isFeatureEnabled(feature: 'paddle' | 'stripe' | 'googleOAuth' | 'githubOAuth' | 'email'): boolean {
  switch (feature) {
    case 'paddle':
      return !!config.paddle.apiKey;
    case 'stripe':
      return config.stripe.enabled;
    case 'googleOAuth':
      return config.oauth.google.enabled;
    case 'githubOAuth':
      return config.oauth.github.enabled;
    case 'email':
      return config.email.enabled;
    default:
      return false;
  }
}

/**
 * Get a masked version of a secret for logging
 * Shows first 4 and last 4 characters
 */
export function maskSecret(secret: string): string {
  if (secret.length <= 12) {
    return '********';
  }
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

/**
 * Log current configuration status (safe for logging)
 */
export function logConfigStatus(): void {
  console.log('\n📋 Configuration Status:');
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Database: ${config.databaseUrl ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  JWT Secret: ${config.jwtSecret ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  Paddle: ${isFeatureEnabled('paddle') ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`  Stripe: ${isFeatureEnabled('stripe') ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`  Google OAuth: ${isFeatureEnabled('googleOAuth') ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`  GitHub OAuth: ${isFeatureEnabled('githubOAuth') ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log(`  Email (Resend): ${isFeatureEnabled('email') ? '✅ Enabled' : '⚠️ Disabled'}`);
  console.log('');
}

export default config;
