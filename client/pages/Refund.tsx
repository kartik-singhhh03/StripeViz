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
