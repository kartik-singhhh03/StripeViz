import { Link } from "react-router-dom";
import { Activity, ArrowLeft, RotateCcw, XCircle } from "lucide-react";

export default function Refund() {
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
              <RotateCcw className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Refund & Cancellation Policy</h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            Last updated: December 24, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          {/* Overview */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Overview</h2>
            <p className="mb-4">
              We want you to be completely satisfied with StripeViz. This policy explains how refunds and 
              cancellations work for our subscription service. We aim to be fair and transparent—no hidden 
              conditions, no surprises.
            </p>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 sm:p-6">
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Merchant of Record:</strong> All payments and refunds 
                are processed by <strong className="text-purple-400">Paddle</strong>, our authorized payment provider. 
                Paddle handles billing, taxes, and payment processing on our behalf.
              </p>
            </div>
          </section>

          {/* Refund Policy */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-400" />
              Refund Policy
            </h2>
            
            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">14-Day Money-Back Guarantee</h3>
            <p className="mb-4">
              If you're not satisfied with StripeViz, you can request a full refund within 
              <strong className="text-[var(--text-primary)]"> 14 days</strong> of your initial purchase or renewal.
            </p>

            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 my-6">
              <h4 className="font-semibold text-[var(--text-primary)] mb-3">Refund Eligibility</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>Request made within 14 days of payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>First refund request for your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>No abuse of the refund policy detected</span>
                </li>
              </ul>
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Monthly Subscriptions</h3>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Full refund available within 14 days of each billing cycle</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Refunds are processed to the original payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Access continues until the refund is processed</span>
              </li>
            </ul>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Annual Subscriptions</h3>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Full refund available within 14 days of purchase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>After 14 days, no partial refunds are provided</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You can cancel anytime to prevent future renewals</span>
              </li>
            </ul>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Lifetime Deals</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Full refund available within 14 days of purchase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>After 14 days, lifetime purchases are non-refundable</span>
              </li>
            </ul>
          </section>

          {/* How to Request a Refund */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">How to Request a Refund</h2>
            <p className="mb-4">To request a refund, you have two options:</p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">Option 1: Email Us</h4>
                <p className="text-sm mb-3">Send a refund request to:</p>
                <a href="mailto:support@stripeviz.com" className="text-purple-400 hover:text-purple-300 text-sm">
                  support@stripeviz.com
                </a>
                <p className="text-xs text-[var(--text-muted)] mt-2">Include your account email and reason for refund.</p>
              </div>
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">Option 2: Paddle Receipt</h4>
                <p className="text-sm mb-3">Use the refund link in your Paddle receipt email.</p>
                <p className="text-xs text-[var(--text-muted)]">Refunds via Paddle are typically processed within 5-10 business days.</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 sm:p-6">
              <h4 className="font-semibold text-amber-400 mb-2">Processing Time</h4>
              <p className="text-sm">
                Refunds are typically processed within <strong className="text-[var(--text-primary)]">5-10 business days</strong>. 
                The time for funds to appear in your account depends on your bank or card issuer.
              </p>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-purple-400" />
              Cancellation Policy
            </h2>
            
            <p className="mb-6">
              You can cancel your StripeViz subscription at any time. We believe in making cancellation 
              easy—no hoops to jump through, no hidden conditions.
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 sm:p-6 mb-6">
              <h4 className="font-semibold text-emerald-400 mb-2">No Hidden Conditions</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>Cancel anytime with no penalties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>No cancellation fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>No long-term commitments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>Self-service cancellation available</span>
                </li>
              </ul>
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">How to Cancel</h3>
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
                <span>Click "Manage Subscription" to open Paddle's portal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm flex items-center justify-center font-semibold">4</span>
                <span>Select "Cancel Subscription"</span>
              </li>
            </ol>

            <p className="text-sm text-[var(--text-muted)] mb-6">
              Alternatively, you can email us at{" "}
              <a href="mailto:support@stripeviz.com" className="text-purple-400 hover:text-purple-300">support@stripeviz.com</a>{" "}
              and we'll cancel for you within 24 hours.
            </p>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">When Does Access End?</h3>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">Monthly/Annual:</strong> Access continues until the 
                    end of your current billing period. You've paid for that time, so you keep it.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">After billing period ends:</strong> Your account 
                    reverts to the Free plan. Your data is retained for 30 days in case you resubscribe.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>
                    <strong className="text-[var(--text-primary)]">Stripe connection:</strong> Remains active unless 
                    you manually disconnect. You can disconnect anytime from settings.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Free Trial */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Free Trial</h2>
            <p className="mb-4">
              If we offer a free trial period:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>No payment required to start the trial</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You will be notified before the trial ends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Cancel before trial ends to avoid being charged</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>If you forget to cancel, you're still eligible for our 14-day refund policy</span>
              </li>
            </ul>
          </section>

          {/* Exceptions */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Exceptions</h2>
            <p className="mb-4">
              Refunds may not be granted in the following circumstances:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Repeated refund requests (abuse of policy)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Account terminated for Terms of Service violations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Requests made after the 14-day refund window</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Chargebacks or disputes filed before contacting us</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              We always encourage you to contact us first—we're reasonable people and want to help.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Questions?</h2>
            <p className="mb-4">
              If you have questions about refunds or cancellations, we're here to help:
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Email:</strong>{" "}
                <a href="mailto:support@stripeviz.com" className="text-purple-400 hover:text-purple-300">support@stripeviz.com</a>
              </p>
              <p className="text-sm mt-2">
                <strong className="text-[var(--text-primary)]">Response Time:</strong>{" "}
                Within 24-48 hours
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
            <Link to="/refund" className="text-purple-400">Refunds</Link>
            <Link to="/security" className="hover:text-[var(--text-secondary)] transition-colors">Security</Link>
            <Link to="/billing" className="hover:text-[var(--text-secondary)] transition-colors">Billing</Link>
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
