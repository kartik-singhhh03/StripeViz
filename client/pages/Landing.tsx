import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Activity, 
  Shield, 
  Clock, 
  Eye, 
  Zap, 
  CheckCircle2, 
  Lock, 
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Minus,
  RefreshCw,
  Coffee,
  Star,
  Sparkles,
  Twitter
} from "lucide-react";
import { DarkLayout } from "@/components/DarkLayout";

export default function Landing() {
  return (
    <DarkLayout showSmog={true}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30 outline-glow-animated">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">StripeViz</span>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-4 py-2 transition-colors text-sm rounded-lg hover:bg-white/5">
              Features
            </a>
            <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-4 py-2 transition-colors text-sm rounded-lg hover:bg-white/5">
              Pricing
            </a>
            <a href="#security" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-4 py-2 transition-colors text-sm rounded-lg hover:bg-white/5">
              Security
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login">
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-2 sm:px-4 py-2 transition-colors text-sm sm:text-base touch-manipulation">
                Sign in
              </button>
            </Link>
            <Link to="/signup">
              <button className="btn-primary px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm touch-manipulation">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-28 lg:pb-24 hero-smog">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-300 mb-6 sm:mb-8 backdrop-blur-sm outline-glow">
            <Coffee className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Built by a founder who got tired of digging through Stripe</span>
            <span className="sm:hidden">Built by founders, for founders</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 leading-tight">
            <span className="text-[var(--text-primary)]">Stop decoding.</span>
            <br />
            <span className="text-gradient-purple">Start understanding.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[var(--text-secondary)] mb-8 sm:mb-10 leading-relaxed px-2">
            Your MRR, churn, and revenue health—surfaced in under 60 seconds. 
            No tabs. No filters. No mental math. Just clarity.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4 sm:mb-6 px-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <button className="btn-primary h-12 sm:h-14 px-6 sm:px-10 w-full sm:w-auto rounded-full text-sm sm:text-base font-semibold flex items-center justify-center gap-2 group touch-manipulation">
                Start Free — No Credit Card
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
          
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-10 sm:mb-16 flex items-center justify-center gap-2">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
            Read-only Stripe access. We can't touch your money.
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 mb-10 sm:mb-12">
            {[
              { metric: "1,200+", label: "Founders trust us" },
              { metric: "< 60s", label: "Daily check-in time" },
              { metric: "0", label: "Tabs to click" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gradient-purple mb-1">
                  {stat.metric}
                </div>
                <div className="text-[var(--text-muted)] text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Exists Section */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 px-2">
              Stripe is powerful. But it wasn't built for founders.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
              You need clarity, not complexity. You need answers, not analytics training.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
            {/* Stripe Dashboard */}
            <div className="glass-card p-5 sm:p-8 border-red-500/20">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Stripe Dashboard
                </h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "Dozens of tabs to navigate",
                  "Metrics require manual calculation",
                  "Built for finance teams, not founders",
                  "Context switching kills your focus",
                  "You end up guessing, not knowing"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-[var(--text-secondary)]">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400/70 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* StripeViz */}
            <div className="glass-card p-5 sm:p-8 border-purple-500/30 outline-glow-static card-smog-intense">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  StripeViz
                </h3>
              </div>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "One screen. Everything you need.",
                  "MRR, churn, trends—calculated for you",
                  "Built for how founders actually work",
                  "60-second daily check-in",
                  "Confidence in your numbers, instantly"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-[var(--text-secondary)]">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Makes Life Easier */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border-subtle)] section-smog scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
              Built for how founders actually work
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto px-2">
              You check metrics between meetings. You don't have time to click through tabs.
              You want confidence, not raw data.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Clock,
                title: "Less time interpreting",
                desc: "Stop doing mental math. Your numbers are already calculated and compared."
              },
              {
                icon: Zap,
                title: "Faster decisions",
                desc: "See what matters immediately. Act on insights, not assumptions."
              },
              {
                icon: AlertTriangle,
                title: "Instant problem awareness",
                desc: "Failed payments, churn spikes—surfaced before they become emergencies."
              },
              {
                icon: Eye,
                title: "No learning curve",
                desc: "No finance background needed. If you can read, you can understand."
              },
            ].map((benefit, i) => (
              <div key={i} className="glass-card p-4 sm:p-6 text-center outline-glow card-smog">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <benefit.icon className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1 sm:mb-2">
                  {benefit.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What This Does Better */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
              Opinionated metrics that matter
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
              We don't show you everything. We show you what founders actually need to know.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                icon: TrendingUp,
                title: "MRR surfaced immediately",
                description: "Your monthly recurring revenue, right there. No clicking, no calculating, no confusion."
              },
              {
                icon: RefreshCw,
                title: "Automatic comparisons",
                description: "Today vs yesterday. This month vs last. Trends revealed instantly, not after spreadsheet work."
              },
              {
                icon: BarChart3,
                title: "One-screen clarity",
                description: "Everything on a single dashboard. No configuration. No setup thinking. It just works."
              },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-5 sm:p-8 outline-glow card-smog-corner">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center mb-4 sm:mb-6">
                  <feature.icon className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-[var(--text-primary)] mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="security" className="py-20 border-t border-[var(--border-subtle)] section-smog scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-10 lg:p-12 outline-glow-static card-smog-intense">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-500/10 mb-4 sm:mb-6">
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
                Your data is safe. We promise.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto">
                We understand you're trusting us with sensitive information. Here's exactly how we protect it.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                {
                  icon: Eye,
                  title: "Read-only access",
                  desc: "We can see your metrics. We cannot move money, refund payments, or modify anything."
                },
                {
                  icon: Lock,
                  title: "Secure token storage",
                  desc: "Your Stripe credentials are encrypted at rest using industry-standard AES-256 encryption."
                },
                {
                  icon: Shield,
                  title: "No payment data stored",
                  desc: "We never store credit card numbers or sensitive customer payment information."
                },
                {
                  icon: CheckCircle2,
                  title: "Revoke anytime",
                  desc: "Disconnect StripeViz from your Stripe dashboard with one click. No questions asked."
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 border-t border-[var(--border-subtle)] scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
              Simple, founder-friendly pricing
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
              Start free. Upgrade when you need more clarity.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-10">
            {/* Free Plan */}
            <div className="glass-card p-5 sm:p-8">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">Free</h3>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm">For founders getting started</p>
              </div>
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">$0</span>
                <span className="text-[var(--text-muted)]">/month</span>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  "Core MRR dashboard",
                  "Basic revenue tracking",
                  "7-day data history",
                  "Email support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <button className="btn-secondary w-full py-2.5 sm:py-3 rounded-xl text-sm touch-manipulation">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="glass-card p-5 sm:p-8 border-purple-500/30 outline-glow-static card-smog-intense relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-semibold px-3 sm:px-4 py-1 rounded-full whitespace-nowrap">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-4 sm:mb-6 mt-2 sm:mt-0">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">Pro</h3>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm">For founders who value their time</p>
              </div>
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-gradient-purple">$29</span>
                <span className="text-[var(--text-muted)]">/month</span>
                <span className="ml-2 text-xs text-emerald-400">or $290/year (save 17%)</span>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  "Everything in Free",
                  "Unlimited data history",
                  "Churn predictions & alerts",
                  "Failed payment monitoring",
                  "Custom date comparisons",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <button className="btn-primary w-full py-2.5 sm:py-3 rounded-xl text-sm touch-manipulation">
                  Start Pro Trial
                </button>
              </Link>
            </div>

            {/* Business Plan */}
            <div className="glass-card p-5 sm:p-8">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">Business</h3>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm">For growing teams</p>
              </div>
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">$79</span>
                <span className="text-[var(--text-muted)]">/month</span>
                <span className="ml-2 text-xs text-emerald-400">or $790/year</span>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  "Everything in Pro",
                  "Team collaboration",
                  "Advanced analytics",
                  "CSV & API exports",
                  "Custom integrations",
                  "Dedicated support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <button className="btn-secondary w-full py-2.5 sm:py-3 rounded-xl text-sm touch-manipulation">
                  Start Business Trial
                </button>
              </Link>
            </div>
          </div>

          {/* Lifetime Deal */}
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-6 sm:p-8 border-amber-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-3xl" />
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-400 font-semibold text-sm">LIFETIME DEAL</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-1">Pay once, use forever</h3>
                    <p className="text-[var(--text-secondary)] text-sm">Get Pro features for life. No recurring fees.</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-bold text-gradient-purple">$99</span>
                      <span className="text-[var(--text-muted)] line-through text-sm">$348/yr</span>
                    </div>
                    <p className="text-emerald-400 text-xs mt-1">Save over 70% vs annual</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
                  <Link to="/pricing" className="w-full sm:w-auto">
                    <button className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
                      Claim Lifetime Access
                    </button>
                  </Link>
                  <span className="text-[var(--text-muted)] text-xs">Limited availability — 47 remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Philosophy */}
          <div className="mt-8 sm:mt-12 text-center max-w-2xl mx-auto px-2">
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              <span className="font-semibold text-[var(--text-primary)]">Why Pro costs $29:</span> You're not paying for features. 
              You're paying for clarity, for time saved, for the peace of mind that comes from understanding your business at a glance. 
              That's worth more than a few coffees a month.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 border-t border-[var(--border-subtle)] hero-smog">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
            Make your Stripe experience calmer.
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto leading-relaxed">
            Join 1,200+ founders who start their day with clarity instead of confusion.
            Connect your Stripe in 2 minutes. No credit card. No pressure.
          </p>
          <Link to="/signup">
            <button className="btn-primary h-16 px-12 rounded-full text-lg font-semibold flex items-center gap-3 mx-auto group">
              Get Started — It's Free
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <p className="mt-6 text-sm text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Read-only access. Cancel anytime. No lock-in.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-[var(--text-primary)]">StripeViz</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
              <a href="#features" className="hover:text-[var(--text-secondary)] transition-colors">Features</a>
              <a href="#pricing" className="hover:text-[var(--text-secondary)] transition-colors">Pricing</a>
              <a href="#security" className="hover:text-[var(--text-secondary)] transition-colors">Security</a>
              <Link to="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</Link>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <a 
                href="https://x.com/kartik_singhhh" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-purple-400 transition-colors group"
              >
                <span>Built by</span>
                <span className="font-semibold text-[var(--text-secondary)] group-hover:text-purple-400">Kartik Singh</span>
                <Twitter className="w-4 h-4" />
              </a>
              <p className="text-xs text-[var(--text-muted)]">
                © 2025 StripeViz. Built with 💜 for founders.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </DarkLayout>
  );
}
