/**
 * Rule-Based Insights Engine
 * 
 * Generates deterministic, explainable insights based on Stripe data.
 * No AI/ML - purely rule-based logic with statistical algorithms.
 * 
 * Algorithms Used:
 * 1. Sliding Window Analysis - Trend detection
 * 2. Z-Score - Anomaly detection (like banks use)
 * 3. Cohort Retention - Product quality analysis
 * 4. Pareto Analysis - 80/20 revenue concentration
 * 5. Rule-Based Prediction - Forecasting with confidence bands
 */

import { 
  Insight, InsightType, InsightSeverity, WeeklySummary, HealthIndicator, HealthStatus,
  ZScoreAnomaly, BusinessMilestone, TimelineEvent, CohortData, CohortRetentionMatrix,
  ParetoAnalysis, ParetoSegment, RevenueForecasting, ForecastDataPoint,
  PaymentFunnel, FunnelStep, RecoverableRevenue, RecoverableItem,
  WhatIfScenario, WhatIfResult
} from "@shared/api";

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
  // Z-Score thresholds
  ZSCORE_UNUSUAL: 2, // |z| > 2 = unusual
  ZSCORE_CRITICAL: 3, // |z| > 3 = critical anomaly
};

// ========================
// STATISTICAL UTILITIES
// ========================

/**
 * Calculate mean of an array
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  const avg = mean ?? calculateMean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calculate Z-Score for a value
 * z = (value - mean) / stdDev
 * Used by banks for anomaly detection
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Detect anomalies using Z-Score
 */
