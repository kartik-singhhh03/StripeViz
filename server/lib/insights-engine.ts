/**
 * Rule-Based Insights Engine
 * 
 * Generates deterministic, explainable insights based on Stripe data.
 * No AI/ML - purely rule-based logic.
 */

import { Insight, InsightType, InsightSeverity, WeeklySummary, HealthIndicator, HealthStatus } from "@shared/api";

// ========================
// CONFIGURABLE THRESHOLDS
// ========================

export const INSIGHT_THRESHOLDS = {
  REVENUE_CHANGE_SIGNIFICANT: 15, // % change to trigger insight
  REVENUE_CHANGE_MAJOR: 30, // % change for critical insight
  FAILED_PAYMENTS_WARNING: 20, // % increase in failed payments
  FAILED_PAYMENTS_CRITICAL: 50, // % increase for critical
  SUBSCRIPTIONS_DROP_WARNING: 5, // % drop to trigger warning
  SUBSCRIPTIONS_DROP_CRITICAL: 15, // % drop for critical
  CHURN_HEALTHY: 3, // % churn rate considered healthy
  CHURN_WARNING: 5, // % churn rate for warning
  CHURN_CRITICAL: 10, // % churn rate for critical
  FAILED_PAYMENT_RATE_HEALTHY: 2, // % failed payment rate healthy
  FAILED_PAYMENT_RATE_WARNING: 5, // % failed payment rate warning
};

// ========================
// INSIGHT GENERATORS
// ========================

interface MetricsData {
  currentPeriod: {
    mrr: number;
    netRevenue: number;
    activeSubscriptions: number;
    failedPayments: number;
    churnRate: number;
    totalCustomers: number;
  };
  previousPeriod: {
    mrr: number;
    netRevenue: number;
    activeSubscriptions: number;
    failedPayments: number;
  };
}

