import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
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
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            Last updated: December 24, 2025
          </p>
        </div>

        {/* Privacy Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">1. Introduction</h2>
            <p className="mb-4">
              At StripeViz, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our analytics dashboard service.
            </p>
            <p>
              By using StripeViz, you consent to the data practices described in this policy. If you do not 
              agree with our policies, please do not use the Service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">2. Information We Collect</h2>
            
            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Account Information</h3>
            <p className="mb-4">When you create an account, we collect:</p>
            <ul className="space-y-2 ml-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Email address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Name (if provided)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Password (encrypted)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Account preferences and settings</span>
              </li>
            </ul>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Stripe Data</h3>
            <p className="mb-4">When you connect your Stripe account, we access:</p>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Revenue and transaction summaries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Customer counts and subscription metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Invoice and payment status information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Business performance data (MRR, churn, etc.)</span>
              </li>
            </ul>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 sm:p-6 my-6">
              <h3 className="font-semibold text-emerald-400 mb-2">Important: Read-Only Access</h3>
              <p className="text-sm">
                StripeViz uses <strong className="text-[var(--text-primary)]">read-only API access</strong> to your Stripe account. 
                We cannot create charges, issue refunds, modify subscriptions, or perform any actions on your behalf. 
                We only retrieve data for display in your dashboard.
              </p>
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Usage Data</h3>
            <p className="mb-4">We automatically collect certain information when you use the Service:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Browser type and version</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Device information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Pages visited and features used</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Time and date of access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>IP address (for security purposes)</span>
              </li>
            </ul>
          </section>

          {/* What We Do NOT Collect */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">3. What We Do NOT Collect</h2>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="mb-4 text-sm">StripeViz does <strong className="text-red-400">NOT</strong> collect or store:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Credit card numbers or payment card details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Bank account information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Your customers' personal payment information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Stripe secret API keys (we use OAuth tokens)</span>
                </li>
              </ul>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">4. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Provide, operate, and maintain the Service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Display your Stripe analytics and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Process your subscription and billing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Send important service updates and notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Improve and personalize your experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Detect and prevent fraud or abuse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Comply with legal obligations</span>
              </li>
            </ul>
          </section>

          {/* Payment Processing */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">5. Payment Processing</h2>
            <p className="mb-4">
              Subscription payments for StripeViz are processed by <strong className="text-[var(--text-primary)]">Paddle</strong>, 
              who acts as our Merchant of Record. When you subscribe:
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Your payment information is collected and processed by Paddle</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>StripeViz does not store your payment card details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Paddle's privacy policy governs their handling of your payment data</span>
              </li>
            </ul>
            <p className="text-sm text-[var(--text-muted)]">
              For more information, please review{" "}
              <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                Paddle's Privacy Policy
              </a>.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">6. Cookies & Tracking</h2>
            <p className="mb-4">
              StripeViz uses cookies and similar technologies to provide and improve the Service:
            </p>
            
            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Essential Cookies</h3>
            <p className="mb-4 text-sm">
              Required for the Service to function. These include session cookies for authentication 
              and security tokens. You cannot opt out of essential cookies.
            </p>

            <h3 className="font-semibold text-[var(--text-primary)] mt-6 mb-3">Analytics Cookies</h3>
            <p className="mb-4 text-sm">
              Help us understand how users interact with the Service. We may use services like 
              privacy-focused analytics to improve the product. These do not track you across other websites.
            </p>

            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 mt-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Managing Cookies</h3>
              <p className="text-sm">
                You can control cookies through your browser settings. Note that disabling essential 
                cookies may prevent you from using certain features of the Service.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">7. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>All data is encrypted in transit using TLS/SSL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Sensitive data is encrypted at rest using AES-256</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Access to user data is restricted and logged</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Regular security assessments and updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>Secure cloud infrastructure with industry-standard protections</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              For more details, see our <Link to="/security" className="text-purple-400 hover:text-purple-300 underline">Security Page</Link>.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">8. Data Sharing & Disclosure</h2>
            <p className="mb-4">
              <strong className="text-[var(--text-primary)]">We do not sell your personal information.</strong> We may share 
              your information only in the following circumstances:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Service Providers:</strong> With trusted third parties who assist in operating our Service (e.g., hosting, analytics)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Legal Requirements:</strong> When required by law, subpoena, or legal process</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Protection:</strong> To protect the rights, property, or safety of StripeViz, our users, or others</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Business Transfer:</strong> In connection with a merger, acquisition, or sale of assets</span>
              </li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">9. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as your account is active or as needed to provide the Service. 
              When you delete your account:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Your account data is deleted within 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Stripe connection tokens are immediately revoked</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Some data may be retained for legal or legitimate business purposes</span>
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">10. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="space-y-2 ml-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Access:</strong> Request a copy of your personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Correction:</strong> Update or correct inaccurate data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Deletion:</strong> Request deletion of your personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Portability:</strong> Receive your data in a portable format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Objection:</strong> Object to certain processing of your data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong className="text-[var(--text-primary)]">Disconnect:</strong> Revoke Stripe access at any time</span>
              </li>
            </ul>
            <p className="text-sm">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@stripeviz.com" className="text-purple-400 hover:text-purple-300">privacy@stripeviz.com</a>.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">11. Children's Privacy</h2>
            <p>
              StripeViz is not intended for use by individuals under the age of 18. We do not knowingly 
              collect personal information from children. If you believe we have collected information 
              from a child, please contact us immediately.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">12. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data in accordance with 
              this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last updated" date. 
              Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">14. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Email:</strong>{" "}
                <a href="mailto:privacy@stripeviz.com" className="text-purple-400 hover:text-purple-300">privacy@stripeviz.com</a>
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
            <Link to="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</Link>
            <Link to="/privacy" className="text-purple-400">Privacy</Link>
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
