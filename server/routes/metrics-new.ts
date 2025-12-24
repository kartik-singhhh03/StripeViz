import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import Stripe from "stripe";
import { format, subDays, subMonths } from "date-fns";
import {
  generateInsights,
  generateWeeklySummary,
  generateHealthIndicator,
  calculateDataFreshness,
} from "../lib/insights-engine";

const prisma = new PrismaClient();

// Enhanced in-memory cache with stale-while-revalidate
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isRefreshing?: boolean;
}

const metricsCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes fresh cache
const STALE_TTL = 10 * 60 * 1000; // Serve stale data up to 10 minutes

function getCachedData<T>(key: string): { data: T | null; isStale: boolean } {
  const entry = metricsCache.get(key);
  if (!entry) return { data: null, isStale: false };
  
  const age = Date.now() - entry.timestamp;
  if (age < CACHE_TTL) return { data: entry.data as T, isStale: false };
  if (age < STALE_TTL) return { data: entry.data as T, isStale: true };
  return { data: null, isStale: false };
}

function setCachedData<T>(key: string, data: T): void {
  metricsCache.set(key, { data, timestamp: Date.now(), isRefreshing: false });
}

function markRefreshing(key: string): void {
  const entry = metricsCache.get(key);
  if (entry) entry.isRefreshing = true;
}

function isRefreshing(key: string): boolean {
  return metricsCache.get(key)?.isRefreshing || false;
}

// Build customer lookup map for O(1) access
function buildCustomerMap(customers: Stripe.Customer[]): Map<string, { name: string; email: string }> {
  const map = new Map();
  for (const customer of customers) {
    map.set(customer.id, {
      name: customer.name || customer.email || "Unknown Customer",
      email: customer.email || "",
    });
  }
  return map;
}

// Optimized: Process charges into daily revenue data in single pass
function processChargesIntoDailyRevenue(charges: Stripe.Charge[]): Array<{ date: string; gross: number; net: number }> {
  const dailyMap = new Map<string, { gross: number; net: number }>();
  
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = subDays(now, i);
    dailyMap.set(format(date, "yyyy-MM-dd"), { gross: 0, net: 0 });
  }
  
  for (const charge of charges) {
    if (charge.status === "succeeded") {
      const dateKey = format(new Date(charge.created * 1000), "yyyy-MM-dd");
      const existing = dailyMap.get(dateKey);
      if (existing) {
        existing.gross += charge.amount / 100;
        existing.net += (charge.amount - (charge.amount_refunded || 0)) / 100;
      }
    }
  }
  
  return Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateKey, values]) => ({
      date: format(new Date(dateKey), "MMM dd"),
      gross: Math.round(values.gross),
      net: Math.round(values.net),
    }));
}

// Optimized: Process subscriptions into monthly activity
function processSubscriptionsIntoMonthlyActivity(
  allSubscriptions: Stripe.Subscription[]
): Array<{ month: string; new: number; canceled: number }> {
  const monthlyMap = new Map<string, { new: number; canceled: number }>();
  
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    monthlyMap.set(format(subMonths(now, i), "yyyy-MM"), { new: 0, canceled: 0 });
  }
  
  for (const sub of allSubscriptions) {
    const createdKey = format(new Date(sub.created * 1000), "yyyy-MM");
    const createdEntry = monthlyMap.get(createdKey);
    if (createdEntry) createdEntry.new++;
    
    if (sub.canceled_at) {
      const canceledKey = format(new Date(sub.canceled_at * 1000), "yyyy-MM");
      const canceledEntry = monthlyMap.get(canceledKey);
      if (canceledEntry) canceledEntry.canceled++;
    }
  }
  
  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, values]) => ({
      month: format(new Date(monthKey + "-01"), "MMM"),
      ...values,
    }));
}

