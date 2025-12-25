import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Activity, 
  Shield, Eye, Calendar, ArrowLeft, Heart, Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getApiUrl } from '@/lib/api';
import type { PublicSnapshotData } from '@shared/api';

export default function PublicSnapshot() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicSnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/snapshot/${token}`));
        if (!response.ok) {
          if (response.status === 404) {
            setError('Snapshot not found');
          } else if (response.status === 410) {
            setError('This snapshot has expired or been removed');
          } else {
            setError('Failed to load snapshot');
          }
          return;
        }
        const result = await response.json();
        setData(result);
        setViewCount(result.viewCount || 0);
      } catch (err) {
        setError('Failed to load snapshot');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchSnapshot();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading snapshot...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {error || 'Snapshot Not Found'}
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            This metrics snapshot may have expired or been removed by its owner.
          </p>
          <Link to="/">
            <Button className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatMetricValue = (value: number | string | undefined, prefix = '', suffix = '') => {
    if (value === undefined) return 'Hidden';
    if (typeof value === 'string') return value;
    return `${prefix}${value.toLocaleString()}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">StripeViz</span>
              </Link>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-sm text-[var(--text-secondary)]">Public Snapshot</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Eye className="w-4 h-4" />
              <span>{viewCount} views</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-3">
            {data.title}
          </h1>
          {data.description && (
            <p className="text-lg text-[var(--text-secondary)] mb-4">{data.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Generated {new Date(data.generatedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Verified by StripeViz
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* MRR */}
          {data.metrics.mrr !== undefined && (
            <Card className="p-6 glass-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">MRR</span>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">
                {formatMetricValue(data.metrics.mrr, '$')}
              </p>
              {data.trends?.mrrTrend && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  data.trends.mrrTrend === 'up' ? 'text-emerald-400' : 
                  data.trends.mrrTrend === 'down' ? 'text-red-400' : 'text-[var(--text-muted)]'
                }`}>
                  {data.trends.mrrTrend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                   data.trends.mrrTrend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
                  <span>{data.trends.mrrTrend === 'up' ? 'Growing' : data.trends.mrrTrend === 'down' ? 'Declining' : 'Stable'}</span>
                </div>
              )}
            </Card>
          )}

          {/* ARR */}
          {data.metrics.arr !== undefined && (
            <Card className="p-6 glass-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">ARR</span>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">
                {formatMetricValue(data.metrics.arr, '$')}
              </p>
            </Card>
          )}

          {/* Customers */}
          {data.metrics.customerCount !== undefined && (
            <Card className="p-6 glass-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">Customers</span>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">
                {formatMetricValue(data.metrics.customerCount)}
              </p>
            </Card>
          )}

          {/* Health Score */}
          {data.metrics.healthScore !== undefined && (
            <Card className="p-6 glass-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-400" />
                </div>
                <span className="text-sm font-semibold text-[var(--text-secondary)]">Health Score</span>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)]">
                {data.metrics.healthScore}/100
              </p>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    (data.metrics.healthScore as number) >= 80 ? 'bg-emerald-500' :
                    (data.metrics.healthScore as number) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.metrics.healthScore}%` }}
                />
              </div>
            </Card>
          )}
        </div>

        {/* Growth Chart */}
        {data.charts?.revenueGrowth && data.charts.revenueGrowth.length > 0 && (
          <Card className="p-6 sm:p-8 glass-card mb-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Revenue Growth Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.revenueGrowth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-panel)', 
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="p-8 glass-card border-purple-500/30 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3">
              Want insights like this for your business?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              StripeViz helps SaaS founders visualize their Stripe metrics with beautiful dashboards, 
              anomaly detection, cohort analysis, and more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button className="btn-primary">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="btn-secondary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--text-secondary)] transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-[var(--text-secondary)] transition-colors">Pricing</Link>
            <Link to="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</Link>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            © 2025 StripeViz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
