import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import Stripe from "stripe";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const prisma = new PrismaClient();

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const analyticsCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minute cache for analytics (heavier computation)

function getCachedData<T>(key: string): T | null {
  const entry = analyticsCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  analyticsCache.set(key, { data, timestamp: Date.now() });
}

export const getAnalytics: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check cache first
    const cacheKey = `analytics_${req.userId}`;
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

    // Calculate time ranges
    const now = new Date();
    const twelveMonthsAgo = Math.floor(subMonths(now, 12).getTime() / 1000);
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    // OPTIMIZED: Fetch all data in parallel
    const [
      customersResponse,
      chargesLast12Months,
      chargesLast30Days,
      subscriptionsAll,
      invoicesForTopCustomers,
      productsResponse,
    ] = await Promise.all([
      stripe.customers.list({ limit: 100, created: { gte: twelveMonthsAgo } }),
      stripe.charges.list({ limit: 100, created: { gte: twelveMonthsAgo } }),
      stripe.charges.list({ limit: 100, created: { gte: thirtyDaysAgo } }),
      stripe.subscriptions.list({ limit: 100, status: "all" }),
      stripe.invoices.list({ limit: 100, status: "paid" }),
      stripe.products.list({ limit: 20, active: true }),
    ]);

    // Build customer lookup map
    const customerMap = new Map<string, Stripe.Customer>();
    for (const customer of customersResponse.data) {
      customerMap.set(customer.id, customer);
    }

    // OPTIMIZED: Customer growth - process in single pass
    const customerGrowth = processCustomerGrowth(customersResponse.data);

    // OPTIMIZED: Revenue by month - process charges in single pass
    const revenueByMonth = processRevenueByMonth(chargesLast12Months.data);

    // OPTIMIZED: Top customers - calculate from invoices already fetched
    const topCustomers = calculateTopCustomers(invoicesForTopCustomers.data, customerMap);

    // OPTIMIZED: Payment stats - process charges in single pass
    const paymentStats = calculatePaymentStats(chargesLast30Days.data);

    // OPTIMIZED: Churn analysis - process subscriptions in single pass
    const churnAnalysis = calculateChurnAnalysis(subscriptionsAll.data);

    // OPTIMIZED: Revenue by product - use already fetched data
    const revenueByProduct = await calculateRevenueByProduct(stripe, productsResponse.data, subscriptionsAll.data);

    const response = {
      customerGrowth,
      revenueByMonth,
      topCustomers,
      paymentStats,
      churnAnalysis,
      revenueByProduct,
    };

    // Cache the response
    setCachedData(cacheKey, response);

    res.json(response);
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch analytics",
    });
  }
};

// Process customer growth in single pass
function processCustomerGrowth(customers: Stripe.Customer[]) {
  const monthlyMap = new Map<string, number>();
  const now = new Date();
  
  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, "yyyy-MM");
    monthlyMap.set(monthKey, 0);
  }
  
  // Count customers per month
  for (const customer of customers) {
    const createdDate = new Date(customer.created * 1000);
    const monthKey = format(createdDate, "yyyy-MM");
    const current = monthlyMap.get(monthKey);
    if (current !== undefined) {
      monthlyMap.set(monthKey, current + 1);
    }
  }
  
  // Calculate cumulative totals and format
  const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cumulative = 0;
  
  return sortedEntries.map(([monthKey, newCustomers]) => {
    cumulative += newCustomers;
    return {
      month: format(new Date(monthKey + "-01"), "MMM yyyy"),
      newCustomers,
      total: cumulative,
    };
  });
}

