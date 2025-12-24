import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";

const prisma = new PrismaClient();

export const handleGetMetrics: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const dateStart = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateEnd = endDate ? new Date(endDate) : new Date();

    // Get user's Stripe connection
    const stripeConnection = await prisma.stripeConnection.findUnique({
      where: { userId: req.userId },
    });

    if (!stripeConnection) {
      return res.json({
        mrr: 0,
        arr: 0,
        activeSubscriptions: 0,
        failedPayments: 0,
        totalRevenue: 0,
        invoices: [],
        dailyRevenue: [],
      });
    }

    // Get invoices for date range
    const invoices = await prisma.invoice.findMany({
      where: {
        stripeConnectionId: stripeConnection.id,
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate metrics
    const paidInvoices = invoices.filter((i) => i.status === "paid");
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    // Calculate daily revenue for chart
    const dailyRevenueMap = new Map<string, number>();
    paidInvoices.forEach((invoice) => {
      const date = invoice.createdAt.toISOString().split("T")[0];
      dailyRevenueMap.set(date, (dailyRevenueMap.get(date) || 0) + invoice.amount);
    });

    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, amount]) => ({
        date,
        revenue: amount / 100, // Convert cents to dollars
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // For MVP, estimate MRR and ARR from total revenue
    const daysInRange = Math.max(
      1,
      Math.ceil((dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgDailyRevenue = totalRevenue / daysInRange;
    const mrr = Math.round(avgDailyRevenue * 30);
    const arr = Math.round(avgDailyRevenue * 365);

    const failedPayments = invoices.filter(
      (i) => i.status === "uncollectible"
    ).length;

    res.json({
      mrr: Math.round(mrr / 100), // Convert to dollars
      arr: Math.round(arr / 100),
      activeSubscriptions: Math.max(0, paidInvoices.length),
      failedPayments,
      totalRevenue: Math.round(totalRevenue / 100),
      invoices: invoices.map((i) => ({
        id: i.id,
        amount: i.amount / 100,
        currency: i.currency,
        status: i.status,
        paidAt: i.paidAt,
        date: i.createdAt,
      })),
      dailyRevenue,
    });
  } catch (error) {
    console.error("Get metrics error:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};
