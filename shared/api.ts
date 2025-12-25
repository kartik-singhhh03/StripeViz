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

export type InsightType = 'revenue_up' | 'revenue_down' | 'failed_payments_spike' | 'subscriptions_drop' | 'churn_warning' | 'healthy' | 'new_milestone' | 'anomaly_detected';
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
  icon: 'up' | 'down' | 'warning' | 'check' | 'alert' | 'fire' | 'celebration' | 'milestone' | 'user';
  createdAt: string;
}

// ========================
// Z-SCORE ANOMALY DETECTION
// ========================

export interface ZScoreAnomaly {
  date: string;
  value: number;
  zScore: number;
  mean: number;
  stdDev: number;
  severity: 'unusual' | 'critical';
  direction: 'spike' | 'drop';
  metricName: string;
  explanation: string;
}

// ========================
// BUSINESS TIMELINE TYPES
// ========================

export type MilestoneType = 
  | 'first_payment' 
  | 'first_customer' 
  | 'best_revenue_day' 
  | 'refund_spike' 
  | 'worst_churn_day' 
  | 'revenue_milestone'
  | 'customer_milestone';

export interface BusinessMilestone {
  type: MilestoneType;
  date: string;
  title: string;
  description: string;
  value: number;
  icon: string;
}

export interface TimelineEvent {
  id: string;
  type: MilestoneType;
  date: string;
  title: string;
  description: string;
  value: number;
  metadata?: Record<string, any>;
  icon: 'celebration' | 'fire' | 'alert' | 'warning' | 'milestone' | 'user';
  severity: 'positive' | 'warning' | 'critical' | 'neutral';
}

// ========================
// COHORT RETENTION TYPES
// ========================

export interface CohortData {
  cohortMonth: string;
  label: string;
  totalCustomers: number;
  retentionByMonth: Array<{
    month: number;
    retained: number;
    percentage: number;
  }>;
  avgLifetimeMonths: number;
}

export interface CohortRetentionMatrix {
  cohorts: CohortData[];
  summary: {
    avgMonth1Retention: number;
    bestCohort: string;
    worstCohort: string;
    trend: 'improving' | 'stable' | 'declining';
  };
}

// ========================
// PARETO (80/20) ANALYSIS TYPES
// ========================

export interface ParetoSegment {
  name: string;
  customerCount: number;
  customerPercentage: number;
  revenue: number;
  revenuePercentage: number;
  avgRevenuePerCustomer: number;
  customers: Array<{ id: string; name: string; revenue: number }>;
}

export interface ParetoAnalysis {
  segments: ParetoSegment[];
  topCustomersShare: {
    percentage: number;
    revenueShare: number;
    count: number;
  };
  concentration: 'low' | 'moderate' | 'high' | 'extreme';
  insights: string[];
}

// ========================
// REVENUE FORECASTING TYPES
// ========================

export interface ForecastDataPoint {
  month: string;
  projected: number;
  upperBound: number;
  lowerBound: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface RevenueForecasting {
  currentMRR: number;
  projectedMRR: number;
  projectedARR: number;
  confidence: 'low' | 'medium' | 'high';
  forecastData: ForecastDataPoint[];
  growthRate: number;
  assumptions: string[];
}

// ========================
// PAYMENT FUNNEL TYPES
// ========================

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  value: number;
  dropOff?: number;
  dropOffReason?: string;
}

export interface PaymentFunnel {
  steps: FunnelStep[];
  conversionRate: number;
  avgPaymentTimeHours: number;
  retrySuccessRate: number;
  totalRevenueLost: number;
  insights: string[];
}

// ========================
// RECOVERABLE REVENUE TYPES
// ========================

export interface RecoverableItem {
  type: 'failed_payment' | 'expired_card' | 'incomplete_invoice';
  customerId: string;
  customerName: string;
  amount: number;
  reason: string;
  recoveryProbability: number;
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RecoverableRevenue {
  totalRecoverable: number;
  breakdown: {
    failedPayments: { count: number; amount: number; recoverable: number };
    expiredCards: { count: number; amount: number; recoverable: number };
    incompleteInvoices: { count: number; amount: number; recoverable: number };
  };
  items: RecoverableItem[];
  methodology: string;
}

// ========================
// WHAT-IF SIMULATOR TYPES
// ========================

export interface WhatIfScenario {
  priceChangePercent?: number;
  churnReductionPercent?: number;
  annualPlanConversionPercent?: number;
}

export interface WhatIfResult {
  scenario: WhatIfScenario;
  currentMetrics: {
    mrr: number;
    arr: number;
    churnRate: number;
    arpu: number;
  };
  projectedMetrics: {
    mrr: number;
    arr: number;
    churnRate: number;
    arpu: number;
  };
  monthlyProjection: Array<{ month: number; mrr: number; arr: number }>;
  impact: {
    mrrDelta: number;
    mrrDeltaPercent: number;
    arrDelta: number;
    recommendation: string;
  };
  changes: string[];
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
  