export function detectAnomalies(
  values: Array<{ date: string; value: number }>,
  metricName: string
): ZScoreAnomaly[] {
  if (values.length < 3) return [];
  
  const numericValues = values.map(v => v.value);
  const mean = calculateMean(numericValues);
  const stdDev = calculateStdDev(numericValues, mean);
  
  const anomalies: ZScoreAnomaly[] = [];
  
  values.forEach(({ date, value }) => {
    const zScore = calculateZScore(value, mean, stdDev);
    const absZ = Math.abs(zScore);
    
    if (absZ >= INSIGHT_THRESHOLDS.ZSCORE_UNUSUAL) {
      anomalies.push({
        date,
        value,
        zScore,
        mean,
        stdDev,
        severity: absZ >= INSIGHT_THRESHOLDS.ZSCORE_CRITICAL ? 'critical' : 'unusual',
        direction: zScore > 0 ? 'spike' : 'drop',
        metricName,
        explanation: generateAnomalyExplanation(metricName, value, mean, zScore),
      });
    }
  });
  
  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

function generateAnomalyExplanation(
  metricName: string, 
  value: number, 
  mean: number, 
  zScore: number
): string {
  const percentDiff = ((value - mean) / mean * 100).toFixed(1);
  const direction = zScore > 0 ? 'above' : 'below';
  const severity = Math.abs(zScore) >= INSIGHT_THRESHOLDS.ZSCORE_CRITICAL ? 'significantly' : 'notably';
  
  return `${metricName} is ${severity} ${direction} average (${Math.abs(Number(percentDiff))}% ${direction} normal). This is a ${Math.abs(zScore).toFixed(1)} standard deviation event.`;
}

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

// ========================
// BUSINESS TIMELINE ANALYZER
// ========================

export interface TimelineInput {
  charges: Array<{ id: string; amount: number; created: number; customerId: string; customerName: string }>;
  subscriptions: Array<{ id: string; created: number; canceledAt?: number; customerId: string; customerName: string; amount: number }>;
  refunds: Array<{ id: string; amount: number; created: number }>;
}

export function generateBusinessTimeline(input: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // Sort all events by date
  const sortedCharges = [...input.charges].sort((a, b) => a.created - b.created);
  const sortedSubscriptions = [...input.subscriptions].sort((a, b) => a.created - b.created);
  
  // 1. First Payment Ever
  if (sortedCharges.length > 0) {
    const firstCharge = sortedCharges[0];
    events.push({
      id: `milestone_first_payment`,
      type: 'first_payment',
      date: new Date(firstCharge.created * 1000).toISOString(),
      title: '🎉 First Payment Received',
      description: `Your business received its first payment of $${(firstCharge.amount / 100).toFixed(2)}`,
      value: firstCharge.amount / 100,
      metadata: { customerId: firstCharge.customerId, customerName: firstCharge.customerName },
      icon: 'celebration',
      severity: 'positive',
    });
  }
  
  // 2. First Customer/Subscription
  if (sortedSubscriptions.length > 0) {
    const firstSub = sortedSubscriptions[0];
    events.push({
      id: `milestone_first_customer`,
      type: 'first_customer',
      date: new Date(firstSub.created * 1000).toISOString(),
      title: '🎯 First Subscriber',
      description: `${firstSub.customerName} became your first subscriber`,
      value: firstSub.amount / 100,
      metadata: { customerId: firstSub.customerId, customerName: firstSub.customerName },
      icon: 'user',
      severity: 'positive',
    });
  }
  
  // 3. Best Revenue Day (using Z-score to find max)
  const dailyRevenue = new Map<string, number>();
  sortedCharges.forEach(charge => {
    const date = new Date(charge.created * 1000).toISOString().split('T')[0];
    dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + charge.amount);
  });
  
  if (dailyRevenue.size > 0) {
    let bestDay = '';
    let maxRevenue = 0;
    dailyRevenue.forEach((revenue, date) => {
      if (revenue > maxRevenue) {
        maxRevenue = revenue;
        bestDay = date;
      }
    });
    
    if (bestDay) {
      events.push({
        id: `milestone_best_day`,
        type: 'best_revenue_day',
        date: new Date(bestDay).toISOString(),
        title: '🔥 Best Revenue Day',
        description: `You earned $${(maxRevenue / 100).toFixed(2)} - your highest single-day revenue!`,
        value: maxRevenue / 100,
        icon: 'fire',
        severity: 'positive',
      });
    }
  }
  
  // 4. Refund Spike Detection (using Z-score)
  const dailyRefunds = new Map<string, number>();
  input.refunds.forEach(refund => {
    const date = new Date(refund.created * 1000).toISOString().split('T')[0];
    dailyRefunds.set(date, (dailyRefunds.get(date) || 0) + refund.amount);
  });
  
  if (dailyRefunds.size >= 3) {
    const refundValues = Array.from(dailyRefunds.entries()).map(([date, value]) => ({ date, value }));
    const anomalies = detectAnomalies(refundValues, 'Refunds');
    
    const worstRefundDay = anomalies.find(a => a.direction === 'spike' && a.severity === 'critical');
    if (worstRefundDay) {
      events.push({
        id: `milestone_refund_spike`,
        type: 'refund_spike',
        date: new Date(worstRefundDay.date).toISOString(),
        title: '❌ Refund Spike Detected',
        description: `Unusual refund activity: $${(worstRefundDay.value / 100).toFixed(2)} refunded (${Math.abs(worstRefundDay.zScore).toFixed(1)}σ above normal)`,
        value: worstRefundDay.value / 100,
        icon: 'alert',
        severity: 'critical',
      });
    }
  }
  
  // 5. Worst Churn Day
  const dailyCancellations = new Map<string, number>();
  sortedSubscriptions.forEach(sub => {
    if (sub.canceledAt) {
      const date = new Date(sub.canceledAt * 1000).toISOString().split('T')[0];
      dailyCancellations.set(date, (dailyCancellations.get(date) || 0) + 1);
    }
  });
  
  if (dailyCancellations.size > 0) {
    let worstDay = '';
    let maxCancellations = 0;
    dailyCancellations.forEach((count, date) => {
      if (count > maxCancellations) {
        maxCancellations = count;
        worstDay = date;
      }
    });
    
    if (worstDay && maxCancellations > 1) {
      events.push({
        id: `milestone_worst_churn`,
        type: 'worst_churn_day',
        date: new Date(worstDay).toISOString(),
        title: '🚨 Highest Churn Day',
        description: `${maxCancellations} subscriptions canceled on this day`,
        value: maxCancellations,
        icon: 'warning',
        severity: 'warning',
      });
    }
  }
  
  // 6. Revenue Milestones ($1K, $10K, $100K, etc.)
  let cumulativeRevenue = 0;
  const milestones = [1000, 10000, 50000, 100000, 500000, 1000000];
  const hitMilestones = new Set<number>();
  
  sortedCharges.forEach(charge => {
    cumulativeRevenue += charge.amount / 100;
    
    milestones.forEach(milestone => {
      if (cumulativeRevenue >= milestone && !hitMilestones.has(milestone)) {
        hitMilestones.add(milestone);
        events.push({
          id: `milestone_revenue_${milestone}`,
          type: 'revenue_milestone',
          date: new Date(charge.created * 1000).toISOString(),
          title: `💰 $${milestone >= 1000 ? (milestone / 1000) + 'K' : milestone} Revenue Milestone`,
          description: `Congratulations! Your total revenue crossed $${milestone.toLocaleString()}`,
          value: milestone,
          icon: 'milestone',
          severity: 'positive',
        });
      }
    });
  });
  
  // Sort events by date (newest first for display)
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ========================
// COHORT RETENTION ANALYSIS
// ========================

export interface CohortInput {
  subscriptions: Array<{
    id: string;
    customerId: string;
    created: number;
    canceledAt?: number;
    status: string;
  }>;
}

export function generateCohortRetention(input: CohortInput): CohortRetentionMatrix {
  const cohorts = new Map<string, CohortData>();
  const now = new Date();
  
  // Group subscriptions by signup month (cohort)
  input.subscriptions.forEach(sub => {
    const createdDate = new Date(sub.created * 1000);
    const cohortKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!cohorts.has(cohortKey)) {
      cohorts.set(cohortKey, {
        cohortMonth: cohortKey,
        label: new Date(createdDate.getFullYear(), createdDate.getMonth(), 1)
          .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalCustomers: 0,
        retentionByMonth: [],
        avgLifetimeMonths: 0,
      });
    }
    
    const cohort = cohorts.get(cohortKey)!;
    cohort.totalCustomers++;
  });
  
  // Calculate retention for each cohort
  cohorts.forEach((cohort, cohortKey) => {
    const cohortDate = new Date(cohortKey + '-01');
    const monthsSinceCohort = Math.floor(
      (now.getTime() - cohortDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    
    // Calculate retention for each month (0-12)
    const maxMonths = Math.min(monthsSinceCohort, 12);
    let totalLifetimeMonths = 0;
    
    for (let month = 0; month <= maxMonths; month++) {
      const checkDate = new Date(cohortDate);
      checkDate.setMonth(checkDate.getMonth() + month);
      
      // Count how many are still active at this point
      const retained = input.subscriptions.filter(sub => {
        const createdMonth = new Date(sub.created * 1000).toISOString().slice(0, 7);
        if (createdMonth !== cohortKey) return false;
        
        // Still active if not canceled OR canceled after this check date
        if (!sub.canceledAt) return true;
        return sub.canceledAt * 1000 > checkDate.getTime();
      }).length;
      
      const retentionRate = cohort.totalCustomers > 0 
        ? (retained / cohort.totalCustomers) * 100 
        : 0;
      
      cohort.retentionByMonth.push({
        month,
        retained,
        percentage: Math.round(retentionRate * 10) / 10,
      });
      
      totalLifetimeMonths += retentionRate / 100;
    }
    
    cohort.avgLifetimeMonths = Math.round(totalLifetimeMonths * 10) / 10;
  });
  
  // Convert to array and sort by cohort month
  const cohortArray = Array.from(cohorts.values())
    .sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth))
    .slice(0, 6); // Last 6 months
  
  // Calculate overall metrics
  const allRetentionMonth1 = cohortArray
    .filter(c => c.retentionByMonth.length > 1)
    .map(c => c.retentionByMonth[1]?.percentage || 0);
  
  const avgMonth1Retention = allRetentionMonth1.length > 0
    ? calculateMean(allRetentionMonth1)
    : 0;
  
  return {
    cohorts: cohortArray,
    summary: {
      avgMonth1Retention: Math.round(avgMonth1Retention * 10) / 10,
      bestCohort: cohortArray.reduce((best, c) => 
        (c.retentionByMonth[1]?.percentage || 0) > (best.retentionByMonth[1]?.percentage || 0) ? c : best
      , cohortArray[0])?.cohortMonth || '',
      worstCohort: cohortArray.reduce((worst, c) => 
        (c.retentionByMonth[1]?.percentage || 0) < (worst.retentionByMonth[1]?.percentage || 0) ? c : worst
      , cohortArray[0])?.cohortMonth || '',
      trend: avgMonth1Retention > 60 ? 'improving' : avgMonth1Retention > 40 ? 'stable' : 'declining',
    },
  };
}

