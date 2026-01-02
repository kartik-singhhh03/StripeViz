import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import { auditLog } from "../lib/security";
import type { ConnectStripeInput } from "../lib/validation";
import Stripe from "stripe";
import { isTestKey, getStripeMode, getKeyTypeDescription } from "../lib/stripe-utils";

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

    // Detect key type (test or live)
    const stripeMode = getStripeMode(apiKey);
    const isTestMode = isTestKey(apiKey);

    // Log key type detection (NEVER log the actual key)
    console.log(`[Stripe Connect] User ${req.userId} connecting with ${getKeyTypeDescription(apiKey)}`);

    // NOTE: Test keys are now allowed in production for testing purposes
    // Users will see a warning in the UI when using test keys

    // Validate the API key by making a test request
    const testStripe = new Stripe(apiKey, {
      apiVersion: "2025-12-15.clover",
    });

    try {
      const account = await testStripe.accounts.retrieve("self");

      // Save the connection to database with stripe mode
      // NOTE: In production, encrypt the access token before storing
      await prisma.stripeConnection.upsert({
        where: { userId: req.userId },
        create: {
          userId: req.userId,
          stripeAccountId: account.id,
          accessToken: apiKey, // Consider encrypting this
          stripeMode: stripeMode, // Store key type: "test" or "live"
        },
        update: {
          stripeAccountId: account.id,
          accessToken: apiKey,
          stripeMode: stripeMode, // Update key type on reconnect
        },
      });

      auditLog({
        action: "stripe_connected",
        userId: req.userId,
        ip: req.ip,
        details: {
          stripeAccountId: account.id,
          stripeMode: stripeMode, // Log mode, NOT the key
          isTestMode: isTestMode,
        },
      });

      res.json({ 
        success: true, 
        accountId: account.id,
        stripeMode: stripeMode, // Return mode to client
        isTestMode: isTestMode,
        // Don't echo back the API key
      });
    } catch (stripeError: any) {
      auditLog({
        action: "stripe_connection_failed",
        userId: req.userId,
        ip: req.ip,
        details: {
          error: stripeError.type || "unknown",
          attemptedMode: stripeMode, // Log attempted mode
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