// Process revenue by month in single pass
function processRevenueByMonth(charges: Stripe.Charge[]) {
  const monthlyMap = new Map<string, number>();
  const now = new Date();
  
  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, "yyyy-MM");
    monthlyMap.set(monthKey, 0);
  }
  
  // Sum revenue per month
  for (const charge of charges) {
    if (charge.status === "succeeded") {
      const chargeDate = new Date(charge.created * 1000);
      const monthKey = format(chargeDate, "yyyy-MM");
      const current = monthlyMap.get(monthKey);
      if (current !== undefined) {
        monthlyMap.set(monthKey, current + charge.amount / 100);
      }
    }
  }
  
  // Format results
  const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  return sortedEntries.map(([monthKey, revenue]) => ({
    month: format(new Date(monthKey + "-01"), "MMM yyyy"),
    revenue: Math.round(revenue),
  }));
}

// Calculate top customers from invoices
function calculateTopCustomers(
  invoices: Stripe.Invoice[],
  customerMap: Map<string, Stripe.Customer>
) {
  const customerSpending = new Map<string, { totalSpent: number; invoiceCount: number }>();
  
  for (const invoice of invoices) {
    if (invoice.status === "paid" && invoice.customer) {
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
      const existing = customerSpending.get(customerId) || { totalSpent: 0, invoiceCount: 0 };
      existing.totalSpent += invoice.amount_paid / 100;
      existing.invoiceCount++;
      customerSpending.set(customerId, existing);
    }
  }
  
  // Convert to array and sort by spending
  const sortedCustomers = Array.from(customerSpending.entries())
    .map(([customerId, spending]) => {
      const customer = customerMap.get(customerId);
      return {
        id: customerId,
        name: customer?.name || customer?.email || "Unknown",
        email: customer?.email || "",
        totalSpent: spending.totalSpent,
        invoiceCount: spending.invoiceCount,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
  
  return sortedCustomers;
}

// Calculate payment stats
function calculatePaymentStats(charges: Stripe.Charge[]) {
  const total = charges.length;
  const succeeded = charges.filter((c) => c.status === "succeeded").length;
  const failed = charges.filter((c) => c.status === "failed").length;
  
  return {
    total,
    succeeded,
    failed,
    successRate: total > 0 ? ((succeeded / total) * 100).toFixed(1) : "0.0",
  };
}

// Calculate churn analysis
function calculateChurnAnalysis(subscriptions: Stripe.Subscription[]) {
  const active = subscriptions.filter((s) => s.status === "active").length;
  const canceled = subscriptions.filter((s) => s.status === "canceled").length;
  const total = subscriptions.length;
  
  return {
    active,
    canceled,
    total,
    churnRate: total > 0 ? ((canceled / total) * 100).toFixed(1) : "0.0",
  };
}

// Calculate revenue by product - optimized with pre-fetched data
async function calculateRevenueByProduct(
  stripe: Stripe,
  products: Stripe.Product[],
  subscriptions: Stripe.Subscription[]
) {
  const productRevenueMap = new Map<string, number>();
  
  // Build price to product mapping from subscriptions
  const priceToProduct = new Map<string, string>();
  
  // Get all unique price IDs from subscriptions
  const priceIds = new Set<string>();
  for (const sub of subscriptions) {
    for (const item of sub.items.data) {
      priceIds.add(item.price.id);
      if (item.price.product) {
        const productId = typeof item.price.product === "string" ? item.price.product : item.price.product.id;
        priceToProduct.set(item.price.id, productId);
      }
    }
  }
  
  // Calculate revenue per product from active subscriptions
  for (const sub of subscriptions) {
    if (sub.status === "active") {
      for (const item of sub.items.data) {
        if (item.price.unit_amount && item.price.product) {
          const productId = typeof item.price.product === "string" ? item.price.product : item.price.product.id;
          const product = products.find((p) => p.id === productId);
          const productName = product?.name || "Unknown Product";
          
          const currentRevenue = productRevenueMap.get(productName) || 0;
          productRevenueMap.set(productName, currentRevenue + item.price.unit_amount / 100);
        }
      }
    }
  }
  
  // Convert to array and sort by revenue
  return Array.from(productRevenueMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}