// ========================
// PARETO (80/20) ANALYSIS
// ========================

export interface ParetoInput {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    subscriptionCount: number;
  }>;
}

export function generateParetoAnalysis(input: ParetoInput): ParetoAnalysis {
  if (input.customers.length === 0) {
    return {
      segments: [],
      topCustomersShare: { percentage: 0, revenueShare: 0, count: 0 },
      concentration: 'low',
      insights: ['No customer data available for analysis'],
    };
  }
  
  // Sort by revenue descending
  const sorted = [...input.customers].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const totalRevenue = sorted.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalCustomers = sorted.length;
  
  // Calculate segments
  const segments: ParetoSegment[] = [];
  let cumulativeRevenue = 0;
  let cumulativeCustomers = 0;
  
  // Top 20%
  const top20Count = Math.ceil(totalCustomers * 0.2);
  const top20Revenue = sorted.slice(0, top20Count).reduce((sum, c) => sum + c.totalRevenue, 0);
  const top20Share = totalRevenue > 0 ? (top20Revenue / totalRevenue) * 100 : 0;
  
  segments.push({
    name: 'Top 20%',
    customerCount: top20Count,
    customerPercentage: 20,
    revenue: top20Revenue,
    revenuePercentage: Math.round(top20Share * 10) / 10,
    avgRevenuePerCustomer: top20Count > 0 ? top20Revenue / top20Count : 0,
    customers: sorted.slice(0, Math.min(top20Count, 5)).map(c => ({
      id: c.id,
      name: c.name,
      revenue: c.totalRevenue,
    })),
  });
  
  // Middle 30%
  const mid30Start = top20Count;
  const mid30Count = Math.ceil(totalCustomers * 0.3);
  const mid30Revenue = sorted.slice(mid30Start, mid30Start + mid30Count).reduce((sum, c) => sum + c.totalRevenue, 0);
  
  segments.push({
    name: 'Middle 30%',
    customerCount: mid30Count,
    customerPercentage: 30,
    revenue: mid30Revenue,
    revenuePercentage: totalRevenue > 0 ? Math.round((mid30Revenue / totalRevenue) * 1000) / 10 : 0,
    avgRevenuePerCustomer: mid30Count > 0 ? mid30Revenue / mid30Count : 0,
    customers: [],
  });
  
  // Bottom 50%
  const bottom50Start = top20Count + mid30Count;
  const bottom50Count = totalCustomers - bottom50Start;
  const bottom50Revenue = sorted.slice(bottom50Start).reduce((sum, c) => sum + c.totalRevenue, 0);
  
  segments.push({
    name: 'Bottom 50%',
    customerCount: bottom50Count,
    customerPercentage: 50,
    revenue: bottom50Revenue,
    revenuePercentage: totalRevenue > 0 ? Math.round((bottom50Revenue / totalRevenue) * 1000) / 10 : 0,
    avgRevenuePerCustomer: bottom50Count > 0 ? bottom50Revenue / bottom50Count : 0,
    customers: [],
  });
  
  // Determine concentration level
  let concentration: 'low' | 'moderate' | 'high' | 'extreme';
  if (top20Share >= 90) concentration = 'extreme';
  else if (top20Share >= 80) concentration = 'high';
  else if (top20Share >= 60) concentration = 'moderate';
  else concentration = 'low';
  
  // Generate insights
  const insights: string[] = [];
  
  if (top20Share >= 80) {
    insights.push(`⚠️ Revenue highly concentrated: Top ${top20Count} customers generate ${top20Share.toFixed(0)}% of revenue`);
    insights.push('💡 Consider diversifying customer base to reduce dependency risk');
  } else if (top20Share >= 60) {
    insights.push(`📊 Healthy concentration: Top 20% customers generate ${top20Share.toFixed(0)}% of revenue`);
  } else {
    insights.push(`✅ Well-distributed revenue across customer base`);
  }
  
  if (sorted[0] && totalRevenue > 0) {
    const topCustomerShare = (sorted[0].totalRevenue / totalRevenue) * 100;
    if (topCustomerShare > 30) {
      insights.push(`🚨 Single customer risk: ${sorted[0].name} represents ${topCustomerShare.toFixed(0)}% of revenue`);
    }
  }
  
  return {
    segments,
    topCustomersShare: {
      percentage: 20,
      revenueShare: Math.round(top20Share * 10) / 10,
      count: top20Count,
    },
    concentration,
    insights,
  };
}

