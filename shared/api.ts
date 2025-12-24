/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ========================
// INSIGHTS SYSTEM TYPES
// ========================

export type InsightType = 'revenue_up' | 'revenue_down' | 'failed_payments_spike' | 'subscriptions_drop' | 'churn_warning' | 'healthy' | 'new_milestone';
export type InsightSeverity = 'positive' | 'warning' | 'critical' | 'neutral';

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  comparedPeriod: string;
  value?: number;
  change?: number;
  icon: 'up' | 'down' | 'warning' | 'check' | 'alert';
  createdAt: string;
}

// ========================
// WEEKLY SUMMARY TYPES
// ========================

export interface WeeklySummary {
  totalRevenue: number;
  previousRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  newSubscriptions: number;
  cancellations: number;
  netSubscriptionChange: number;
  failedPayments: number;
  recoveredPayments: number;
  periodStart: string;
  periodEnd: string;
}

// ========================
// HEALTH INDICATOR TYPES
// ========================

export type HealthStatus = 'healthy' | 'watch' | 'attention';

export interface HealthIndicator {
  status: HealthStatus;
  label: string;
  reasons: string[];
  score: number; // 0-100
  breakdown: {
    revenueHealth: HealthStatus;
    paymentHealth: HealthStatus;
    churnHealth: HealthStatus;
  };
}

// ========================
// DATA FRESHNESS TYPES
// ========================

export interface DataFreshness {
  lastSyncedAt: string;
  minutesAgo: number;
  isStale: boolean;
  status: 'fresh' | 'recent' | 'stale';
}

// ========================
// EXPORT TYPES
// ========================

export interface ExportableInvoice {
  invoiceId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: string;
  createdDate: string;
  paidDate: string | null;
  dueDate: string | null;
}

export interface ExportablePayment {
  paymentId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  paymentMethod: string;
}

export interface ExportableSubscription {
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
}

export interface ExportableRevenue {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  newSubscriptions: number;
  cancellations: number;
}

// ========================
// ENHANCED METRICS RESPONSE
// ========================

export interface EnhancedMetrics {
  // Core metrics
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  failedPayments: number;
  netRevenue: number;
  churnRate: number;
  totalCustomers: number;
  avgRevenuePerCustomer: number;
  
  // Chart data
  revenueData: Array<{ date: string; gross: number; net: number }>;
  subscriptionStatus: Array<{ name: string; value: number; color: string }>;
  monthlyActivity: Array<{ month: string; new: number; canceled: number }>;
  
  // Lists
  failedPaymentsList: Array<{
    id: string;
    customer: string;
    amount: number;
    reason: string;
    date: string;
    retries: number;
  }>;
  invoices: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  
  // NEW: High-value features
  insights: Insight[];
  weeklySummary: WeeklySummary;
  healthIndicator: HealthIndicator;
  dataFreshness: DataFreshness;
  
  // Comparison metrics for insights
  previousPeriod: {
    mrr: number;
    activeSubscriptions: number;
    failedPayments: number;
    netRevenue: number;
  };
}