  // High-value features
  insights: Insight[];
  weeklySummary: WeeklySummary;
  healthIndicator: HealthIndicator;
  dataFreshness: DataFreshness;
  
  // NEW: Advanced Analytics
  anomalies?: ZScoreAnomaly[];
  businessTimeline?: TimelineEvent[];
  cohortRetention?: CohortRetentionMatrix;
  paretoAnalysis?: ParetoAnalysis;
  revenueForecasting?: RevenueForecasting;
  paymentFunnel?: PaymentFunnel;
  recoverableRevenue?: RecoverableRevenue;
  
  // Comparison metrics for insights
  previousPeriod: {
    mrr: number;
    activeSubscriptions: number;
    failedPayments: number;
    netRevenue: number;
  };
  
  // NEW: What-If Simulator data for UI
  whatIfBaseData?: WhatIfBaseData;
  
  // NEW: Smart Alerts
  smartAlerts?: SmartAlert[];
  
  // NEW: Benchmarking
  benchmarking?: BenchmarkingData;
}

// ========================
// WHAT-IF SIMULATOR BASE DATA
// ========================

export interface WhatIfBaseData {
  currentMRR: number;
  currentARR: number;
  currentChurnRate: number;
  currentARPU: number;
  currentCustomers: number;
  monthlyPlanPercentage: number;
}

// ========================
// SMART ALERTS SYSTEM
// ========================

export type AlertType = 
  | 'revenue_drop' 
  | 'revenue_spike' 
  | 'churn_increase' 
  | 'failed_payments_spike'
  | 'subscription_milestone'
  | 'payment_recovered'
  | 'anomaly_detected';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertChannel = 'in_app' | 'email' | 'both';

export interface SmartAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  triggeredAt: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface AlertPreferences {
  userId: string;
  enabledTypes: AlertType[];
  channels: AlertChannel;
  thresholds: {
    revenueDropPercent: number;
    revenueSpikePercent: number;
    churnIncreasePercent: number;
    failedPaymentsSpikePercent: number;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

// ========================
// PUBLIC SNAPSHOT TYPES
// ========================

export interface PublicSnapshot {
  id: string;
  userId: string;
  shareToken: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  viewCount: number;
  settings: SnapshotSettings;
}

export interface SnapshotSettings {
  showMRR: boolean;
  showARR: boolean;
  showCustomerCount: boolean;
  showChurnRate: boolean;
  showGrowthTrend: boolean;
  anonymizeAmounts: boolean; // Show as percentages instead of $
  blurSensitiveData: boolean;
  customTitle?: string;
  customDescription?: string;
}

export interface PublicSnapshotData {
  title: string;
  description?: string;
  generatedAt: string;
  metrics: {
    mrr?: number | string; // Can be "Hidden" or actual value
    arr?: number | string;
    customerCount?: number | string;
    churnRate?: number | string;
    growthRate?: number;
    healthScore?: number;
  };
  trends?: {
    mrrTrend: 'up' | 'down' | 'stable';
    customerTrend: 'up' | 'down' | 'stable';
  };
  charts?: {
    revenueGrowth?: Array<{ month: string; value: number }>;
    customerGrowth?: Array<{ month: string; value: number }>;
  };
}

// ========================
// ANONYMOUS BENCHMARKING TYPES
// ========================

export interface BenchmarkingData {
  yourMetrics: {
    mrr: number;
    arr: number;
    churnRate: number;
    arpu: number;
    customerCount: number;
    growthRate: number;
  };
  percentiles: {
    mrr: BenchmarkPercentile;
    churnRate: BenchmarkPercentile;
    arpu: BenchmarkPercentile;
    growthRate: BenchmarkPercentile;
  };
  industryComparison: {
    segment: string; // "Early Stage", "Growth", "Scale"
    avgMRR: number;
    avgChurnRate: number;
    avgARPU: number;
    avgGrowthRate: number;
  };
  recommendations: string[];
}

export interface BenchmarkPercentile {
  value: number;
  percentile: number; // 0-100
  rating: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
  comparison: string; // "Better than 75% of similar businesses"
}