// ========================
// REVENUE FORECASTING (Rule-Based)
// ========================

export interface ForecastInput {
  revenueHistory: Array<{ date: string; revenue: number }>;
  currentMRR: number;
  growthRate?: number;
}

export function generateRevenueForecast(input: ForecastInput): RevenueForecasting {
  const { revenueHistory, currentMRR } = input;
  
  if (revenueHistory.length < 3) {
    return {
      currentMRR,
      projectedMRR: currentMRR,
      projectedARR: currentMRR * 12,
      confidence: 'low',
      forecastData: [],
      assumptions: ['Insufficient historical data for accurate forecasting'],
      growthRate: 0,
    };
  }
  
  // Calculate average growth rate from last 3 months
  const monthlyRevenues = revenueHistory.slice(-90).reduce((acc, { date, revenue }) => {
    const month = date.slice(0, 7);
    acc[month] = (acc[month] || 0) + revenue;
    return acc;
  }, {} as Record<string, number>);
  
  const months = Object.entries(monthlyRevenues).sort((a, b) => a[0].localeCompare(b[0]));
  
  let growthRates: number[] = [];
  for (let i = 1; i < months.length; i++) {
    const prevRevenue = months[i - 1][1];
    const currRevenue = months[i][1];
    if (prevRevenue > 0) {
      growthRates.push((currRevenue - prevRevenue) / prevRevenue);
    }
  }
  
  const avgGrowthRate = growthRates.length > 0 
    ? calculateMean(growthRates) 
    : (input.growthRate || 0);
  
  const stdDevGrowth = calculateStdDev(growthRates);
  
  // Generate 6-month forecast
  const forecastData: ForecastDataPoint[] = [];
  let projectedMRR = currentMRR;
  
  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i);
    
    projectedMRR = projectedMRR * (1 + avgGrowthRate);
    const upperBound = projectedMRR * (1 + stdDevGrowth);
    const lowerBound = projectedMRR * (1 - stdDevGrowth);
    
    forecastData.push({
      month: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      projected: Math.round(projectedMRR),
      upperBound: Math.round(upperBound),
      lowerBound: Math.round(Math.max(0, lowerBound)),
      confidence: i <= 2 ? 'high' : i <= 4 ? 'medium' : 'low',
    });
  }
  
  // Determine overall confidence
  let confidence: 'low' | 'medium' | 'high';
  if (months.length >= 6 && stdDevGrowth < 0.15) confidence = 'high';
  else if (months.length >= 3 && stdDevGrowth < 0.3) confidence = 'medium';
  else confidence = 'low';
  
  return {
    currentMRR,
    projectedMRR: forecastData[forecastData.length - 1]?.projected || currentMRR,
    projectedARR: (forecastData[forecastData.length - 1]?.projected || currentMRR) * 12,
    confidence,
    forecastData,
    growthRate: Math.round(avgGrowthRate * 1000) / 10,
    assumptions: [
      `Based on ${months.length} months of historical data`,
      `Average monthly growth rate: ${(avgGrowthRate * 100).toFixed(1)}%`,
      `Growth variability (std dev): ±${(stdDevGrowth * 100).toFixed(1)}%`,
      confidence === 'high' ? 'Stable growth pattern detected' : 'Growth pattern shows variability',
    ],
  };
}

