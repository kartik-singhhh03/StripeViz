import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Refund() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <Logo size={36} />
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
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Refund Policy</h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            Last updated: December 25, 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          {/* Merchant of Record */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Merchant of Record</h2>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 sm:p-6 mb-4">
              <p className="text-sm">
                All payments for StripeViz are processed by <strong className="text-purple-400">Paddle.com Market Limited</strong> (Paddle), 
                who acts as our Merchant of Record. This means Paddle is responsible for handling all billing, payment processing, 
                invoicing, and refunds on our behalf.
              </p>
            </div>
            <p>
              When you make a purchase, your transaction is processed directly by Paddle. As such, all refund requests 
              are handled by Paddle in accordance with their policies.
            </p>
          </section>

          {/* Refund Policy */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-400" />
              Refunds
            </h2>
            <p className="mb-4">
              Since Paddle is our Merchant of Record, all refunds are subject to Paddle's refund policies as outlined 
              in their Invoiced Consumer Terms. Paddle handles refund requests fairly and in accordance with applicable 
              consumer protection laws.
            </p>
            <p className="mb-4">
              If you would like to request a refund, please contact Paddle directly or reach out to us and we will 
              assist you in processing your request through Paddle.
            </p>
          </section>

          {/* Paddle Terms */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Paddle Invoiced Consumer Terms</h2>
            <p className="mb-4">
              Your purchase and any refund requests are governed by Paddle's Invoiced Consumer Terms. We encourage you 
              to review these terms to understand your rights as a consumer.
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm mb-4">
                For complete details on Paddle's refund policies and your consumer rights, please review:
              </p>
              <a 
                href="https://www.paddle.com/legal/invoiced-consumer-terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                Paddle Invoiced Consumer Terms
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </section>

          {/* How to Request a Refund */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">How to Request a Refund</h2>
            <p className="mb-4">To request a refund, you can:</p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">Contact Paddle Directly</h4>
                <p className="text-sm mb-3">
                  As the Merchant of Record, Paddle can process your refund request directly.
                </p>
                <a 
                  href="https://www.paddle.com/help/start/intro-to-paddle/what-is-paddle" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                >
                  Paddle Support
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-2">Contact Us</h4>
                <p className="text-sm mb-3">
                  We're happy to help facilitate your refund request with Paddle.
                </p>
                <a href="mailto:support@stripeviz.com" className="text-purple-400 hover:text-purple-300 text-sm">
                  support@stripeviz.com
                </a>
              </div>
            </div>
          </section>

          {/* Cancellations */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Cancellations</h2>
            <p className="mb-4">
              You may cancel your subscription at any time through your account dashboard or by contacting us. 
              Upon cancellation, you will retain access to the service until the end of your current billing period.
            </p>
            <p>
              For any billing-related questions or to manage your subscription, you can also contact Paddle directly 
              as they handle all payment processing for StripeViz.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Questions?</h2>
            <p className="mb-4">
              If you have any questions about this refund policy or need assistance, please don't hesitate to reach out.
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm mb-2">
                <strong className="text-[var(--text-primary)]">Email:</strong>{" "}
                <a href="mailto:support@stripeviz.com" className="text-purple-400 hover:text-purple-300">
                  support@stripeviz.com
                </a>
              </p>
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Payment Processor:</strong>{" "}
                <a 
                  href="https://www.paddle.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Paddle.com Market Limited
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
            <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
            <Link to="/security" className="hover:text-[var(--text-primary)] transition-colors">Security</Link>
            <Link to="/billing" className="hover:text-[var(--text-primary)] transition-colors">Billing FAQ</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
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
