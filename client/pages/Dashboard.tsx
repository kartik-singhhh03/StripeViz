import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertCircle, 
  Calendar, Download, Filter, Search, ChevronRight, Activity,
  ArrowUpRight, ArrowDownRight, Info, CheckCircle, XCircle, Clock, Key, Loader2, LogOut,
  RefreshCw, AlertTriangle, Shield, FileText, Zap, Heart, Eye, Menu,
  Target, Flame, Award, TrendingUp as TrendUp, BarChart3, PieChart as PieChartIcon,
  Sparkles, DollarSign as Dollar, CircleDollarSign, Wallet, Calculator, ChevronDown,
  Play, Pause, Milestone, PartyPopper, Share2, Bell, Globe, Trophy, Sliders,
  Copy, ExternalLink, Settings, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sidebar, useSidebarOffset } from '@/components/Sidebar';
import { DashboardSkeleton, KpiGridSkeleton, AreaChartSkeleton, InsightCardSkeleton, WeeklySummarySkeleton } from '@/components/skeletons';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api';
import { TestModeWarning, TestModeBadge, TestModeRestrictionBanner } from '@/components/TestModeWarning';
import { trackDashboardLoad, trackStripeConnectSuccess } from '@/lib/analytics';
import type { 
  Insight, WeeklySummary, HealthIndicator, DataFreshness, HealthStatus,
  ZScoreAnomaly, TimelineEvent, CohortRetentionMatrix, CohortData,
  ParetoAnalysis, ParetoSegment, RevenueForecasting, ForecastDataPoint,
  PaymentFunnel, FunnelStep, RecoverableRevenue, RecoverableItem,
  WhatIfScenario, WhatIfResult, WhatIfBaseData, SmartAlert, BenchmarkingData, BenchmarkPercentile
} from '@shared/api';

interface User {
  id: string;
  email: string;
  name: string;
  stripeConnection?: {
    stripeAccountId: string;
    stripeMode?: 'test' | 'live'; // Indicates if using test or live Stripe keys
    createdAt: string;
  };
  subscription?: {
    plan: string;
    status: string;
  };
}