// Core metrics fetching logic
async function fetchMetricsFromStripe(userId: string): Promise<{ data?: any; error?: string; status?: number }> {
  try {
    const connection = await prisma.stripeConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.accessToken) {
      return { error: "Stripe not connected", status: 400 };
    }

    const stripe = new Stripe(connection.accessToken, {
      apiVersion: "2025-12-15.clover",
    });

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;

    // OPTIMIZED: All API calls in parallel
    const [
      subscriptionsResponse,
      chargesLast30Days,
      chargesPreviousPeriod,
      failedPaymentsResponse,
      previousFailedPaymentsResponse,
      customersResponse,
      invoicesResponse,
    ] = await Promise.all([
      stripe.subscriptions.list({ limit: 100, status: "all", created: { gte: sixMonthsAgo } }),
      stripe.charges.list({ limit: 100, created: { gte: thirtyDaysAgo } }),
      stripe.charges.list({ limit: 100, created: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }),
      stripe.paymentIntents.list({ limit: 100, created: { gte: thirtyDaysAgo } }),
      stripe.paymentIntents.list({ limit: 100, created: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }),
      stripe.customers.list({ limit: 100 }),
      stripe.invoices.list({ limit: 20, expand: ["data.customer"] }),
    ]);

    const customerMap = buildCustomerMap(customersResponse.data);
    const allSubscriptions = subscriptionsResponse.data;
    const activeSubscriptions = allSubscriptions.filter((sub) => sub.status === "active");
    const pastDueSubscriptions = allSubscriptions.filter((sub) => sub.status === "past_due");
    const canceledSubscriptions = allSubscriptions.filter((sub) => sub.status === "canceled");

    const mrr = activeSubscriptions.reduce((sum, sub) => {
      return sum + sub.items.data.reduce((itemSum, item) => itemSum + (item.price.unit_amount || 0), 0) / 100;
    }, 0);

    const failedPaymentsData = failedPaymentsResponse.data.filter(
      (pi) => pi.status === "requires_payment_method" || pi.status === "canceled"
    );
    const failedCount = failedPaymentsData.length;
    const previousFailedCount = previousFailedPaymentsResponse.data.filter(
      (pi) => pi.status === "requires_payment_method" || pi.status === "canceled"
    ).length;

    const netRevenue = chargesLast30Days.data.reduce((sum, charge) => {
      if (charge.status === "succeeded") {
        return sum + charge.amount / 100 - (charge.amount_refunded || 0) / 100;
      }
      return sum;
    }, 0);

    const previousPeriodRevenue = chargesPreviousPeriod.data.reduce((sum, charge) => {
      if (charge.status === "succeeded") {
        return sum + charge.amount / 100 - (charge.amount_refunded || 0) / 100;
      }
      return sum;
    }, 0);

    const totalCustomers = customersResponse.data.length;
    const churnRate = allSubscriptions.length > 0
      ? (canceledSubscriptions.length / allSubscriptions.length) * 100 : 0;

    const previousPeriodMetrics = {
      mrr: mrr * 0.95,
      netRevenue: previousPeriodRevenue,
      activeSubscriptions: activeSubscriptions.length,
      failedPayments: previousFailedCount,
    };

    const revenueData = processChargesIntoDailyRevenue(chargesLast30Days.data);
    const monthlyActivity = processSubscriptionsIntoMonthlyActivity(allSubscriptions);

    const formattedFailedPayments = failedPaymentsData.slice(0, 10).map((pi) => {
      const customerInfo = customerMap.get(pi.customer as string) || { name: "Unknown Customer" };
      return {
        id: pi.id,
        customer: customerInfo.name,
        amount: pi.amount / 100,
        reason: pi.last_payment_error?.message || "Payment method required",
        date: format(new Date(pi.created * 1000), "yyyy-MM-dd"),
        retries: 0,
      };
    });

    const formattedInvoices = invoicesResponse.data.map((invoice) => {
      let customerName = "Unknown Customer";
      if (invoice.customer && typeof invoice.customer === "object") {
        const customer = invoice.customer as Stripe.Customer;
        customerName = customer.name || customer.email || "Unknown Customer";
      } else if (typeof invoice.customer === "string") {
        customerName = customerMap.get(invoice.customer)?.name || "Unknown Customer";
      }
      return {
        id: invoice.id,
        customer: customerName,
        amount: invoice.amount_due / 100,
        status: invoice.status || "unknown",
        date: format(new Date(invoice.created * 1000), "yyyy-MM-dd"),
      };
    });

    return {
      data: {
        mrr,
        arr: mrr * 12,
        activeSubscriptions: activeSubscriptions.length,
        failedPayments: failedCount,
        netRevenue,
        churnRate,
        totalCustomers,
        avgRevenuePerCustomer: totalCustomers > 0 ? netRevenue / totalCustomers : 0,
        revenueData,
        subscriptionStatus: [
          { name: "Active", value: activeSubscriptions.length, color: "#8b5cf6" },
          { name: "Past Due", value: pastDueSubscriptions.length, color: "#f59e0b" },
          { name: "Canceled", value: canceledSubscriptions.length, color: "#6366f1" },
        ],
        monthlyActivity,
        failedPaymentsList: formattedFailedPayments,
        invoices: formattedInvoices,
        insights: generateInsights({
          currentPeriod: { mrr, netRevenue, activeSubscriptions: activeSubscriptions.length, failedPayments: failedCount, churnRate, totalCustomers },
          previousPeriod: previousPeriodMetrics,
        }),
        weeklySummary: generateWeeklySummary({
          revenueData,
          subscriptionsCreated: monthlyActivity.length > 0 ? monthlyActivity[monthlyActivity.length - 1].new : 0,
          subscriptionsCanceled: monthlyActivity.length > 0 ? monthlyActivity[monthlyActivity.length - 1].canceled : 0,
          failedPayments: failedCount,
          recoveredPayments: 0,
        }),
        healthIndicator: generateHealthIndicator({
          revenueChange: previousPeriodMetrics.netRevenue > 0
            ? ((netRevenue - previousPeriodMetrics.netRevenue) / previousPeriodMetrics.netRevenue) * 100 : 0,
          failedPaymentRate: chargesLast30Days.data.length > 0 ? (failedCount / chargesLast30Days.data.length) * 100 : 0,
          churnRate,
        }),
        dataFreshness: calculateDataFreshness(new Date()),
        previousPeriod: previousPeriodMetrics,
      },
    };
  } catch (error: any) {
    console.error("Stripe fetch error:", error);
    return { error: "Failed to fetch metrics", status: 500 };
  }
}

// Background refresh function
async function refreshMetricsInBackground(userId: string, cacheKey: string) {
  try {
    const result = await fetchMetricsFromStripe(userId);
    if (result.data) setCachedData(cacheKey, result.data);
  } catch (error) {
    console.error("Background refresh error:", error);
  }
}

export const getMetrics: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const cacheKey = `metrics_${req.userId}`;
    const { data: cachedMetrics, isStale } = getCachedData<any>(cacheKey);
    
    // Return fresh cached data immediately
    if (cachedMetrics && !isStale) {
      return res.json(cachedMetrics);
    }
    
    // Return stale data and refresh in background
    if (cachedMetrics && isStale && !isRefreshing(cacheKey)) {
      markRefreshing(cacheKey);
      refreshMetricsInBackground(req.userId, cacheKey).catch(console.error);
      return res.json(cachedMetrics);
    }

    // No cache - fetch fresh
    const result = await fetchMetricsFromStripe(req.userId);
    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }
    
    setCachedData(cacheKey, result.data);
    res.json(result.data);
  } catch (error: any) {
    console.error("Metrics fetch error:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};
