import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";
import Stripe from "stripe";
import { format, subDays } from "date-fns";

const prisma = new PrismaClient();

// Pro plan check middleware
async function checkProPlan(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  return subscription?.plan === "pro" && subscription?.status === "active";
}

// Generate CSV from array of objects
function generateCSV(data: Record<string, any>[], columns: { key: string; header: string }[]): string {
  if (data.length === 0) {
    return columns.map(c => c.header).join(",") + "\n";
  }

  const header = columns.map(c => c.header).join(",");
  const rows = data.map(row =>
    columns.map(c => {
      const value = row[c.key];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    }).join(",")
  );

  return [header, ...rows].join("\n");
}

// ========================
// EXPORT INVOICES
// ========================

export const exportInvoices: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check Pro plan
    const isPro = await checkProPlan(req.userId);
    if (!isPro) {
      return res.status(403).json({ 
        error: "Pro plan required",
        message: "CSV export is a Pro feature. Upgrade to access exports."
      });
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

    // Get date range from query params
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : subDays(new Date(), 30);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const invoices = await stripe.invoices.list({
      limit: 100,
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
    });

    const exportData = await Promise.all(
      invoices.data.map(async (invoice) => {
        let customerName = "Unknown";
        let customerEmail = "";
        
        if (invoice.customer) {
          try {
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            customerName = (customer as any).name || "Unknown";
            customerEmail = (customer as any).email || "";
          } catch (e) {}
        }

        return {
          invoiceId: invoice.id,
          customerName,
          customerEmail,
          amount: (invoice.amount_due / 100).toFixed(2),
          currency: invoice.currency.toUpperCase(),
          status: invoice.status || "unknown",
          createdDate: format(new Date(invoice.created * 1000), "yyyy-MM-dd"),
          paidDate: invoice.status_transitions?.paid_at 
            ? format(new Date(invoice.status_transitions.paid_at * 1000), "yyyy-MM-dd")
            : "",
          dueDate: invoice.due_date 
            ? format(new Date(invoice.due_date * 1000), "yyyy-MM-dd")
            : "",
        };
      })
    );

    const columns = [
      { key: "invoiceId", header: "Invoice ID" },
      { key: "customerName", header: "Customer Name" },
      { key: "customerEmail", header: "Customer Email" },
      { key: "amount", header: "Amount" },
      { key: "currency", header: "Currency" },
      { key: "status", header: "Status" },
      { key: "createdDate", header: "Created Date" },
      { key: "paidDate", header: "Paid Date" },
      { key: "dueDate", header: "Due Date" },
    ];

    const csv = generateCSV(exportData, columns);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=invoices_${format(new Date(), "yyyy-MM-dd")}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error("Export invoices error:", error);
    res.status(500).json({ error: "Failed to export invoices" });
  }
};

// ========================
// EXPORT PAYMENTS
// ========================

export const exportPayments: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isPro = await checkProPlan(req.userId);
    if (!isPro) {
      return res.status(403).json({ 
        error: "Pro plan required",
        message: "CSV export is a Pro feature. Upgrade to access exports."
      });
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

    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : subDays(new Date(), 30);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const charges = await stripe.charges.list({
      limit: 100,
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
    });

    const exportData = await Promise.all(
      charges.data.map(async (charge) => {
        let customerName = "Unknown";
        
        if (charge.customer) {
          try {
            const customer = await stripe.customers.retrieve(charge.customer as string);
            customerName = (customer as any).name || (customer as any).email || "Unknown";
          } catch (e) {}
        }

        return {
          paymentId: charge.id,
          customerName,
          amount: (charge.amount / 100).toFixed(2),
          currency: charge.currency.toUpperCase(),
          status: charge.status,
          date: format(new Date(charge.created * 1000), "yyyy-MM-dd"),
          paymentMethod: charge.payment_method_details?.type || "unknown",
        };
      })
    );

    const columns = [
      { key: "paymentId", header: "Payment ID" },
      { key: "customerName", header: "Customer" },
      { key: "amount", header: "Amount" },
      { key: "currency", header: "Currency" },
      { key: "status", header: "Status" },
      { key: "date", header: "Date" },
      { key: "paymentMethod", header: "Payment Method" },
    ];

    const csv = generateCSV(exportData, columns);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=payments_${format(new Date(), "yyyy-MM-dd")}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error("Export payments error:", error);
    res.status(500).json({ error: "Failed to export payments" });
  }
};

// ========================
// EXPORT SUBSCRIPTIONS
// ========================