function generateId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function generateInsights(data: MetricsData): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  // Revenue Change Insights
  const revenueChange = calculatePercentChange(
    data.currentPeriod.netRevenue,
    data.previousPeriod.netRevenue
  );

  if (Math.abs(revenueChange) >= INSIGHT_THRESHOLDS.REVENUE_CHANGE_SIGNIFICANT) {
    if (revenueChange > 0) {
      insights.push({
        id: generateId(),
        type: 'revenue_up',
        severity: revenueChange >= INSIGHT_THRESHOLDS.REVENUE_CHANGE_MAJOR ? 'positive' : 'positive',
        title: revenueChange >= INSIGHT_THRESHOLDS.REVENUE_CHANGE_MAJOR 
          ? '🚀 Major Revenue Growth!'
          : '📈 Revenue Increased',
        description: `Your revenue grew by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period.`,
        comparedPeriod: 'vs last 7 days',
        value: data.currentPeriod.netRevenue,
        change: revenueChange,
        icon: 'up',
        createdAt: now,
      });
    } else {
      insights.push({
        id: generateId(),
        type: 'revenue_down',
        severity: Math.abs(revenueChange) >= INSIGHT_THRESHOLDS.REVENUE_CHANGE_MAJOR ? 'critical' : 'warning',
        title: Math.abs(revenueChange) >= INSIGHT_THRESHOLDS.REVENUE_CHANGE_MAJOR
          ? '⚠️ Significant Revenue Drop'
          : '📉 Revenue Decreased',
        description: `Your revenue dropped by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period.`,
        comparedPeriod: 'vs last 7 days',
        value: data.currentPeriod.netRevenue,
        change: revenueChange,
        icon: 'down',
        createdAt: now,
      });
    }
  }

  // Failed Payments Insights
  const failedPaymentsChange = calculatePercentChange(
    data.currentPeriod.failedPayments,
    data.previousPeriod.failedPayments
  );

  if (data.currentPeriod.failedPayments > 0 && failedPaymentsChange >= INSIGHT_THRESHOLDS.FAILED_PAYMENTS_WARNING) {
    insights.push({
      id: generateId(),
      type: 'failed_payments_spike',
      severity: failedPaymentsChange >= INSIGHT_THRESHOLDS.FAILED_PAYMENTS_CRITICAL ? 'critical' : 'warning',
      title: failedPaymentsChange >= INSIGHT_THRESHOLDS.FAILED_PAYMENTS_CRITICAL
        ? '🚨 Failed Payments Spike'
        : '⚠️ Increase in Failed Payments',
      description: `Failed payments increased by ${failedPaymentsChange.toFixed(0)}%. Review and reach out to affected customers.`,
      comparedPeriod: 'vs last 7 days',
      value: data.currentPeriod.failedPayments,
      change: failedPaymentsChange,
      icon: 'warning',
      createdAt: now,
    });
  }

  // Subscriptions Drop Insights
  const subsChange = calculatePercentChange(
    data.currentPeriod.activeSubscriptions,
    data.previousPeriod.activeSubscriptions
  );

  if (subsChange < -INSIGHT_THRESHOLDS.SUBSCRIPTIONS_DROP_WARNING) {
    insights.push({
      id: generateId(),
      type: 'subscriptions_drop',
      severity: Math.abs(subsChange) >= INSIGHT_THRESHOLDS.SUBSCRIPTIONS_DROP_CRITICAL ? 'critical' : 'warning',
      title: Math.abs(subsChange) >= INSIGHT_THRESHOLDS.SUBSCRIPTIONS_DROP_CRITICAL
        ? '🚨 Significant Subscription Loss'
        : '⚠️ Active Subscriptions Declining',
      description: `Active subscriptions dropped by ${Math.abs(subsChange).toFixed(1)}%. Consider analyzing cancellation reasons.`,
      comparedPeriod: 'vs last 7 days',
      value: data.currentPeriod.activeSubscriptions,
      change: subsChange,
      icon: 'alert',
      createdAt: now,
    });
  }

  // Churn Warning
  if (data.currentPeriod.churnRate >= INSIGHT_THRESHOLDS.CHURN_WARNING) {
    insights.push({
      id: generateId(),
      type: 'churn_warning',
      severity: data.currentPeriod.churnRate >= INSIGHT_THRESHOLDS.CHURN_CRITICAL ? 'critical' : 'warning',
      title: data.currentPeriod.churnRate >= INSIGHT_THRESHOLDS.CHURN_CRITICAL
        ? '🚨 High Churn Rate Alert'
        : '⚠️ Elevated Churn Rate',
      description: `Your churn rate is ${data.currentPeriod.churnRate.toFixed(1)}%. Industry average is typically 3-5%.`,
      comparedPeriod: 'current period',
      value: data.currentPeriod.churnRate,
      icon: 'warning',
      createdAt: now,
    });
  }

  // All Good Insight (if no warnings)
  if (insights.length === 0) {
    insights.push({
      id: generateId(),
      type: 'healthy',
      severity: 'positive',
      title: '✅ Business Metrics Look Good',
      description: 'No significant changes detected. Your revenue and subscriptions are stable.',
      comparedPeriod: 'vs last 7 days',
      icon: 'check',
      createdAt: now,
    });
  }

  // Sort by severity: critical first, then warning, then positive
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    neutral: 2,
    positive: 3,
  };

  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ========================
// WEEKLY SUMMARY GENERATOR
// ========================

interface WeeklySummaryInput {
  revenueData: Array<{ date: string; gross: number; net: number }>;
  subscriptionsCreated: number;
  subscriptionsCanceled: number;
  failedPayments: number;
  recoveredPayments: number;
}

export function generateWeeklySummary(input: WeeklySummaryInput): WeeklySummary {
  const now = new Date();
  const periodEnd = now.toISOString().split('T')[0];
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Calculate this week's revenue (last 7 entries)
  const thisWeekData = input.revenueData.slice(-7);
  const previousWeekData = input.revenueData.slice(-14, -7);
  
  const totalRevenue = thisWeekData.reduce((sum, d) => sum + d.net, 0);
  const previousRevenue = previousWeekData.reduce((sum, d) => sum + d.net, 0);
  
  const revenueChange = totalRevenue - previousRevenue;
  const revenueChangePercent = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  return {
    totalRevenue,
    previousRevenue,
    revenueChange,
    revenueChangePercent,
    newSubscriptions: input.subscriptionsCreated,
    cancellations: input.subscriptionsCanceled,
    netSubscriptionChange: input.subscriptionsCreated - input.subscriptionsCanceled,
    failedPayments: input.failedPayments,
    recoveredPayments: input.recoveredPayments,
    periodStart,
    periodEnd,
  };
}

