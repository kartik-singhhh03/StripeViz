import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  Check, 
  X, 
  Activity, 
  Sparkles, 
  Shield, 
  Zap,
  ArrowRight,
  Loader2,
  Crown,
} from "lucide-react";
import { DarkLayout } from "@/components/DarkLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  name: string;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
  priceId?: string;
}

const plans: Plan[] = [
  {
    name: "free",
    displayName: "Free",
    description: "For founders getting started",
    price: { monthly: 0, yearly: 0 },
    features: [
      { name: "Connect 1 Stripe account", included: true },
      { name: "Core dashboard (MRR, ARR)", included: true },
      { name: "7-day data history", included: true },
      { name: "Weekly summary (basic)", included: true },
      { name: "Data freshness indicator", included: true },
      { name: "CSV exports", included: false },
      { name: "Failed payment alerts", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Get Started",
  },
  {
    name: "pro",
    displayName: "Pro",
    description: "For founders who value their time",
    price: { monthly: 29, yearly: 290 },
    features: [
      { name: "Everything in Free", included: true },
      { name: "Unlimited data history", included: true },
      { name: "Weekly summary (full)", included: true },
      { name: "Rule-based insights", included: true },
      { name: "Failed payment monitoring", included: true },
      { name: "CSV exports", included: true },
      { name: "Date comparisons", included: true },
      { name: "Priority email support", included: true },
    ],
    highlighted: true,
    badge: "MOST POPULAR",
    cta: "Upgrade to Pro",
  },
  {
    name: "business",
    displayName: "Business",
    description: "For growing teams",
    price: { monthly: 79, yearly: 790 },
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Slack/Discord alerts", included: true },
      { name: "Multi-metric exports", included: true },
      { name: "API access (read-only)", included: true },
      { name: "Faster sync (5 min)", included: true },
      { name: "Dedicated support", included: true },
      { name: "Custom integrations", included: true },
      { name: "Team access (coming soon)", included: true },
    ],
    cta: "Upgrade to Business",
  },
];

const lifetimeDeal = {
  name: "lifetime",
  displayName: "Lifetime Deal",
  description: "Early adopter special — Limited availability",
  price: 99,
  features: [
    "All Pro features forever",
    "Early adopter badge",
    "Locked-in pricing",
    "No recurring payments",
  ],
  remaining: 30,
};

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  // Check for checkout status in URL
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "canceled") {
      setError("Checkout was canceled. No charges were made.");
    }
  }, [searchParams]);

  // Check auth status and current plan
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          setIsAuthenticated(true);
          // Get subscription status
          const subRes = await fetch("/api/stripe/subscription", { credentials: "include" });
          if (subRes.ok) {
            const data = await subRes.json();
            setCurrentPlan(data.plan);
          }
        }
      } catch {
        // Not authenticated
      }
    }
    checkAuth();
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }

    if (plan === "free") {
      navigate("/dashboard");
      return;
    }

    setLoading(plan);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan,
          interval: plan === "lifetime" ? "lifetime" : billingInterval,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  const savings = Math.round((29 * 12 - 290) / (29 * 12) * 100);

  return (
    <DarkLayout>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">StripeViz</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Log in</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="btn-primary">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Hero */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Simple, transparent pricing
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Choose your clarity level
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Start free, upgrade when you need more insights. All plans include a 14-day money-back guarantee.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-10 sm:mb-12">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingInterval === "monthly"
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                billingInterval === "yearly"
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Yearly
              <Badge className="absolute -top-2 -right-12 bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[10px]">
                Save {savings}%
              </Badge>
            </button>
          </div>

          {/* Plans grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative glass-card border-[var(--border-subtle)] transition-all duration-300",
                  plan.highlighted && "border-purple-500/50 outline-glow-static card-smog-intense scale-[1.02]",
                  currentPlan === plan.name && "ring-2 ring-emerald-500/50"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 shadow-lg">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {currentPlan === plan.name && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                      Current Plan
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-[var(--text-primary)]">
                    {plan.displayName}
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[var(--text-primary)]">
                      ${billingInterval === "yearly" ? plan.price.yearly : plan.price.monthly}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-[var(--text-muted)] ml-1">
                        /{billingInterval === "yearly" ? "year" : "month"}
                      </span>
                    )}
                    {billingInterval === "yearly" && plan.price.yearly > 0 && (
                      <p className="text-sm text-emerald-400 mt-1">
                        2 months free
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                        )}
                        <span className={cn(
                          "text-sm",
                          feature.included ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                        )}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn(
                      "w-full",
                      plan.highlighted ? "btn-primary" : "btn-secondary"
                    )}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={loading === plan.name || currentPlan === plan.name}
                  >
                    {loading === plan.name ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : currentPlan === plan.name ? (
                      "Current Plan"
                    ) : (
                      plan.cta
                    )}
                    {!loading && currentPlan !== plan.name && (
                      <ArrowRight className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Lifetime deal */}
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="glass-card border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 mb-4 mx-auto">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>
                <CardTitle className="text-2xl text-[var(--text-primary)] flex items-center justify-center gap-2">
                  {lifetimeDeal.displayName}
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                    LIMITED
                  </Badge>
                </CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">
                  {lifetimeDeal.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-4">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gradient-purple">
                    ${lifetimeDeal.price}
                  </span>
                  <span className="text-[var(--text-muted)] ml-2">one-time</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {lifetimeDeal.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="border-amber-500/20 text-amber-400">
                      <Check className="w-3 h-3 mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-amber-400 mb-4">
                  Only {lifetimeDeal.remaining} spots remaining
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button
                  className="btn-primary px-8"
                  onClick={() => handleUpgrade("lifetime")}
                  disabled={loading === "lifetime" || currentPlan === "lifetime"}
                >
                  {loading === "lifetime" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : currentPlan === "lifetime" ? (
                    "You have Lifetime access"
                  ) : (
                    <>
                      Get Lifetime Access
                      <Zap className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Trust badges */}
          <div className="text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Instant access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-[var(--text-primary)]">StripeViz</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              © 2025 StripeViz. Built with 💜 for founders.
            </p>
          </div>
        </div>
      </footer>
    </DarkLayout>
  );
}
