import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import Stripe from "stripe";
import { format } from "date-fns";

const prisma = new PrismaClient();

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const invoicesCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getCachedData<T>(key: string): T | null {
  const entry = invoicesCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  invoicesCache.set(key, { data, timestamp: Date.now() });
}

export const getInvoices: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { status, limit = "50" } = req.query as {
      status?: string;
      limit?: string;
    };

    // Check cache first (include status in cache key)
    const cacheKey = `invoices_${req.userId}_${status || "all"}_${limit}`;
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

    const queryParams: Stripe.InvoiceListParams = {
      limit: parseInt(limit),
      expand: ["data.customer"], // OPTIMIZED: Expand customer data in single request
    };

    if (status && status !== "all") {
      queryParams.status = status as Stripe.InvoiceListParams["status"];
    }

    const invoices = await stripe.invoices.list(queryParams);

    // OPTIMIZED: No additional API calls needed - customer data is already expanded
    const invoicesWithDetails = invoices.data.map((invoice) => {
      let customerName = "Unknown Customer";
      let customerEmail = "";
      let customerId = "";

      if (invoice.customer) {
        if (typeof invoice.customer === "object") {
          const customer = invoice.customer as Stripe.Customer;
          customerName = customer.name || customer.email || "Unknown Customer";
          customerEmail = customer.email || "";
          customerId = customer.id;
        } else {
          customerId = invoice.customer;
        }
      }

      return {
        id: invoice.id,
        number: invoice.number || invoice.id,
        customer: customerName,
        customerEmail,
        customerId,
        amount: invoice.amount_due / 100,
        amountPaid: invoice.amount_paid / 100,
        amountRemaining: invoice.amount_remaining / 100,
        status: invoice.status || "unknown",
        dueDate: invoice.due_date
          ? format(new Date(invoice.due_date * 1000), "yyyy-MM-dd")
          : null,
        created: format(new Date(invoice.created * 1000), "yyyy-MM-dd"),
        currency: invoice.currency.toUpperCase(),
        pdfUrl: invoice.invoice_pdf || null,
        hostedUrl: invoice.hosted_invoice_url || null,
      };
    });

    const response = { invoices: invoicesWithDetails };
    
    // Cache the response
    setCachedData(cacheKey, response);

    res.json(response);
  } catch (error: any) {
    console.error("Invoices fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch invoices",
    });
  }
};
