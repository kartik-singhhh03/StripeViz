import { Link } from "react-router-dom";
import { Activity, ArrowLeft, CreditCard, CheckCircle2, Calendar, RefreshCw, Settings, HelpCircle } from "lucide-react";

export default function Billing() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">StripeViz</span>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Billing & Subscriptions</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Everything you need to know about StripeViz plans, billing, and payments.
          </p>
        </div>

        {/* Key Points */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
            <CreditCard className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Free & Paid Plans</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              StripeViz offers free and paid subscription plans to fit your needs.
            </p>
          </div>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
            <Calendar className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Flexible Billing</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Subscriptions are billed monthly or yearly, with savings on annual plans.
            </p>
          </div>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
            <RefreshCw className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Powered by Paddle</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Payments, invoices, and renewals are securely handled by Paddle.
            </p>
          </div>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
            <Settings className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Easy Management</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Users can manage or cancel subscriptions through the billing portal.
            </p>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          {/* Subscription Plans */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Subscription Plans</h2>
            <p className="mb-6">
              StripeViz offers tiered plans to match your business needs:
            </p>

            {/* Plan Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {/* Free */}
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Free</h3>
                <p className="text-2xl font-bold text-[var(--text-primary)] mb-3">$0<span className="text-sm font-normal text-[var(--text-muted)]">/month</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Core MRR dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Basic revenue tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>7-day data history</span>
                  </li>
                </ul>
              </div>

              {/* Pro */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 relative">
                <div className="absolute -top-2 left-4">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 rounded">POPULAR</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1 mt-2">Pro</h3>
                <p className="text-2xl font-bold text-gradient-purple mb-3">$29<span className="text-sm font-normal text-[var(--text-muted)]">/month</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Unlimited data history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Churn predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>

              {/* Business */}
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Business</h3>
                <p className="text-2xl font-bold text-[var(--text-primary)] mb-3">$79<span className="text-sm font-normal text-[var(--text-muted)]">/month</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>CSV & API exports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted)]">
              View full plan comparison on our <Link to="/pricing" className="text-purple-400 hover:text-purple-300">Pricing page</Link>.
            </p>
          </section>

          {/* Billing Cycles */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Billing Cycles</h2>
            
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Monthly Billing</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Billed on the same date each month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Cancel anytime with no penalty</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Access continues until the end of your billing period</span>
                </li>
              </ul>
            </div>

            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Annual Billing</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span><strong className="text-emerald-400">Save 17%</strong> compared to monthly billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Billed once per year on your signup anniversary</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>14-day refund policy applies to annual subscriptions</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Auto-Renewal */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Auto-Renewal</h2>
            <p className="mb-4">
              All StripeViz subscriptions automatically renew at the end of each billing period:
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Monthly plans renew every month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Annual plans renew every year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You will receive an email reminder before renewal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Cancel before renewal date to avoid being charged</span>
              </li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm">
                <strong className="text-amber-400">Note:</strong> We send renewal reminders 7 days and 1 day 
                before your subscription renews so you're never surprised.
              </p>
            </div>
          </section>

          {/* Payment Provider */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Payment Provider</h2>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 sm:p-6 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Paddle — Merchant of Record</h3>
              <p className="text-sm mb-4">
                All payments are processed by <strong className="text-purple-400">Paddle</strong>, our authorized 
                payment provider. Paddle acts as the Merchant of Record, which means:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Paddle handles all payment processing securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Invoices and receipts are issued by Paddle</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Sales tax/VAT is calculated and collected automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Multiple payment methods accepted (cards, PayPal, etc.)</span>
                </li>
              </ul>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              StripeViz never stores your payment card details. All payment information is handled securely by Paddle.
            </p>
          </section>

          {/* Managing Your Subscription */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Managing Your Subscription
            </h2>
            <p className="mb-4">
              You have full control over your subscription. Here's how to manage it:
            </p>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Access Billing Portal</h3>
            <ol className="space-y-3 ml-4 mb-6">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center justify-center font-semibold">1</span>
                <span>Log in to your StripeViz account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center justify-center font-semibold">2</span>
                <span>Go to Settings → Billing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center justify-center font-semibold">3</span>
                <span>Click "Manage Subscription" to open Paddle's billing portal</span>
              </li>
            </ol>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">What You Can Do</h3>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Update your payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>View and download past invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Change your billing address</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Upgrade or downgrade your plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Switch between monthly and annual billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Cancel your subscription</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Cancellation */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Cancellation</h2>
            <p className="mb-4">
              You can cancel your subscription at any time. There are no cancellation fees or penalties.
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Cancel through the billing portal or by contacting support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Access continues until the end of your current billing period</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Your data is retained for 30 days in case you resubscribe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>After cancellation, your account reverts to the Free plan</span>
              </li>
            </ul>
            <p className="text-sm text-[var(--text-muted)]">
              For details on refunds, see our <Link to="/refund" className="text-purple-400 hover:text-purple-300">Refund Policy</Link>.
            </p>
          </section>

          {/* Failed Payments */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Failed Payments</h2>
            <p className="mb-4">
              If a payment fails, here's what happens:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You'll receive an email notification about the failed payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>We'll automatically retry the payment over the next few days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You can update your payment method in the billing portal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>If payment continues to fail, your account will be downgraded to Free</span>
              </li>
            </ul>
          </section>

          {/* Questions */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              Questions?
            </h2>
            <p className="mb-4">
              If you have questions about billing or need assistance:
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Email:</strong>{" "}
                <a href="mailto:billing@stripeviz.com" className="text-purple-400 hover:text-purple-300">billing@stripeviz.com</a>
              </p>
              <p className="text-sm mt-2">
                <strong className="text-[var(--text-primary)]">Support:</strong>{" "}
                <Link to="/contact" className="text-purple-400 hover:text-purple-300">Contact Page</Link>
              </p>
              <p className="text-sm mt-2 text-[var(--text-muted)]">
                We typically respond within 24 hours.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 mt-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)]">
            <Link to="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</Link>
            <Link to="/refund" className="hover:text-[var(--text-secondary)] transition-colors">Refunds</Link>
            <Link to="/security" className="hover:text-[var(--text-secondary)] transition-colors">Security</Link>
            <Link to="/billing" className="text-purple-400">Billing</Link>
            <Link to="/contact" className="hover:text-[var(--text-secondary)] transition-colors">Contact</Link>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            © 2025 StripeViz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