// ========================
// PAYMENT FUNNEL ANALYSIS
// ========================

export interface PaymentFunnelInput {
  invoices: Array<{
    id: string;
    status: string;
    amount: number;
    created: number;
    attemptCount: number;
    paidAt?: number;
  }>;
  paymentIntents: Array<{
    id: string;
    status: string;
    amount: number;
    created: number;
  }>;
}

export function generatePaymentFunnel(input: PaymentFunnelInput): PaymentFunnel {
  const totalInvoices = input.invoices.length;
  const attemptedInvoices = input.invoices.filter(inv => inv.attemptCount > 0);
  const paidInvoices = input.invoices.filter(inv => inv.status === 'paid');
  const failedInvoices = input.invoices.filter(inv => 
    inv.status === 'uncollectible' || inv.status === 'void'
  );
  
  // Calculate funnel steps
  const steps: FunnelStep[] = [
    {
      name: 'Invoice Created',
      count: totalInvoices,
      percentage: 100,
      value: input.invoices.reduce((sum, inv) => sum + inv.amount, 0) / 100,
    },
    {
      name: 'Payment Attempted',
      count: attemptedInvoices.length,
      percentage: totalInvoices > 0 ? (attemptedInvoices.length / totalInvoices) * 100 : 0,
      value: attemptedInvoices.reduce((sum, inv) => sum + inv.amount, 0) / 100,
      dropOff: totalInvoices - attemptedInvoices.length,
      dropOffReason: 'Invoices awaiting payment attempt',
    },
    {
      name: 'Payment Successful',
      count: paidInvoices.length,
      percentage: totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0,
      value: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0) / 100,
      dropOff: attemptedInvoices.length - paidInvoices.length,
      dropOffReason: 'Payment failures, card declines, or pending',
    },
  ];
  
  // Calculate conversion rate and avg payment time
  const conversionRate = totalInvoices > 0 
    ? (paidInvoices.length / totalInvoices) * 100 
    : 0;
  
  // Calculate average time to payment
  const paymentTimes = paidInvoices
    .filter(inv => inv.paidAt)
    .map(inv => (inv.paidAt! - inv.created));
  
  const avgPaymentTime = paymentTimes.length > 0
    ? calculateMean(paymentTimes) / (60 * 60) // Convert to hours
    : 0;
  
  // Calculate retry success rate
  const retriedInvoices = input.invoices.filter(inv => inv.attemptCount > 1);
  const retriedAndPaid = retriedInvoices.filter(inv => inv.status === 'paid');
  const retrySuccessRate = retriedInvoices.length > 0
    ? (retriedAndPaid.length / retriedInvoices.length) * 100
    : 0;
  
  // Generate insights
  const insights: string[] = [];
  
  if (conversionRate < 85) {
    insights.push(`⚠️ Invoice-to-payment conversion is ${conversionRate.toFixed(0)}% - below 85% benchmark`);
  } else {
    insights.push(`✅ Strong invoice-to-payment conversion at ${conversionRate.toFixed(0)}%`);
  }
  
  if (avgPaymentTime > 48) {
    insights.push(`⏱️ Average payment time is ${avgPaymentTime.toFixed(0)} hours - consider payment reminders`);
  }
  
  if (retrySuccessRate > 30) {
    insights.push(`💡 ${retrySuccessRate.toFixed(0)}% of retried payments succeed - smart retry is working`);
  }
  
  const dropOffPercent = steps[1].percentage - steps[2].percentage;
  if (dropOffPercent > 20) {
    insights.push(`🔴 ${dropOffPercent.toFixed(0)}% drop between attempt → success. Check card failure reasons.`);
  }
  
  return {
    steps,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgPaymentTimeHours: Math.round(avgPaymentTime * 10) / 10,
    retrySuccessRate: Math.round(retrySuccessRate * 10) / 10,
    totalRevenueLost: (failedInvoices.reduce((sum, inv) => sum + inv.amount, 0)) / 100,
    insights,
  };
}

