import { Link } from "react-router-dom";
import { Activity, ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
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
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            Last updated: December 24, 2025
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to StripeViz. These Terms of Service ("Terms") govern your access to and use of the StripeViz 
              software-as-a-service platform ("Service"), operated by StripeViz ("we", "us", or "our").
            </p>
            <p>
              By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree 
              to these Terms, please do not use the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">2. Service Description</h2>
            <p className="mb-4">
              StripeViz is an analytics dashboard that provides <strong className="text-[var(--text-primary)]">read-only 
              insights</strong> for businesses that use Stripe. Our Service helps you visualize and understand your 
              revenue metrics, customer data, and business performance.
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 my-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Important Clarifications:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>StripeViz provides <strong className="text-[var(--text-primary)]">analytics and visualization only</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>We use <strong className="text-[var(--text-primary)]">read-only access</strong> to your Stripe account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>We <strong className="text-[var(--text-primary)]">do not process payments</strong> on your behalf</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>We <strong className="text-[var(--text-primary)]">do not move, hold, or transfer funds</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>We <strong className="text-[var(--text-primary)]">do not store credit card or payment details</strong></span>
                </li>
              </ul>
            </div>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">3. Account Registration</h2>
            <p className="mb-4">
              To use the Service, you must create an account by providing accurate and complete information. You are 
              responsible for maintaining the confidentiality of your account credentials and for all activities that 
              occur under your account.
            </p>
            <p>
              You agree to notify us immediately of any unauthorized use of your account. We reserve the right to 
              suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">4. User Responsibilities</h2>
            <p className="mb-4">By using StripeViz, you agree to:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Use the Service only for lawful purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Not attempt to gain unauthorized access to any part of the Service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Not reverse engineer, decompile, or disassemble the Service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Not share your account credentials with others</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Ensure you have proper authorization to connect your Stripe account</span>
              </li>
            </ul>
          </section>

          {/* Subscriptions & Billing */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">5. Subscriptions & Billing</h2>
            <p className="mb-4">
              Access to certain features of StripeViz requires a paid subscription. Subscription payments are processed 
              by our authorized payment provider, Paddle, who acts as the Merchant of Record for all transactions.
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Subscriptions automatically renew unless cancelled before the renewal date</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You may cancel your subscription at any time from your account settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Upon cancellation, you retain access until the end of your current billing period</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Refunds are subject to our <Link to="/refund" className="text-purple-400 hover:text-purple-300 underline">Refund Policy</Link></span>
              </li>
            </ul>
            <p className="text-sm text-[var(--text-muted)]">
              For billing inquiries, please refer to our <Link to="/billing" className="text-purple-400 hover:text-purple-300 underline">Billing Information</Link> page.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">6. Service Availability & Changes</h2>
            <p className="mb-4">
              We strive to maintain high availability of the Service, but we do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 sm:p-6 my-6">
              <h3 className="font-semibold text-amber-400 mb-2">Beta Disclaimer</h3>
              <p className="text-sm">
                StripeViz is continuously improving. Features, pricing, and functionality may change as we develop 
                the product. We will notify users of significant changes via email or in-app notifications.
              </p>
            </div>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">7. Account Termination</h2>
            <p className="mb-4">
              You may close your account at any time by contacting us or using the account settings. We reserve 
              the right to suspend or terminate your account if:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You violate these Terms of Service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You engage in fraudulent or illegal activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Your use of the Service negatively impacts other users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>You fail to pay for your subscription</span>
              </li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">8. Intellectual Property</h2>
            <p className="mb-4">
              The Service, including its design, features, and content, is owned by StripeViz and protected by 
              intellectual property laws. You are granted a limited, non-exclusive license to use the Service 
              for its intended purpose during your subscription.
            </p>
            <p>
              Your data remains your property. We do not claim ownership of any data you provide or that is 
              retrieved from your connected Stripe account.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, StripeViz and its affiliates shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
            <p className="mb-4">
              Our total liability for any claims arising from these Terms or your use of the Service shall not 
              exceed the amount you paid to us in the twelve (12) months preceding the claim.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              The Service is provided "as is" without warranties of any kind, express or implied.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless StripeViz and its officers, directors, employees, and 
              agents from any claims, damages, losses, or expenses arising from your use of the Service, your 
              violation of these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard 
              to conflict of law principles. Any disputes arising from these Terms or your use of the Service 
              shall be resolved through good faith negotiation, and if necessary, binding arbitration.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we will notify you by 
              email or by posting a notice on the Service prior to the changes taking effect. Your continued 
              use of the Service after the changes become effective constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">13. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Email:</strong>{" "}
                <a href="mailto:legal@stripeviz.com" className="text-purple-400 hover:text-purple-300">legal@stripeviz.com</a>
              </p>
              <p className="text-sm mt-2">
                <strong className="text-[var(--text-primary)]">Support:</strong>{" "}
                <Link to="/contact" className="text-purple-400 hover:text-purple-300">Contact Page</Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 mt-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)]">
            <Link to="/terms" className="text-purple-400">Terms</Link>
            <Link to="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</Link>
            <Link to="/refund" className="hover:text-[var(--text-secondary)] transition-colors">Refunds</Link>
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
