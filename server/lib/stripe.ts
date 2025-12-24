import Stripe from "stripe";

// Lazy load Stripe instance
export async function getStripeInstance(): Promise<Stripe> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export const STRIPE_OAUTH_CLIENT_ID = process.env.STRIPE_OAUTH_CLIENT_ID || "";
export const STRIPE_OAUTH_REDIRECT_URI =
  process.env.STRIPE_OAUTH_REDIRECT_URI || "http://localhost:8080/api/stripe/oauth-callback";

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
  const response = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_secret: process.env.STRIPE_SECRET_KEY || "",
      code: code,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange OAuth code");
  }

  return response.json();
}
