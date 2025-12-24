import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import Stripe from "stripe";

const prisma = new PrismaClient();

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const customersCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getCachedData<T>(key: string): T | null {
  const entry = customersCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  customersCache.set(key, { data, timestamp: Date.now() });
}

export const getCustomers: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check cache first
    const cacheKey = `customers_${req.userId}`;
    const cachedData = getCachedData<any>(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const connection = await prisma.stripeConnection.findUnique({
      where: { userId: req.userId },
    });

    if (!connection || !connection.accessToken) {
      return res.status(400).json({ error: "Stripe not connected" });
    }

    const stripe = new Stripe(connection.accessToken, {
      apiVersion: "2025-12-15.clover",
    });

    // OPTIMIZED: Fetch all data in parallel instead of N+1 queries
    const [customersResponse, subscriptionsResponse, invoicesResponse] = await Promise.all([
      stripe.customers.list({ limit: 100 }),
      stripe.subscriptions.list({ limit: 100, status: "all" }),
      stripe.invoices.list({ limit: 100, status: "paid" }),
    ]);

    // Build lookup maps for O(1) access
    const subscriptionsByCustomer = new Map<string, Stripe.Subscription[]>();
    for (const sub of subscriptionsResponse.data) {
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const existing = subscriptionsByCustomer.get(customerId) || [];
      existing.push(sub);
      subscriptionsByCustomer.set(customerId, existing);
    }

    const invoicesByCustomer = new Map<string, { totalSpent: number; count: number }>();
    for (const inv of invoicesResponse.data) {
      if (inv.status === "paid" && inv.customer) {
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer.id;
        const existing = invoicesByCustomer.get(customerId) || { totalSpent: 0, count: 0 };
        existing.totalSpent += inv.amount_paid / 100;
        existing.count++;
        invoicesByCustomer.set(customerId, existing);
      }
    }

    // Process customers using lookup maps (O(1) per customer)
    const customersWithDetails = customersResponse.data.map((customer) => {
      const subscriptions = subscriptionsByCustomer.get(customer.id) || [];
      const invoiceData = invoicesByCustomer.get(customer.id) || { totalSpent: 0, count: 0 };
      
      const activeSubscription = subscriptions.find((sub) => sub.status === "active");

      return {
        id: customer.id,
        name: customer.name || "Unknown",
        email: customer.email || "No email",
        created: new Date(customer.created * 1000).toISOString(),
        totalSpent: invoiceData.totalSpent,
        subscriptionStatus: activeSubscription
          ? activeSubscription.status
          : subscriptions.length > 0
          ? subscriptions[0].status
          : "none",
        subscriptionCount: subscriptions.length,
        invoiceCount: invoiceData.count,
        currency: customer.currency || "usd",
      };
    });

    const response = { customers: customersWithDetails };
    
    // Cache the response
    setCachedData(cacheKey, response);

    res.json(response);
  } catch (error: any) {
    console.error("Customers fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
};
