import Stripe from "stripe";
import { config, isFeatureEnabled } from "./env";

// Lazy load Stripe instance
export async function getStripeInstance(): Promise<Stripe> {
  if (!isFeatureEnabled('stripe')) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in environment.");
  }
  return new Stripe(config.stripe.secretKey);
}

export const STRIPE_OAUTH_CLIENT_ID = config.stripe.oauthClientId;
export const STRIPE_OAUTH_REDIRECT_URI = config.stripe.oauthRedirectUri;

export function getStripeOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: STRIPE_OAUTH_CLIENT_ID,
    response_type: "code",
    scope: "read_write",
    redirect_uri: STRIPE_OAUTH_REDIRECT_URI,
    stripe_user: JSON.stringify({
      url: "https://stripeviz.example.com",
      product_category: "saas",
    }),
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeOAuthCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  stripe_account_id: string;
  stripe_user_id: string;
}> {
  if (!isFeatureEnabled('stripe')) {
    throw new Error("Stripe is not configured");
  }
  
  const response = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_secret: config.stripe.secretKey,
      code: code,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange OAuth code");
  }

  return response.json();
}
