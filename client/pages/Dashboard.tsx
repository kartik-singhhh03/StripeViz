import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertCircle, 
  Calendar, Download, Filter, Search, ChevronRight, Activity,
  ArrowUpRight, ArrowDownRight, Info, CheckCircle, XCircle, Clock, Key, Loader2, LogOut,
  RefreshCw, AlertTriangle, Shield, FileText, Zap, Heart, Eye, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sidebar, useSidebarOffset } from '@/components/Sidebar';
import { DashboardSkeleton, KpiGridSkeleton, AreaChartSkeleton, InsightCardSkeleton, WeeklySummarySkeleton } from '@/components/skeletons';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { 
  Insight, WeeklySummary, HealthIndicator, DataFreshness, HealthStatus
} from '@shared/api';

interface User {
  id: string;
  email: string;
  name: string;
  stripeConnection?: {
    stripeAccountId: string;
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
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
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
      const response = await fetch('/api/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
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
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect Stripe');
      }

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
      const response = await fetch(`/api/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    </div>
  );
}