interface Metrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  failedPayments: number;
  netRevenue: number;
  churnRate: number;
  totalCustomers: number;
  avgRevenuePerCustomer: number;
  revenueData: Array<{ date: string; gross: number; net: number }>;
  subscriptionStatus: Array<{ name: string; value: number; color: string }>;
  monthlyActivity: Array<{ month: string; new: number; canceled: number }>;
  failedPaymentsList: Array<{ id: string; customer: string; amount: number; reason: string; date: string; retries: number }>;
  invoices: Array<{ id: string; customer: string; amount: number; status: string; date: string }>;
  // New high-value features
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
  // NEW: What-If, Alerts, Benchmarking
  whatIfBaseData?: WhatIfBaseData;
  smartAlerts?: SmartAlert[];
  benchmarking?: BenchmarkingData;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMetrics, setIsFetchingMetrics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (user?.stripeConnection) {
      fetchMetrics();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      toast.error('Failed to load user data');
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setIsFetchingMetrics(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/metrics'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
      
      // Track dashboard load (GA4) - only in production
      trackDashboardLoad();
    } catch (error) {
      toast.error('Failed to load metrics from Stripe');
    } finally {
      setIsFetchingMetrics(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Stripe API key');
      return;
    }

    setIsConnecting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/stripe/connect'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect Stripe');
      }

      const data = await response.json();
      
      // Track Stripe connect success (GA4) - only tracks mode, not the key
      const stripeMode = data.stripeMode || (apiKey.startsWith('sk_test_') ? 'test' : 'live');
      trackStripeConnectSuccess(stripeMode);

      toast.success('Stripe account connected successfully!');
      setShowApiKeyModal(false);
      setApiKey('');
      await fetchUser();
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect Stripe');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExport = async (type: 'invoices' | 'payments' | 'subscriptions' | 'revenue') => {
    if (user?.subscription?.plan !== 'pro') {
      toast.error('CSV export is a Pro feature. Upgrade to access exports.');
      return;
    }

    setIsExporting(type);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/export/${type}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.status === 403) {
        toast.error('CSV export is a Pro feature. Upgrade to access exports.');
        return;
      }

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  // ========================
  // COMPONENT: KPI Card
  // ========================
  const KPICard = ({ 
    title, 
    value, 
    change, 
    isPositive, 
    icon: Icon, 
    tooltip,
    loading = false,
    prefix = '',
    suffix = ''
  }: any) => (
    <Card className="p-4 sm:p-6 glass-card group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-1">
            {title}
            {tooltip && (
              <button className="group/tooltip relative hidden sm:inline-block">
                <Info className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-secondary)] w-48 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                  {tooltip}
                </div>
              </button>
            )}
          </h3>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="text-[10px] sm:text-xs font-bold">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 sm:h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] mb-1 sm:mb-2">
            {prefix}{value}{suffix}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">vs last period</p>
        </>
      )}
    </Card>
  );

  // ========================
  // COMPONENT: Health Badge
  // ========================
  const HealthBadge = ({ health }: { health: HealthIndicator }) => {
    const colors: Record<HealthStatus, string> = {
      healthy: 'bg-emerald-500',
      watch: 'bg-amber-500',
      attention: 'bg-red-500',
    };
    
    const bgColors: Record<HealthStatus, string> = {
      healthy: 'bg-emerald-500/10 border-emerald-500/30',
      watch: 'bg-amber-500/10 border-amber-500/30',
      attention: 'bg-red-500/10 border-red-500/30',
    };

    const textColors: Record<HealthStatus, string> = {
      healthy: 'text-emerald-400',
      watch: 'text-amber-400',
      attention: 'text-red-400',
    };

    return (
      <div className={`relative group px-4 py-2 rounded-xl border ${bgColors[health.status]}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colors[health.status]} animate-pulse`} />
          <span className={`font-semibold ${textColors[health.status]}`}>{health.label}</span>
          <span className="text-[var(--text-muted)] text-sm">({health.score}/100)</span>
        </div>
        {/* Tooltip */}
        <div className="absolute top-full left-0 mt-2 p-4 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-72 shadow-xl">
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">Health Breakdown</h4>
          <ul className="space-y-1 text-sm">
            {health.reasons.map((reason, i) => (
              <li key={i} className="text-[var(--text-secondary)] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // ========================
  // COMPONENT: Data Freshness
  // ========================
  const DataFreshnessIndicator = ({ freshness }: { freshness: DataFreshness }) => {
    const dotColors = {
      fresh: 'bg-emerald-500',
      recent: 'bg-emerald-500',
      stale: 'bg-amber-500',
    };

    const formatTime = () => {
      if (freshness.minutesAgo < 1) return 'Just now';
      if (freshness.minutesAgo < 60) return `${freshness.minutesAgo} min ago`;
      const hours = Math.floor(freshness.minutesAgo / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    };

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg">
        <div className={`w-2 h-2 rounded-full ${dotColors[freshness.status]}`} />
        <span className="text-xs text-[var(--text-muted)]">
          Last synced {formatTime()}
        </span>
      </div>
    );
  };

  // ========================
  // COMPONENT: Insights Panel
  // ========================
  const InsightsPanel = ({ insights }: { insights: Insight[] }) => {
    const severityColors = {
      positive: 'border-emerald-500/30 bg-emerald-500/5',
      warning: 'border-amber-500/30 bg-amber-500/5',
      critical: 'border-red-500/30 bg-red-500/5',
      neutral: 'border-[var(--border-subtle)] bg-[var(--bg-panel)]/50',
    };

    const iconColors = {
      positive: 'text-emerald-400',
      warning: 'text-amber-400',
      critical: 'text-red-400',
      neutral: 'text-[var(--text-muted)]',
    };

    const getIcon = (icon: string) => {
      switch (icon) {
        case 'up': return TrendingUp;
        case 'down': return TrendingDown;
        case 'warning': return AlertTriangle;
        case 'check': return CheckCircle;
        case 'alert': return AlertCircle;
        case 'fire': return Flame;
        case 'celebration': return PartyPopper;
        case 'milestone': return Award;
        case 'user': return Users;
        default: return Info;
      }
    };

    return (
      <div className="space-y-3">
        {insights.map((insight) => {
          const IconComponent = getIcon(insight.icon);
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border ${severityColors[insight.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${iconColors[insight.severity]}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    {insight.description}
                  </p>
                  <span className="text-xs text-[var(--text-muted)]">
                    {insight.comparedPeriod}
                  </span>
                </div>
                {insight.change !== undefined && (
                  <div className={`text-lg font-bold ${insight.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {insight.change >= 0 ? '+' : ''}{insight.change.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ========================
  // COMPONENT: Weekly Summary
  // ========================
  const WeeklySummaryCard = ({ summary }: { summary: WeeklySummary }) => {
    const getTrendIcon = (value: number) => {
      if (value > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
      if (value < 0) return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      return <span className="text-[var(--text-muted)]">→</span>;
    };

    const getTrendColor = (value: number) => {
      if (value > 0) return 'text-emerald-400';
      if (value < 0) return 'text-red-400';
      return 'text-[var(--text-muted)]';
    };

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Weekly Summary</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {summary.periodStart} - {summary.periodEnd}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Revenue */}
          <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">Revenue</span>
              {getTrendIcon(summary.revenueChange)}
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
              ${summary.totalRevenue.toLocaleString()}
            </div>
            <div className={`text-xs sm:text-sm ${getTrendColor(summary.revenueChangePercent)}`}>
              {summary.revenueChangePercent >= 0 ? '+' : ''}{summary.revenueChangePercent.toFixed(1)}% vs last week
            </div>
          </div>

          {/* Net Subscriptions */}
          <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">Net Subs</span>
              {getTrendIcon(summary.netSubscriptionChange)}
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
              {summary.netSubscriptionChange >= 0 ? '+' : ''}{summary.netSubscriptionChange}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-muted)]">
              +{summary.newSubscriptions} new, -{summary.cancellations} canceled
            </div>
          </div>

          {/* Failed Payments */}
          <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">Failed</span>
              <AlertTriangle className={`w-4 h-4 ${summary.failedPayments > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
              {summary.failedPayments}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-muted)]">
              payments need attention
            </div>
          </div>

          {/* Recovered */}
          <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">Recovered</span>
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
              {summary.recoveredPayments}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-muted)]">
              payments recovered
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Business Timeline
  // ========================
  const BusinessTimelineCard = ({ events }: { events: TimelineEvent[] }) => {
    if (!events || events.length === 0) return null;

    const getEventIcon = (type: string) => {
      switch (type) {
        case 'first_payment': return PartyPopper;
        case 'first_customer': return Users;
        case 'best_revenue_day': return Flame;
        case 'refund_spike': return AlertTriangle;
        case 'worst_churn_day': return TrendingDown;
        case 'revenue_milestone': return Award;
        default: return Milestone;
      }
    };

    const severityColors = {
      positive: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      critical: 'bg-red-500/20 border-red-500/30 text-red-400',
      neutral: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    };

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Milestone className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Business Timeline</h3>
            <p className="text-sm text-[var(--text-muted)]">Key milestones in your journey</p>
          </div>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent" />
          
          <div className="space-y-4">
            {events.slice(0, 6).map((event, index) => {
              const IconComponent = getEventIcon(event.type);
              return (
                <div key={event.id} className="relative flex gap-4 items-start pl-2">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border ${severityColors[event.severity]}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm">{event.title}</h4>
                      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{event.description}</p>
                    {event.value > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-xs font-semibold text-[var(--text-primary)]">
                        {event.type.includes('revenue') || event.type.includes('payment') 
                          ? `$${event.value.toLocaleString()}` 
                          : event.value}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Cohort Retention Heatmap
  // ========================
  const CohortRetentionCard = ({ data }: { data: CohortRetentionMatrix }) => {
    if (!data || !data.cohorts || data.cohorts.length === 0) return null;

    const getRetentionColor = (percentage: number) => {
      if (percentage >= 80) return 'bg-emerald-500/80';
      if (percentage >= 60) return 'bg-emerald-500/50';
      if (percentage >= 40) return 'bg-amber-500/50';
      if (percentage >= 20) return 'bg-amber-500/30';
      return 'bg-red-500/30';
    };

    const trendColors = {
      improving: 'text-emerald-400',
      stable: 'text-amber-400',
      declining: 'text-red-400',
    };

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Cohort Retention</h3>
              <p className="text-sm text-[var(--text-muted)]">Customer retention by signup month</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border-subtle)] text-sm font-medium ${trendColors[data.summary.trend]}`}>
            {data.summary.trend === 'improving' ? '📈 Improving' : data.summary.trend === 'stable' ? '➡️ Stable' : '📉 Declining'}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{data.summary.avgMonth1Retention.toFixed(0)}%</div>
            <div className="text-xs text-[var(--text-muted)]">Avg Month 1</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-center border border-emerald-500/20">
            <div className="text-lg font-bold text-emerald-400">{data.summary.bestCohort}</div>
            <div className="text-xs text-[var(--text-muted)]">Best Cohort</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-center border border-red-500/20">
            <div className="text-lg font-bold text-red-400">{data.summary.worstCohort}</div>
            <div className="text-xs text-[var(--text-muted)]">Needs Work</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-muted)]">Cohort</th>
                {[0, 1, 2, 3, 4, 5].map(month => (
                  <th key={month} className="text-center py-2 px-2 text-xs font-semibold text-[var(--text-muted)]">
                    M{month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.slice(0, 6).map(cohort => (
                <tr key={cohort.cohortMonth} className="border-t border-white/5">
                  <td className="py-2 px-2 text-[var(--text-primary)] font-medium">{cohort.label}</td>
                  {[0, 1, 2, 3, 4, 5].map(month => {
                    const retention = cohort.retentionByMonth[month];
                    if (!retention) return <td key={month} className="py-2 px-2 text-center">-</td>;
                    return (
                      <td key={month} className="py-2 px-2">
                        <div className={`w-full h-8 rounded-md flex items-center justify-center text-xs font-bold text-white ${getRetentionColor(retention.percentage)}`}>
                          {retention.percentage.toFixed(0)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Pareto Analysis (80/20)
  // ========================
  const ParetoAnalysisCard = ({ data }: { data: ParetoAnalysis }) => {
    if (!data || !data.segments || data.segments.length === 0) return null;

    const concentrationColors = {
      low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      moderate: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      high: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      extreme: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6'];

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Revenue Distribution</h3>
              <p className="text-sm text-[var(--text-muted)]">Pareto (80/20) Analysis</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${concentrationColors[data.concentration]}`}>
            {data.concentration.charAt(0).toUpperCase() + data.concentration.slice(1)} Concentration
          </div>
        </div>

        {/* Main stat */}
        <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl border border-purple-500/20 mb-6">
          <div className="text-5xl font-black text-[var(--text-primary)] mb-2">
            {data.topCustomersShare.revenueShare.toFixed(0)}%
          </div>
          <div className="text-[var(--text-secondary)]">
            of revenue from <span className="text-purple-400 font-bold">Top {data.topCustomersShare.percentage}%</span> customers
          </div>
          <div className="text-sm text-[var(--text-muted)] mt-1">
            ({data.topCustomersShare.count} customer{data.topCustomersShare.count !== 1 ? 's' : ''})
          </div>
        </div>

        {/* Segments breakdown */}
        <div className="space-y-3 mb-6">
          {data.segments.map((segment, index) => (
            <div key={segment.name} className="p-3 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }} 
                  />
                  <span className="font-semibold text-[var(--text-primary)]">{segment.name}</span>
                </div>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {segment.revenuePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-muted)]">
                <span>{segment.customerCount} customers</span>
                <span>${segment.revenue.toLocaleString()} revenue</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${segment.revenuePercentage}%`, 
                    backgroundColor: COLORS[index] 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="space-y-2">
          {data.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Revenue Forecasting
  // ========================
  const RevenueForecastingCard = ({ data }: { data: RevenueForecasting }) => {
    if (!data) return null;

    const confidenceColors = {
      high: 'text-emerald-400 bg-emerald-500/10',
      medium: 'text-amber-400 bg-amber-500/10',
      low: 'text-red-400 bg-red-500/10',
    };

    const chartData = data.forecastData.map(d => ({
      month: d.month,
      projected: d.projected,
      upper: d.upperBound,
      lower: d.lowerBound,
    }));

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <TrendUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Revenue Forecast</h3>
              <p className="text-sm text-[var(--text-muted)]">6-month projection</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${confidenceColors[data.confidence]} text-sm font-medium`}>
            {data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)} Confidence
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-xl font-bold text-[var(--text-primary)]">${data.currentMRR.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-muted)]">Current MRR</div>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl text-center border border-purple-500/20">
            <div className="text-xl font-bold text-purple-400">${data.projectedMRR.toLocaleString()}</div>
            <div className="text-xs text-[var(--text-muted)]">Projected MRR</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-xl font-bold text-[var(--text-primary)]">{data.growthRate > 0 ? '+' : ''}{data.growthRate}%</div>
            <div className="text-xs text-[var(--text-muted)]">Monthly Growth</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected']}
              />
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke="transparent"
                fill="url(#confidenceGradient)"
                fillOpacity={1}
              />
              <Area 
                type="monotone" 
                dataKey="projected" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fill="url(#forecastGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assumptions */}
        <div className="mt-4 p-3 bg-white/5 rounded-xl">
          <div className="text-xs font-semibold text-[var(--text-muted)] mb-2">Forecast Assumptions</div>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1">
            {data.assumptions.slice(0, 3).map((assumption, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-400" />
                {assumption}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Payment Funnel
  // ========================
  const PaymentFunnelCard = ({ data }: { data: PaymentFunnel }) => {
    if (!data || !data.steps || data.steps.length === 0) return null;

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
            <Filter className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Payment Funnel</h3>
            <p className="text-sm text-[var(--text-muted)]">Invoice to payment conversion</p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{data.conversionRate.toFixed(0)}%</div>
            <div className="text-xs text-[var(--text-muted)]">Conversion</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{data.avgPaymentTimeHours.toFixed(0)}h</div>
            <div className="text-xs text-[var(--text-muted)]">Avg Time</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-400">{data.retrySuccessRate.toFixed(0)}%</div>
            <div className="text-xs text-[var(--text-muted)]">Retry Success</div>
          </div>
        </div>

        {/* Funnel visualization */}
        <div className="space-y-2 mb-6">
          {data.steps.map((step, index) => {
            const width = step.percentage;
            const isLast = index === data.steps.length - 1;
            const bgColor = index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-violet-500' : 'bg-emerald-500';
            
            return (
              <div key={step.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{step.name}</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {step.count} (${step.value.toLocaleString()})
                  </span>
                </div>
                <div className="relative">
                  <div className="h-10 bg-white/5 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full ${bgColor} rounded-lg flex items-center justify-center transition-all duration-500`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-white text-sm font-bold">{step.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  {step.dropOff !== undefined && step.dropOff > 0 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">-{step.dropOff}</span>
                    </div>
                  )}
                </div>
                {step.dropOffReason && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">{step.dropOffReason}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revenue lost */}
        {data.totalRevenueLost > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-semibold">
                ${data.totalRevenueLost.toLocaleString()} revenue at risk from failed invoices
              </span>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-2">
          {data.insights.map((insight, i) => (
            <div key={i} className="text-sm text-[var(--text-secondary)]">{insight}</div>
          ))}
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Recoverable Revenue
  // ========================
  const RecoverableRevenueCard = ({ data }: { data: RecoverableRevenue }) => {
    if (!data || data.totalRecoverable === 0) return null;

    const priorityColors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };

    const typeIcons = {
      failed_payment: CreditCard,
      expired_card: AlertTriangle,
      incomplete_invoice: FileText,
    };

    return (
      <Card className="p-4 sm:p-6 glass-card border-emerald-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Recoverable Revenue</h3>
              <p className="text-sm text-[var(--text-muted)]">Money you could recover</p>
            </div>
          </div>
        </div>

        {/* Big number */}
        <div className="text-center p-6 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/20 mb-6">
          <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-2">
            ${data.totalRecoverable.toLocaleString()}
          </div>
          <div className="text-[var(--text-secondary)]">could be recovered</div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <CreditCard className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-[var(--text-primary)]">${data.breakdown.failedPayments.recoverable}</div>
            <div className="text-xs text-[var(--text-muted)]">Failed ({data.breakdown.failedPayments.count})</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-[var(--text-primary)]">${data.breakdown.expiredCards.recoverable}</div>
            <div className="text-xs text-[var(--text-muted)]">Expired ({data.breakdown.expiredCards.count})</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <FileText className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-[var(--text-primary)]">${data.breakdown.incompleteInvoices.recoverable}</div>
            <div className="text-xs text-[var(--text-muted)]">Incomplete ({data.breakdown.incompleteInvoices.count})</div>
          </div>
        </div>

        {/* Action items */}
        {data.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Priority Actions</h4>
            {data.items.slice(0, 4).map((item, i) => {
              const IconComponent = typeIcons[item.type];
              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <IconComponent className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--text-primary)] text-sm truncate">{item.customerName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[item.priority]}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{item.suggestedAction}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--text-primary)]">${item.amount.toFixed(0)}</div>
                    <div className="text-xs text-emerald-400">{(item.recoveryProbability * 100).toFixed(0)}% likely</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Methodology */}
        <div className="mt-4 text-xs text-[var(--text-muted)] p-3 bg-white/5 rounded-lg">
          {data.methodology}
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Anomaly Alerts
  // ========================
  const AnomalyAlertsCard = ({ anomalies }: { anomalies: ZScoreAnomaly[] }) => {
    if (!anomalies || anomalies.length === 0) return null;

    const severityColors = {
      unusual: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      critical: 'bg-red-500/20 border-red-500/30 text-red-400',
    };

    return (
      <Card className="p-4 sm:p-6 glass-card border-amber-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Anomaly Detection</h3>
            <p className="text-sm text-[var(--text-muted)]">Z-Score statistical analysis</p>
          </div>
        </div>

        <div className="space-y-3">
          {anomalies.slice(0, 3).map((anomaly, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-xl border ${severityColors[anomaly.severity]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-[var(--text-primary)] text-sm">
                  {anomaly.direction === 'spike' ? '📈 Spike' : '📉 Drop'} in {anomaly.metricName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10">
                  {Math.abs(anomaly.zScore).toFixed(1)}σ
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{anomaly.explanation}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                <span>Value: ${anomaly.value.toLocaleString()}</span>
                <span>Average: ${anomaly.mean.toLocaleString()}</span>
                <span>Date: {anomaly.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: What-If Simulator
  // ========================
  const WhatIfSimulatorCard = ({ baseData }: { baseData: WhatIfBaseData }) => {
    const [priceChange, setPriceChange] = useState(0);
    const [churnReduction, setChurnReduction] = useState(0);
    const [annualConversion, setAnnualConversion] = useState(0);
    const [result, setResult] = useState<WhatIfResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const runSimulation = useCallback(async () => {
      if (priceChange === 0 && churnReduction === 0 && annualConversion === 0) {
        setResult(null);
        return;
      }

      setIsSimulating(true);
      try {
        const response = await fetch(getApiUrl('/api/whatif/simulate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            baseData: {
              currentMRR: baseData.currentMRR,
              currentChurnRate: baseData.currentChurnRate,
              currentARPU: baseData.currentARPU,
              currentCustomers: baseData.currentCustomers,
              monthlyPlanPercentage: baseData.monthlyPlanPercentage
            },
            scenario: {
              priceChangePercent: priceChange,
              churnReductionPercent: churnReduction,
              annualPlanConversionPercent: annualConversion
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setResult(data);
        }
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsSimulating(false);
      }
    }, [baseData, priceChange, churnReduction, annualConversion]);

    // Auto-simulate on slider change (debounced)
    useEffect(() => {
      const timer = setTimeout(runSimulation, 500);
      return () => clearTimeout(timer);
    }, [priceChange, churnReduction, annualConversion, runSimulation]);

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">What-If Simulator</h3>
            <p className="text-sm text-[var(--text-muted)]">Model different business scenarios</p>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6 mb-6">
          {/* Price Change Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--text-secondary)]">Price Change</label>
              <span className={`text-sm font-bold ${priceChange > 0 ? 'text-emerald-400' : priceChange < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                {priceChange > 0 ? '+' : ''}{priceChange}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>-30%</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>

          {/* Churn Reduction Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--text-secondary)]">Churn Reduction</label>
              <span className={`text-sm font-bold ${churnReduction > 0 ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                -{churnReduction}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={churnReduction}
              onChange={(e) => setChurnReduction(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>

          {/* Annual Plan Conversion Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--text-secondary)]">Annual Plan Conversion</label>
              <span className={`text-sm font-bold ${annualConversion > 0 ? 'text-purple-400' : 'text-[var(--text-muted)]'}`}>
                {annualConversion}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={annualConversion}
              onChange={(e) => setAnnualConversion(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>0%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        {isSimulating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        )}

        {result && !isSimulating && (
          <div className="space-y-4">
            {/* Impact Summary */}
            <div className={`p-4 rounded-xl ${result.impact.mrrDeltaPercent > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : result.impact.mrrDeltaPercent < 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">12-Month Impact</span>
                <span className={`text-lg font-black ${result.impact.mrrDeltaPercent > 0 ? 'text-emerald-400' : result.impact.mrrDeltaPercent < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                  {result.impact.mrrDeltaPercent > 0 ? '+' : ''}{result.impact.mrrDeltaPercent.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-muted)]">MRR Delta</span>
                  <p className={`font-bold ${result.impact.mrrDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.impact.mrrDelta > 0 ? '+' : ''}${result.impact.mrrDelta.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">ARR Delta</span>
                  <p className={`font-bold ${result.impact.arrDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.impact.arrDelta > 0 ? '+' : ''}${result.impact.arrDelta.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Projected Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-[var(--text-muted)]">Projected MRR</span>
                <p className="text-lg font-bold text-[var(--text-primary)]">${result.projectedMetrics.mrr.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-[var(--text-muted)]">Projected Churn</span>
                <p className="text-lg font-bold text-[var(--text-primary)]">{result.projectedMetrics.churnRate}%</p>
              </div>
            </div>

            {/* Changes List */}
            {result.changes.length > 0 && (
              <div className="space-y-2">
                {result.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <p className="text-sm text-purple-300">{result.impact.recommendation}</p>
            </div>
          </div>
        )}

        {!result && !isSimulating && (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Adjust the sliders above to see projections</p>
          </div>
        )}
      </Card>
    );
  };

  // ========================
  // COMPONENT: Smart Alerts
  // ========================
  const SmartAlertsCard = ({ alerts }: { alerts: SmartAlert[] }) => {
    const [showAll, setShowAll] = useState(false);
    
    if (!alerts || alerts.length === 0) return null;

    const displayAlerts = showAll ? alerts : alerts.slice(0, 3);
    const unreadCount = alerts.filter(a => !a.isRead).length;

    const priorityColors = {
      low: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      medium: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      high: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      critical: 'bg-red-500/20 border-red-500/30 text-red-400',
    };

    const priorityIcons = {
      low: <Info className="w-4 h-4" />,
      medium: <AlertCircle className="w-4 h-4" />,
      high: <AlertTriangle className="w-4 h-4" />,
      critical: <Flame className="w-4 h-4" />,
    };

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-orange-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Smart Alerts</h3>
              <p className="text-sm text-[var(--text-muted)]">Automated monitoring</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {displayAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-3 rounded-xl border ${priorityColors[alert.priority]} ${!alert.isRead ? 'ring-1 ring-white/10' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {priorityIcons[alert.priority]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-[var(--text-primary)] text-sm truncate">{alert.title}</h4>
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{alert.message}</p>
                  {alert.value !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-[var(--text-muted)]">
                        Value: {typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}%
                      </span>
                      {alert.threshold && (
                        <span className="text-xs text-[var(--text-muted)]">
                          Threshold: {alert.threshold}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > 3 && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-purple-400 hover:text-purple-300"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All (${alerts.length})`}
          </Button>
        )}
      </Card>
    );
  };

  // ========================
  // COMPONENT: Benchmarking
  // ========================
  const BenchmarkingCard = ({ data }: { data: BenchmarkingData }) => {
    const ratingColors = {
      excellent: 'text-emerald-400',
      good: 'text-green-400',
      average: 'text-amber-400',
      below_average: 'text-orange-400',
      needs_improvement: 'text-red-400',
    };

    const ratingBgColors = {
      excellent: 'bg-emerald-500/20',
      good: 'bg-green-500/20',
      average: 'bg-amber-500/20',
      below_average: 'bg-orange-500/20',
      needs_improvement: 'bg-red-500/20',
    };

    const PercentileBar = ({ percentile, rating }: { percentile: BenchmarkPercentile; rating: string }) => (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">0%</span>
          <span className={`font-bold ${ratingColors[percentile.rating]}`}>
            Top {100 - percentile.percentile}%
          </span>
          <span className="text-[var(--text-muted)]">100%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className={`h-full ${ratingBgColors[percentile.rating]} rounded-full transition-all duration-500`}
            style={{ width: `${percentile.percentile}%` }}
          />
          <div 
            className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
            style={{ left: `${percentile.percentile}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>
    );

    // Radar chart data
    const radarData = [
      { metric: 'MRR', value: data.percentiles.mrr.percentile, fullMark: 100 },
      { metric: 'Growth', value: data.percentiles.growthRate.percentile, fullMark: 100 },
      { metric: 'ARPU', value: data.percentiles.arpu.percentile, fullMark: 100 },
      { metric: 'Retention', value: 100 - data.percentiles.churnRate.percentile, fullMark: 100 },
    ];

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Industry Benchmarking</h3>
            <p className="text-sm text-[var(--text-muted)]">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">
                {data.industryComparison.segment}
              </span>
              <span className="ml-2">segment</span>
            </p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Your Performance"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Percentile Breakdown */}
        <div className="space-y-4">
          {/* MRR */}
          <div className="p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">MRR</span>
              <span className="text-sm text-[var(--text-muted)]">${data.yourMetrics.mrr.toLocaleString()}</span>
            </div>
            <PercentileBar percentile={data.percentiles.mrr} rating="mrr" />
            <p className="text-xs text-[var(--text-muted)] mt-2">{data.percentiles.mrr.comparison}</p>
          </div>

          {/* Churn Rate */}
          <div className="p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Churn Rate</span>
              <span className="text-sm text-[var(--text-muted)]">{data.yourMetrics.churnRate.toFixed(1)}%</span>
            </div>
            <PercentileBar percentile={data.percentiles.churnRate} rating="churn" />
            <p className="text-xs text-[var(--text-muted)] mt-2">{data.percentiles.churnRate.comparison}</p>
          </div>

          {/* ARPU */}
          <div className="p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">ARPU</span>
              <span className="text-sm text-[var(--text-muted)]">${data.yourMetrics.arpu.toFixed(0)}</span>
            </div>
            <PercentileBar percentile={data.percentiles.arpu} rating="arpu" />
            <p className="text-xs text-[var(--text-muted)] mt-2">{data.percentiles.arpu.comparison}</p>
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Recommendations</h4>
            {data.recommendations.map((rec, i) => (
              <div key={i} className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <p className="text-sm text-[var(--text-secondary)]">{rec}</p>
              </div>
            ))}
          </div>
        )}

        {/* Industry Comparison */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
            {data.industryComparison.segment} Segment Averages
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[var(--text-muted)]">Avg MRR</span>
              <p className="font-bold text-[var(--text-primary)]">${data.industryComparison.avgMRR.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Avg Churn</span>
              <p className="font-bold text-[var(--text-primary)]">{data.industryComparison.avgChurnRate}%</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Avg ARPU</span>
              <p className="font-bold text-[var(--text-primary)]">${data.industryComparison.avgARPU}</p>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Avg Growth</span>
              <p className="font-bold text-[var(--text-primary)]">{data.industryComparison.avgGrowthRate}%</p>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // ========================
  // COMPONENT: Public Snapshot
  // ========================
  const PublicSnapshotCard = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [snapshot, setSnapshot] = useState<{ shareUrl: string; viewCount: number } | null>(null);
    const [settings, setSettings] = useState({
      showMRR: true,
      showARR: true,
      showCustomerCount: true,
      showChurnRate: false,
      showGrowthTrend: true,
      anonymizeAmounts: false,
      blurSensitiveData: false,
      customTitle: 'My Business Metrics',
    });

    useEffect(() => {
      // Check if user has existing snapshot
      const checkSnapshot = async () => {
        try {
          const response = await fetch(getApiUrl('/api/snapshot/mine'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.hasSnapshot) {
              setSnapshot({ shareUrl: data.shareUrl, viewCount: data.snapshot.viewCount });
            }
          }
        } catch (error) {
          console.error('Error checking snapshot:', error);
        }
      };
      checkSnapshot();
    }, []);

    const createSnapshot = async () => {
      setIsCreating(true);
      try {
        const response = await fetch(getApiUrl('/api/snapshot/create'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ settings, metrics })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSnapshot({ shareUrl: data.shareUrl, viewCount: 0 });
          toast.success('Public snapshot created!');
        }
      } catch (error) {
        toast.error('Failed to create snapshot');
      } finally {
        setIsCreating(false);
      }
    };

    const copyLink = () => {
      if (snapshot) {
        navigator.clipboard.writeText(window.location.origin + snapshot.shareUrl);
        toast.success('Link copied to clipboard!');
      }
    };

    return (
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Public Snapshot</h3>
            <p className="text-sm text-[var(--text-muted)]">Share your metrics publicly</p>
          </div>
        </div>

        {snapshot ? (
          <div className="space-y-4">
            {/* Active Snapshot */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Snapshot Active</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 text-xs bg-black/30 px-3 py-2 rounded-lg text-[var(--text-secondary)] truncate">
                  {window.location.origin}{snapshot.shareUrl}
                </code>
                <Button size="sm" variant="ghost" onClick={copyLink} className="text-purple-400">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => window.open(snapshot.shareUrl, '_blank')}
                  className="text-purple-400"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Eye className="w-3 h-3" />
                <span>{snapshot.viewCount} views</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
              onClick={createSnapshot}
              disabled={isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Regenerate Snapshot
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)]">What to include:</h4>
              
              {[
                { key: 'showMRR', label: 'Monthly Recurring Revenue' },
                { key: 'showARR', label: 'Annual Recurring Revenue' },
                { key: 'showCustomerCount', label: 'Customer Count' },
                { key: 'showChurnRate', label: 'Churn Rate' },
                { key: 'showGrowthTrend', label: 'Growth Trend Chart' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{label}</span>
                  <button
                    onClick={() => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                    className="relative"
                  >
                    {settings[key as keyof typeof settings] ? (
                      <ToggleRight className="w-8 h-8 text-purple-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[var(--text-muted)]" />
                    )}
                  </button>
                </label>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Privacy options:</h4>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Anonymize amounts (show % only)</span>
                <button onClick={() => setSettings(s => ({ ...s, anonymizeAmounts: !s.anonymizeAmounts }))}>
                  {settings.anonymizeAmounts ? (
                    <ToggleRight className="w-8 h-8 text-purple-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Round/blur sensitive numbers</span>
                <button onClick={() => setSettings(s => ({ ...s, blurSensitiveData: !s.blurSensitiveData }))}>
                  {settings.blurSensitiveData ? (
                    <ToggleRight className="w-8 h-8 text-purple-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </button>
              </label>
            </div>

            <Button 
              className="w-full btn-primary"
              onClick={createSnapshot}
              disabled={isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              Create Public Snapshot
            </Button>

            <p className="text-xs text-[var(--text-muted)] text-center">
              Share your metrics on social media or with investors
            </p>
          </div>
        )}
      </Card>
    );
  };

  // ========================
  // LOADING STATE
  // ========================
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // ========================
  // API KEY MODAL
  // ========================
  if (showApiKeyModal) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Key className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)]">Connect Stripe</h2>
              <p className="text-sm text-[var(--text-secondary)]">Enter your Stripe API key</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
              Stripe Secret Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_test_... or sk_live_..."
              className="input-dark"
              disabled={isConnecting}
            />
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Get your API key from{' '}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                Stripe Dashboard
              </a>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowApiKeyModal(false)}
              variant="outline"
              className="flex-1 btn-secondary"
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              className="flex-1 btn-primary"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ========================
  // NO STRIPE CONNECTION
  // ========================
  if (!user?.stripeConnection) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 grid-bg" />
        <div className="smog-container">
          <div className="smog-orb smog-orb-1" />
          <div className="smog-orb smog-orb-2" />
        </div>
        
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--bg-panel)]/80 backdrop-blur-xl border-r border-[var(--border-subtle)] p-6 z-50">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-[var(--text-primary)]">StripeViz</span>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="mb-4 p-4 bg-white/5 border border-[var(--border-subtle)] rounded-xl">
              <div className="text-sm text-[var(--text-primary)] font-semibold mb-1">{user?.name || user?.email}</div>
              <div className="text-xs text-[var(--text-muted)]">{user?.email}</div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full btn-secondary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="ml-64 flex items-center justify-center min-h-screen p-8 relative z-10">
          <Card className="max-w-2xl w-full glass-card p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Key className="w-10 h-10 text-purple-400" />
            </div>
            
            <h1 className="text-3xl font-black text-[var(--text-primary)] mb-4">
              Connect Your Stripe Account
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
              To start viewing your revenue metrics, subscription analytics, and payment insights,
              you need to connect your Stripe account.
            </p>

            <div className="bg-white/5 border border-[var(--border-subtle)] rounded-xl p-6 mb-8 text-left">
              <h3 className="text-[var(--text-primary)] font-bold mb-4">What you'll get:</h3>
              <ul className="space-y-3">
                {[
                  'Real-time MRR and ARR tracking',
                  'Automated insights and health monitoring',
                  'Weekly summary at a glance',
                  'Failed payment alerts',
                  'CSV exports for accountants (Pro)'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => setShowApiKeyModal(true)}
              className="w-full h-14 btn-primary"
            >
              <Key className="w-5 h-5 mr-2" />
              Connect Stripe Account
            </Button>

            <p className="text-xs text-[var(--text-muted)] mt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Read-only access. Your API key is stored securely.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // ========================
  // MAIN DASHBOARD
  // ========================
  return (
    <div className="min-h-screen bg-[var(--bg-base)] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg" />
      <div className="smog-container">
        <div className="smog-orb smog-orb-1" />
        <div className="smog-orb smog-orb-2" />
        <div className="smog-orb smog-orb-3" />
      </div>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Understand your business in 60 seconds.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Test Mode Badge - shown when using Stripe test keys */}
            <TestModeBadge isTestMode={user?.stripeConnection?.stripeMode === 'test'} />
            {/* Health Badge */}
            {metrics?.healthIndicator && (
              <HealthBadge health={metrics.healthIndicator} />
            )}
            {/* Data Freshness */}
            {metrics?.dataFreshness && (
              <div className="hidden sm:block">
                <DataFreshnessIndicator freshness={metrics.dataFreshness} />
              </div>
            )}
            <Button 
              onClick={fetchMetrics}
              disabled={isFetchingMetrics}
              className="btn-primary rounded-xl px-4 sm:px-6"
            >
              {isFetchingMetrics ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {isFetchingMetrics || !metrics ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Insights skeleton */}
            <div className="mb-6 sm:mb-8">
              <div className="h-6 w-32 bg-[var(--bg-elevated)] rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                  <InsightCardSkeleton key={i} />
                ))}
              </div>
            </div>
            {/* Weekly Summary + KPIs Row skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="lg:col-span-1">
                <WeeklySummarySkeleton />
              </div>
              <div className="lg:col-span-2">
                <KpiGridSkeleton count={4} />
              </div>
            </div>
            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <AreaChartSkeleton />
              <AreaChartSkeleton />
            </div>
          </div>
        ) : (
          <>
            {/* Insights Panel - TOP OF DASHBOARD */}
            {metrics.insights && metrics.insights.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  Insights
                </h2>
                <InsightsPanel insights={metrics.insights} />
              </div>
            )}

            {/* Weekly Summary + KPIs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Weekly Summary */}
              <div className="lg:col-span-1">
                {metrics.weeklySummary && (
                  <WeeklySummaryCard summary={metrics.weeklySummary} />
                )}
              </div>

              {/* KPI Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-6">
                <KPICard
                  title="MRR"
                  value={`$${metrics.mrr.toLocaleString()}`}
                  icon={DollarSign}
                  tooltip="Monthly Recurring Revenue from active subscriptions"
                />
                <KPICard
                  title="ARR"
                  value={`$${metrics.arr.toLocaleString()}`}
                  icon={TrendingUp}
                  tooltip="Annual Run Rate (MRR × 12)"
                />
                <KPICard
                  title="Active Subs"
                  value={metrics.activeSubscriptions.toLocaleString()}
                  icon={Users}
                  tooltip="Total active paying subscriptions"
                />
                <KPICard
                  title="Churn Rate"
                  value={metrics.churnRate.toFixed(1)}
                  suffix="%"
                  icon={TrendingDown}
                  tooltip="Percentage of customers who canceled"
                />
              </div>
            </div>

            {/* Revenue Over Time Chart */}
            <Card className="p-4 sm:p-6 lg:p-8 glass-card mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)] mb-1 sm:mb-2">Revenue Over Time</h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Daily revenue trends</p>
                </div>
                {user?.subscription?.plan === 'pro' && (
                  <Button 
                    onClick={() => handleExport('revenue')}
                    disabled={isExporting === 'revenue'}
                    variant="outline" 
                    className="btn-secondary w-full sm:w-auto"
                  >
                    {isExporting === 'revenue' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export CSV
                  </Button>
                )}
              </div>
              {metrics.revenueData.length > 0 ? (
                <div className="h-60 sm:h-72 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.revenueData}>
                      <defs>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-panel)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '12px',
                        }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: 'var(--text-secondary)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="gross" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorGross)" name="Gross Revenue" />
                      <Area type="monotone" dataKey="net" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" name="Net Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 sm:h-72 lg:h-80 flex items-center justify-center">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] text-base sm:text-lg font-semibold">No revenue data yet</p>
                    <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-2">Revenue will appear here once you have transactions</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Subscriptions Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              <Card className="p-4 sm:p-6 lg:p-8 glass-card">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)] mb-1 sm:mb-2">Subscription Status</h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 sm:mb-6">Current distribution</p>
                {metrics.subscriptionStatus.length > 0 && metrics.subscriptionStatus.some(s => s.value > 0) ? (
                  <>
                    <div className="h-48 sm:h-60 lg:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.subscriptionStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {metrics.subscriptionStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--bg-panel)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '12px',
                              padding: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                      {metrics.subscriptionStatus.map((item) => (
                        <div key={item.name} className="text-center">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs sm:text-sm text-[var(--text-secondary)]">{item.name}</span>
                          </div>
                          <div className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)]">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 sm:h-60 lg:h-72 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)] text-base sm:text-lg font-semibold">No subscriptions yet</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-4 sm:p-6 lg:p-8 glass-card">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)]">Subscription Activity</h2>
                  {user?.subscription?.plan === 'pro' && (
                    <Button 
                      onClick={() => handleExport('subscriptions')}
                      disabled={isExporting === 'subscriptions'}
                      variant="outline" 
                      size="sm"
                      className="btn-secondary"
                    >
                      {isExporting === 'subscriptions' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4 sm:mb-6">New vs canceled by month</p>
                {metrics.monthlyActivity.length > 0 && metrics.monthlyActivity.some(m => m.new > 0 || m.canceled > 0) ? (
                  <div className="h-48 sm:h-60 lg:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.monthlyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--bg-panel)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            padding: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="new" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="New" />
                        <Bar dataKey="canceled" fill="#6366f1" radius={[8, 8, 0, 0]} name="Canceled" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-60 lg:h-72 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)] text-base sm:text-lg font-semibold">No activity yet</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Failed Payments */}
            <Card className="p-4 sm:p-6 lg:p-8 glass-card border-red-500/20 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)] mb-1 sm:mb-2">Failed Payments</h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">These payments need attention</p>
                </div>
                {user?.subscription?.plan === 'pro' && (
                  <Button 
                    onClick={() => handleExport('payments')}
                    disabled={isExporting === 'payments'}
                    variant="outline" 
                    className="btn-secondary w-full sm:w-auto"
                  >
                    {isExporting === 'payments' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export
                  </Button>
                )}
              </div>
              {metrics.failedPaymentsList.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Customer</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Amount</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)] hidden sm:table-cell">Reason</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.failedPaymentsList.map((payment) => (
                        <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-primary)] font-semibold text-sm">{payment.customer}</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-primary)] font-bold text-sm">${payment.amount.toFixed(2)}</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-secondary)] text-sm hidden sm:table-cell">{payment.reason}</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-muted)] text-sm">{payment.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)] text-base sm:text-lg font-semibold">No failed payments</p>
                  <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-2">All payments are processing successfully!</p>
                </div>
              )}
            </Card>

            {/* Recent Invoices */}
            <Card className="p-4 sm:p-6 lg:p-8 glass-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--text-primary)] mb-1 sm:mb-2">Recent Invoices</h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Latest transactions</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 input-dark w-full sm:w-48 lg:w-64"
                    />
                  </div>
                  {user?.subscription?.plan === 'pro' && (
                    <Button 
                      onClick={() => handleExport('invoices')}
                      disabled={isExporting === 'invoices'}
                      variant="outline" 
                      className="btn-secondary w-full sm:w-auto"
                    >
                      {isExporting === 'invoices' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export CSV
                    </Button>
                  )}
                </div>
              </div>
              {metrics.invoices.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Invoice ID</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Customer</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Amount</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)]">Status</th>
                        <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)] hidden md:table-cell">Date</th>
                        <th className="text-right py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[var(--text-secondary)] hidden lg:table-cell">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.invoices
                        .filter(inv => 
                          searchTerm === '' || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((invoice) => (
                        <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-purple-400 font-semibold text-xs sm:text-sm">{invoice.id.slice(0, 15)}...</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-primary)] font-medium text-xs sm:text-sm">{invoice.customer}</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-primary)] font-bold text-xs sm:text-sm">${invoice.amount.toFixed(2)}</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold ${
                              invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                              invoice.status === 'pending' || invoice.status === 'open' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {invoice.status === 'paid' && <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                              {(invoice.status === 'pending' || invoice.status === 'open') && <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                              {invoice.status === 'failed' && <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                              <span className="hidden sm:inline">{invoice.status}</span>
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-[var(--text-muted)] text-xs sm:text-sm hidden md:table-cell">{invoice.date}</td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-right hidden lg:table-cell">
                            <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg text-xs sm:text-sm">
                              View
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)] text-base sm:text-lg font-semibold">No invoices yet</p>
                  <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-2">Invoices will appear here once you create them in Stripe</p>
                </div>
              )}
            </Card>

            {/* ======================== */}
            {/* ADVANCED ANALYTICS SECTION */}
            {/* ======================== */}
            
            {/* Section Header */}
            <div className="mt-8 sm:mt-12 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Advanced Analytics</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] ml-13">
                Powerful insights powered by statistical algorithms • No AI, pure deterministic logic
              </p>
            </div>

            {/* Anomaly Detection Alert */}
            {metrics.anomalies && metrics.anomalies.length > 0 && (
              <div className="mb-6">
                <AnomalyAlertsCard anomalies={metrics.anomalies} />
              </div>
            )}

            {/* Recoverable Revenue - High Impact */}
            {metrics.recoverableRevenue && metrics.recoverableRevenue.totalRecoverable > 0 && (
              <div className="mb-6">
                <RecoverableRevenueCard data={metrics.recoverableRevenue} />
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Business Timeline */}
              {metrics.businessTimeline && metrics.businessTimeline.length > 0 && (
                <BusinessTimelineCard events={metrics.businessTimeline} />
              )}
              
              {/* Payment Funnel */}
              {metrics.paymentFunnel && (
                <PaymentFunnelCard data={metrics.paymentFunnel} />
              )}
            </div>

            {/* Full Width: Cohort Retention */}
            {metrics.cohortRetention && metrics.cohortRetention.cohorts.length > 0 && (
              <div className="mb-6">
                <CohortRetentionCard data={metrics.cohortRetention} />
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pareto Analysis */}
              {metrics.paretoAnalysis && (
                <ParetoAnalysisCard data={metrics.paretoAnalysis} />
              )}
              
              {/* Revenue Forecasting */}
              {metrics.revenueForecasting && (
                <RevenueForecastingCard data={metrics.revenueForecasting} />
              )}
            </div>

            {/* ======================== */}
            {/* NEW FEATURES SECTION */}
            {/* ======================== */}
            
            {/* Section Header: Pro Tools */}
            <div className="mt-8 sm:mt-12 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Pro Tools</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] ml-13">
                Simulate scenarios, monitor alerts, and benchmark your performance
              </p>
              {/* Test Mode Restriction Banner for Advanced Analytics */}
              <TestModeRestrictionBanner 
                isTestMode={user?.stripeConnection?.stripeMode === 'test'} 
                feature="Advanced analytics"
              />
            </div>

            {/* Smart Alerts - Always visible if there are alerts */}
            {metrics.smartAlerts && metrics.smartAlerts.length > 0 && (
              <div className="mb-6">
                <SmartAlertsCard alerts={metrics.smartAlerts} />
              </div>
            )}

            {/* Three Column Layout for Pro Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {/* What-If Simulator */}
              {metrics.whatIfBaseData && (
                <WhatIfSimulatorCard baseData={metrics.whatIfBaseData} />
              )}
              
              {/* Public Snapshot */}
              <PublicSnapshotCard />
              
              {/* Benchmarking - only if we have data */}
              {metrics.benchmarking && (
                <BenchmarkingCard data={metrics.benchmarking} />
              )}
            </div>

            {/* Pro Upgrade CTA (for free users) */}
            {user?.subscription?.plan !== 'pro' && (
              <Card className="p-4 sm:p-6 lg:p-8 glass-card border-purple-500/30 mt-6 sm:mt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">
                      Unlock CSV Exports
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Upgrade to Pro to export your invoices, payments, subscriptions, and revenue data as CSV files. 
                      Perfect for accountants and financial reporting.
                    </p>
                  </div>
                  <Link to="/upgrade" className="w-full sm:w-auto">
                    <Button className="btn-primary w-full sm:w-auto">
                      Upgrade to Pro
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Test Mode Warning Toast - shows once per session when using test keys */}
      <TestModeWarning isTestMode={user?.stripeConnection?.stripeMode === 'test'} />
    </div>
  );
}