// ========================
// RECOVERABLE REVENUE ANALYSIS
// ========================

export interface RecoverableInput {
  failedPayments: Array<{
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    reason: string;
    date: string;
    retryCount: number;
  }>;
  expiredCards: Array<{
    customerId: string;
    customerName: string;
    lastFour: string;
    expMonth: number;
    expYear: number;
    estimatedMRR: number;
  }>;
  incompleteInvoices: Array<{
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    status: string;
    daysPending: number;
  }>;
  avgRetrySuccessRate?: number;
}

export function generateRecoverableRevenue(input: RecoverableInput): RecoverableRevenue {
  const avgRetrySuccessRate = input.avgRetrySuccessRate || 0.35; // Industry average 35%
  
  // Calculate recoverable from failed payments
  const failedPaymentsRecoverable = input.failedPayments
    .filter(fp => fp.retryCount < 3) // Still has retry potential
    .reduce((sum, fp) => sum + fp.amount * avgRetrySuccessRate, 0);
  
  // Calculate recoverable from expired cards
  const expiredCardsRecoverable = input.expiredCards
    .reduce((sum, card) => sum + card.estimatedMRR * 0.6, 0); // 60% update rate
  
  // Calculate recoverable from incomplete invoices
  const incompleteRecoverable = input.incompleteInvoices
    .filter(inv => inv.daysPending < 30) // Recent invoices more likely to be recovered
    .reduce((sum, inv) => sum + inv.amount * 0.5, 0);
  
  const totalRecoverable = failedPaymentsRecoverable + expiredCardsRecoverable + incompleteRecoverable;
  
  // Build recovery items list
  const items: RecoverableItem[] = [];
  
  input.failedPayments.slice(0, 5).forEach(fp => {
    items.push({
      type: 'failed_payment',
      customerId: fp.customerId,
      customerName: fp.customerName,
      amount: fp.amount,
      reason: fp.reason,
      recoveryProbability: fp.retryCount < 2 ? 0.4 : 0.2,
      suggestedAction: fp.retryCount < 3 
        ? 'Schedule automatic retry' 
        : 'Contact customer directly',
      priority: fp.amount > 100 ? 'high' : 'medium',
    });
  });
  
  input.expiredCards.slice(0, 5).forEach(card => {
    items.push({
      type: 'expired_card',
      customerId: card.customerId,
      customerName: card.customerName,
      amount: card.estimatedMRR,
      reason: `Card ending ${card.lastFour} expired ${card.expMonth}/${card.expYear}`,
      recoveryProbability: 0.6,
      suggestedAction: 'Send card update reminder email',
      priority: card.estimatedMRR > 50 ? 'high' : 'medium',
    });
  });
  
  input.incompleteInvoices.slice(0, 5).forEach(inv => {
    items.push({
      type: 'incomplete_invoice',
      customerId: inv.customerId,
      customerName: inv.customerName,
      amount: inv.amount,
      reason: `Invoice ${inv.status} for ${inv.daysPending} days`,
      recoveryProbability: inv.daysPending < 7 ? 0.7 : 0.3,
      suggestedAction: inv.daysPending < 14 
        ? 'Send payment reminder' 
        : 'Personal follow-up recommended',
      priority: inv.amount > 200 ? 'high' : 'low',
    });
  });
  
  // Sort by priority and amount
  items.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.amount - a.amount;
  });
  
  return {
    totalRecoverable: Math.round(totalRecoverable),
    breakdown: {
      failedPayments: {
        count: input.failedPayments.length,
        amount: input.failedPayments.reduce((sum, fp) => sum + fp.amount, 0),
        recoverable: Math.round(failedPaymentsRecoverable),
      },
      expiredCards: {
        count: input.expiredCards.length,
        amount: input.expiredCards.reduce((sum, card) => sum + card.estimatedMRR, 0),
        recoverable: Math.round(expiredCardsRecoverable),
      },
      incompleteInvoices: {
        count: input.incompleteInvoices.length,
        amount: input.incompleteInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        recoverable: Math.round(incompleteRecoverable),
      },
    },
    items,
    methodology: `Recovery estimates based on ${(avgRetrySuccessRate * 100).toFixed(0)}% retry success rate, 60% card update rate, and recency-based invoice recovery probability.`,
  };
}