export const exportSubscriptions: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isPro = await checkProPlan(req.userId);
    if (!isPro) {
      return res.status(403).json({ 
        error: "Pro plan required",
        message: "CSV export is a Pro feature. Upgrade to access exports."
      });
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

    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
    });

    const exportData = await Promise.all(
      subscriptions.data.map(async (sub) => {
        let customerName = "Unknown";
        let customerEmail = "";
        
        if (sub.customer) {
          try {
            const customer = await stripe.customers.retrieve(sub.customer as string);
            customerName = (customer as any).name || "Unknown";
            customerEmail = (customer as any).email || "";
          } catch (e) {}
        }

        const price = sub.items.data[0]?.price;
        const planName = price?.nickname || price?.id || "Unknown Plan";
        const amount = price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : "0.00";

        // Get current period end from the first item's period
        const currentPeriodEnd = sub.items?.data?.[0]?.current_period_end;
        
        return {
          subscriptionId: sub.id,
          customerName,
          customerEmail,
          plan: planName,
          amount,
          currency: (price?.currency || "usd").toUpperCase(),
          status: sub.status,
          startDate: format(new Date(sub.start_date * 1000), "yyyy-MM-dd"),
          currentPeriodEnd: currentPeriodEnd 
            ? format(new Date(currentPeriodEnd * 1000), "yyyy-MM-dd")
            : "N/A",
        };
      })
    );

    const columns = [
      { key: "subscriptionId", header: "Subscription ID" },
      { key: "customerName", header: "Customer Name" },
      { key: "customerEmail", header: "Customer Email" },
      { key: "plan", header: "Plan" },
      { key: "amount", header: "Amount" },
      { key: "currency", header: "Currency" },
      { key: "status", header: "Status" },
      { key: "startDate", header: "Start Date" },
      { key: "currentPeriodEnd", header: "Current Period End" },
    ];

    const csv = generateCSV(exportData, columns);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=subscriptions_${format(new Date(), "yyyy-MM-dd")}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error("Export subscriptions error:", error);
    res.status(500).json({ error: "Failed to export subscriptions" });
  }
};

// ========================
// EXPORT REVENUE BY DATE
// ========================

export const exportRevenue: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isPro = await checkProPlan(req.userId);
    if (!isPro) {
      return res.status(403).json({ 
        error: "Pro plan required",
        message: "CSV export is a Pro feature. Upgrade to access exports."
      });
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

    const days = parseInt(req.query.days as string) || 30;
    const exportData: any[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const startOfDay = Math.floor(new Date(date.setHours(0, 0, 0, 0)).getTime() / 1000);
      const endOfDay = Math.floor(new Date(date.setHours(23, 59, 59, 999)).getTime() / 1000);

      try {
        const [charges, subscriptions] = await Promise.all([
          stripe.charges.list({
            limit: 100,
            created: { gte: startOfDay, lte: endOfDay },
          }),
          stripe.subscriptions.list({
            limit: 100,
            created: { gte: startOfDay, lte: endOfDay },
          }),
        ]);

        const grossRevenue = charges.data.reduce((sum, c) => 
          c.status === "succeeded" ? sum + c.amount / 100 : sum, 0
        );
        const refunds = charges.data.reduce((sum, c) => 
          sum + (c.amount_refunded || 0) / 100, 0
        );
        const netRevenue = grossRevenue - refunds;

        // Get canceled subscriptions for that day
        const canceledSubs = await stripe.subscriptions.list({
          limit: 100,
          status: "canceled",
        });
        const canceledOnDay = canceledSubs.data.filter(sub => {
          if (!sub.canceled_at) return false;
          return sub.canceled_at >= startOfDay && sub.canceled_at <= endOfDay;
        }).length;

        exportData.push({
          date: format(date, "yyyy-MM-dd"),
          grossRevenue: grossRevenue.toFixed(2),
          netRevenue: netRevenue.toFixed(2),
          refunds: refunds.toFixed(2),
          newSubscriptions: subscriptions.data.length,
          cancellations: canceledOnDay,
        });
      } catch (e) {
        exportData.push({
          date: format(date, "yyyy-MM-dd"),
          grossRevenue: "0.00",
          netRevenue: "0.00",
          refunds: "0.00",
          newSubscriptions: 0,
          cancellations: 0,
        });
      }
    }

    const columns = [
      { key: "date", header: "Date" },
      { key: "grossRevenue", header: "Gross Revenue" },
      { key: "netRevenue", header: "Net Revenue" },
      { key: "refunds", header: "Refunds" },
      { key: "newSubscriptions", header: "New Subscriptions" },
      { key: "cancellations", header: "Cancellations" },
    ];

    const csv = generateCSV(exportData, columns);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=revenue_${format(new Date(), "yyyy-MM-dd")}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error("Export revenue error:", error);
    res.status(500).json({ error: "Failed to export revenue" });
  }
};

// ========================
// CHECK EXPORT ACCESS
// ========================

export const checkExportAccess: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isPro = await checkProPlan(req.userId);
    res.json({ hasAccess: isPro, plan: isPro ? "pro" : "free" });
  } catch (error) {
    res.status(500).json({ error: "Failed to check export access" });
  }
};