// ========================
// HEALTH INDICATOR GENERATOR
// ========================

interface HealthInput {
  revenueChange: number; // % change
  failedPaymentRate: number; // % of total payments
  churnRate: number; // %
}

export function generateHealthIndicator(input: HealthInput): HealthIndicator {
  // Calculate individual health scores
  const revenueHealth = getRevenueHealth(input.revenueChange);
  const paymentHealth = getPaymentHealth(input.failedPaymentRate);
  const churnHealth = getChurnHealth(input.churnRate);

  // Calculate overall score (weighted average)
  const scores: Record<HealthStatus, number> = {
    healthy: 100,
    watch: 60,
    attention: 20,
  };

  const revenueScore = scores[revenueHealth];
  const paymentScore = scores[paymentHealth];
  const churnScore = scores[churnHealth];

  // Weights: Revenue 40%, Payment 30%, Churn 30%
  const overallScore = Math.round(
    revenueScore * 0.4 + paymentScore * 0.3 + churnScore * 0.3
  );

  // Determine overall status
  let status: HealthStatus;
  if (overallScore >= 80) {
    status = 'healthy';
  } else if (overallScore >= 50) {
    status = 'watch';
  } else {
    status = 'attention';
  }

  // Generate reasons
  const reasons: string[] = [];
  
  if (revenueHealth === 'healthy') {
    reasons.push('Revenue is stable or growing');
  } else if (revenueHealth === 'watch') {
    reasons.push('Revenue showing minor fluctuation');
  } else {
    reasons.push('Revenue decline needs attention');
  }

  if (paymentHealth === 'healthy') {
    reasons.push('Payment success rate is excellent');
  } else if (paymentHealth === 'watch') {
    reasons.push('Some payment failures detected');
  } else {
    reasons.push('High payment failure rate');
  }

  if (churnHealth === 'healthy') {
    reasons.push('Churn rate is within healthy range');
  } else if (churnHealth === 'watch') {
    reasons.push('Churn rate slightly elevated');
  } else {
    reasons.push('Churn rate requires immediate attention');
  }

  const labels: Record<HealthStatus, string> = {
    healthy: 'Healthy',
    watch: 'Watch',
    attention: 'Needs Attention',
  };

  return {
    status,
    label: labels[status],
    reasons,
    score: overallScore,
    breakdown: {
      revenueHealth,
      paymentHealth,
      churnHealth,
    },
  };
}

function getRevenueHealth(revenueChange: number): HealthStatus {
  if (revenueChange >= -5) return 'healthy';
  if (revenueChange >= -15) return 'watch';
  return 'attention';
}

function getPaymentHealth(failedPaymentRate: number): HealthStatus {
  if (failedPaymentRate <= INSIGHT_THRESHOLDS.FAILED_PAYMENT_RATE_HEALTHY) return 'healthy';
  if (failedPaymentRate <= INSIGHT_THRESHOLDS.FAILED_PAYMENT_RATE_WARNING) return 'watch';
  return 'attention';
}

function getChurnHealth(churnRate: number): HealthStatus {
  if (churnRate <= INSIGHT_THRESHOLDS.CHURN_HEALTHY) return 'healthy';
  if (churnRate <= INSIGHT_THRESHOLDS.CHURN_WARNING) return 'watch';
  return 'attention';
}

// ========================
// DATA FRESHNESS CALCULATOR
// ========================

export function calculateDataFreshness(lastSyncedAt: Date | null): {
  lastSyncedAt: string;
  minutesAgo: number;
  isStale: boolean;
  status: 'fresh' | 'recent' | 'stale';
} {
  if (!lastSyncedAt) {
    return {
      lastSyncedAt: new Date().toISOString(),
      minutesAgo: 0,
      isStale: false,
      status: 'fresh',
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - lastSyncedAt.getTime();
  const minutesAgo = Math.floor(diffMs / (1000 * 60));

  let status: 'fresh' | 'recent' | 'stale';
  let isStale: boolean;

  if (minutesAgo <= 5) {
    status = 'fresh';
    isStale = false;
  } else if (minutesAgo <= 60) {
    status = 'recent';
    isStale = false;
  } else {
    status = 'stale';
    isStale = true;
  }

  return {
    lastSyncedAt: lastSyncedAt.toISOString(),
    minutesAgo,
    isStale,
    status,
  };
}