// ========================
// WHAT-IF SIMULATOR
// ========================

export interface WhatIfInput {
  currentMRR: number;
  currentChurnRate: number;
  currentARPU: number;
  currentCustomers: number;
  monthlyPlanPercentage: number;
}

export function simulateWhatIf(
  input: WhatIfInput,
  scenario: WhatIfScenario
): WhatIfResult {
  let projectedMRR = input.currentMRR;
  let projectedChurnRate = input.currentChurnRate;
  let projectedARPU = input.currentARPU;
  let projectedCustomers = input.currentCustomers;
  
  const changes: string[] = [];
  
  // Apply price change
  if (scenario.priceChangePercent !== undefined && scenario.priceChangePercent !== 0) {
    const priceMultiplier = 1 + (scenario.priceChangePercent / 100);
    // Price increase typically causes some churn
    const churnIncrease = scenario.priceChangePercent > 0 
      ? scenario.priceChangePercent * 0.3 // 30% of price increase becomes churn
      : 0;
    
    projectedARPU = projectedARPU * priceMultiplier;
    projectedMRR = projectedMRR * priceMultiplier * (1 - churnIncrease / 100);
    
    changes.push(
      scenario.priceChangePercent > 0
        ? `Price increase of ${scenario.priceChangePercent}% → ARPU up to $${projectedARPU.toFixed(2)}`
        : `Price decrease of ${Math.abs(scenario.priceChangePercent)}% → ARPU down to $${projectedARPU.toFixed(2)}`
    );
  }
  
  // Apply churn reduction
  if (scenario.churnReductionPercent !== undefined && scenario.churnReductionPercent !== 0) {
    const oldChurn = projectedChurnRate;
    projectedChurnRate = Math.max(0, projectedChurnRate - scenario.churnReductionPercent);
    
    // Retained customers add to MRR
    const retainedCustomers = (projectedCustomers * (scenario.churnReductionPercent / 100));
    projectedMRR += retainedCustomers * projectedARPU;
    projectedCustomers += retainedCustomers;
    
    changes.push(
      `Churn reduced from ${oldChurn.toFixed(1)}% to ${projectedChurnRate.toFixed(1)}% → ${Math.round(retainedCustomers)} customers retained`
    );
  }
  
  // Apply annual plan conversion
  if (scenario.annualPlanConversionPercent !== undefined && scenario.annualPlanConversionPercent > 0) {
    const monthlyCustomers = projectedCustomers * (input.monthlyPlanPercentage / 100);
    const convertedToAnnual = monthlyCustomers * (scenario.annualPlanConversionPercent / 100);
    
    // Annual plans typically have 15-20% discount but guarantee 12 months
    const annualDiscount = 0.15;
    const cashflowBoost = convertedToAnnual * projectedARPU * 12 * (1 - annualDiscount);
    
    // Slight MRR adjustment for annual discount
    projectedMRR -= convertedToAnnual * projectedARPU * annualDiscount;
    
    // But churn drops significantly for annual customers
    projectedChurnRate = projectedChurnRate * (1 - (scenario.annualPlanConversionPercent / 100) * 0.5);
    
    changes.push(
      `${scenario.annualPlanConversionPercent}% annual conversion → $${cashflowBoost.toFixed(0)} upfront cashflow boost`
    );
  }
  
  // Calculate 12-month projection
  const monthlyProjection: Array<{ month: number; mrr: number; arr: number }> = [];
  let runningMRR = projectedMRR;
  
  for (let month = 1; month <= 12; month++) {
    // Apply monthly churn
    runningMRR = runningMRR * (1 - projectedChurnRate / 100);
    // Assume 2% growth from new customers
    runningMRR = runningMRR * 1.02;
    
    monthlyProjection.push({
      month,
      mrr: Math.round(runningMRR),
      arr: Math.round(runningMRR * 12),
    });
  }
  
  const finalMRR = monthlyProjection[11].mrr;
  const mrrDelta = finalMRR - input.currentMRR;
  const mrrDeltaPercent = (mrrDelta / input.currentMRR) * 100;
  
  return {
    scenario,
    currentMetrics: {
      mrr: input.currentMRR,
      arr: input.currentMRR * 12,
      churnRate: input.currentChurnRate,
      arpu: input.currentARPU,
    },
    projectedMetrics: {
      mrr: Math.round(projectedMRR),
      arr: Math.round(projectedMRR * 12),
      churnRate: Math.round(projectedChurnRate * 10) / 10,
      arpu: Math.round(projectedARPU * 100) / 100,
    },
    monthlyProjection,
    impact: {
      mrrDelta: Math.round(mrrDelta),
      mrrDeltaPercent: Math.round(mrrDeltaPercent * 10) / 10,
      arrDelta: Math.round(mrrDelta * 12),
      recommendation: mrrDeltaPercent > 10 
        ? 'Strong positive impact - consider implementing'
        : mrrDeltaPercent > 0
        ? 'Moderate positive impact - worth testing'
        : 'Negative impact - reconsider approach',
    },
    changes,
  };
}
