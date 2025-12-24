import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import { auditLog } from "../lib/security";
import type { ConnectStripeInput } from "../lib/validation";
import Stripe from "stripe";

const prisma = new PrismaClient();

export const connectStripeWithKey: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Body is already validated by middleware
    const { apiKey } = req.body as ConnectStripeInput;

    // Additional security: only allow test keys in development
    if (process.env.NODE_ENV === "production" && apiKey.startsWith("sk_test_")) {
      return res.status(400).json({ 
        error: "Test keys not allowed in production. Please use a live Stripe key." 
      });
    }

    // Validate the API key by making a test request
    const testStripe = new Stripe(apiKey, {
      apiVersion: "2025-12-15.clover",
    });

    try {
      const account = await testStripe.accounts.retrieve("self");

      // Save the connection to database
      // NOTE: In production, encrypt the access token before storing
      await prisma.stripeConnection.upsert({
        where: { userId: req.userId },
        create: {
          userId: req.userId,
          stripeAccountId: account.id,
          accessToken: apiKey, // Consider encrypting this
        },
        update: {
          stripeAccountId: account.id,
          accessToken: apiKey,
        },
      });

      auditLog({
        action: "stripe_connected",
        userId: req.userId,
        ip: req.ip,
        details: {
          stripeAccountId: account.id,
          // Don't log the actual API key
        },
      });

      res.json({ 
        success: true, 
        accountId: account.id,
        // Don't echo back the API key
      });
    } catch (stripeError: any) {
      auditLog({
        action: "stripe_connection_failed",
        userId: req.userId,
        ip: req.ip,
        details: {
          error: stripeError.type || "unknown",
        },
      });
      
      // Generic error - don't expose Stripe error details
      return res.status(400).json({ 
        error: "Invalid Stripe API key. Please check your key and try again." 
      });
    }
  } catch (error: any) {
    console.error("Stripe connection error:", error);
    res.status(500).json({ error: "Failed to connect Stripe account" });
  }
};
