import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import { exchangeOAuthCode } from "../lib/stripe";

const prisma = new PrismaClient();

export const handleStripeOAuthCallback: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { code, state } = req.query as { code: string; state: string };

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Exchange code for access token
    const oauthData = await exchangeOAuthCode(code);

    // Check if Stripe connection already exists
    const existingConnection = await prisma.stripeConnection.findUnique({
      where: { userId: req.userId },
    });

    if (existingConnection) {
      // Update existing connection
      await prisma.stripeConnection.update({
        where: { userId: req.userId },
        data: {
          stripeAccountId: oauthData.stripe_account_id,
          accessToken: oauthData.access_token,
          refreshToken: oauthData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    } else {
      // Create new connection
      await prisma.stripeConnection.create({
        data: {
          userId: req.userId,
          stripeAccountId: oauthData.stripe_account_id,
          accessToken: oauthData.access_token,
          refreshToken: oauthData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Redirect to dashboard
    res.redirect("/dashboard?stripe_connected=true");
  } catch (error) {
    console.error("Stripe OAuth callback error:", error);
    res.redirect("/dashboard?stripe_error=true");
  }
};

export const handleGetStripeConnectUrl: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { getStripeOAuthUrl } = await import("../lib/stripe");
    const url = getStripeOAuthUrl();

    res.json({ url });
  } catch (error) {
    console.error("Get Stripe URL error:", error);
    res.status(500).json({ error: "Failed to generate Stripe URL" });
  }
};
