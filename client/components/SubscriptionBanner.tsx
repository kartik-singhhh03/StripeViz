/**
 * Subscription Banner Component
 * 
 * Shows current plan, upgrade CTAs, and billing management
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Settings, 
  Loader2,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SubscriptionInfo {
  plan: string;
  status: string;
  isActive: boolean;
  isPaid: boolean;
  isLifetime: boolean;
  features: string[];
  limits: {
    historyDays: number;
    exportsPerMonth: number;
    apiAccess: boolean;
    slackAlerts: boolean;
    multiMetricExports: boolean;
    prioritySupport: boolean;
    fasterSync: boolean;
  };
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canManageBilling: boolean;
}

export function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/stripe/subscription", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setPortalLoading(false);
    }
  }

  async function cancelSubscription() {
    setCancelLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCancelDialog(false);
      fetchSubscription(); // Refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelLoading(false);
    }
  }

  async function reactivateSubscription() {
    setReactivateLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/reactivate", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchSubscription(); // Refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReactivateLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="glass-card border-[var(--border-subtle)]">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          <span className="text-sm text-[var(--text-muted)]">Loading subscription...</span>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) return null;

  // Free plan - show upgrade CTA
  if (subscription.plan === "free") {
    return (
      <Card className="glass-card border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-violet-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                You're on the Free plan
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Upgrade to unlock unlimited history, exports, and more
              </p>
            </div>
          </div>
          <Link to="/pricing">
            <Button size="sm" className="btn-primary">
              Upgrade to Pro
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Lifetime plan
  if (subscription.isLifetime) {
    return (
      <Card className="glass-card border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Lifetime Access
                </p>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                  Early Adopter
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Pro features forever — no recurring payments
              </p>
            </div>
          </div>
          <Check className="w-5 h-5 text-emerald-400" />
        </CardContent>
      </Card>
    );
  }

  // Paid subscription (Pro or Business)
  const planColors = {
    pro: { bg: "from-purple-500/5 to-violet-500/5", border: "border-purple-500/20", icon: "text-purple-400", badge: "bg-purple-500/20 text-purple-400 border-purple-500/20" },
    business: { bg: "from-blue-500/5 to-cyan-500/5", border: "border-blue-500/20", icon: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
  };
  const colors = planColors[subscription.plan as keyof typeof planColors] || planColors.pro;

  return (
    <Card className={cn("glass-card", colors.border, `bg-gradient-to-r ${colors.bg}`)}>
      <CardContent className="p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Sparkles className={cn("w-5 h-5", colors.icon)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                </p>
                <Badge className={colors.badge}>
                  {subscription.status === "active" ? "Active" : subscription.status}
                </Badge>
              </div>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-[var(--text-muted)]">
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="text-amber-400">
                      Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  ) : (
                    `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  )}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {subscription.cancelAtPeriodEnd ? (
              <Button
                size="sm"
                variant="outline"
                onClick={reactivateSubscription}
                disabled={reactivateLoading}
              >
                {reactivateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Reactivate"
                )}
              </Button>
            ) : subscription.canManageBilling && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Billing
                    </>
                  )}
                </Button>
                
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-[var(--text-muted)] hover:text-red-400">
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-[var(--border-subtle)]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        Cancel Subscription?
                      </DialogTitle>
                      <DialogDescription className="text-[var(--text-secondary)]">
                        You'll keep access until the end of your billing period on{" "}
                        {subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                        After that, you'll be downgraded to the Free plan.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Subscription
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={cancelSubscription}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        Cancel Subscription
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
            {subscription.plan === "pro" && (
              <Link to="/pricing">
                <Button size="sm" className="btn-primary">
                  Upgrade to Business
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Feature Gate Component
 * Shows upgrade prompt when user tries to access a Pro feature
 */
interface FeatureGateProps {
  feature: string;
  requiredPlan?: "pro" | "business";
  children: React.ReactNode;
}

export function FeatureGate({ feature, requiredPlan = "pro", children }: FeatureGateProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/stripe/subscription", { credentials: "include" });
        if (res.ok) {
          setSubscription(await res.json());
        }
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  if (loading) return <>{children}</>;

  if (!subscription) return <>{children}</>;

  // Check access based on required plan
  const hasAccess = 
    subscription.isLifetime ||
    (requiredPlan === "pro" && (subscription.plan === "pro" || subscription.plan === "business")) ||
    (requiredPlan === "business" && subscription.plan === "business");

  if (hasAccess) return <>{children}</>;

  // Show upgrade prompt
  return (
    <Card className="glass-card border-purple-500/20">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {feature} is a {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} feature
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Upgrade to unlock {feature.toLowerCase()} and other powerful features.
        </p>
        <Link to="/pricing">
          <Button className="btn-primary">
            Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
