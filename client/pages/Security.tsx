import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Shield, Lock, Eye, Key, Server, AlertTriangle, CheckCircle2, Mail } from "lucide-react";

export default function Security() {
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Security & Data Protection</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Your data security is our top priority. Here's how we protect your information.
          </p>
        </div>

        {/* Security Highlights */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <Eye className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Read-Only Access</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              StripeViz uses restricted, read-only Stripe access. We cannot modify your data or move funds.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <Lock className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Encrypted Data</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              All sensitive data is encrypted at rest using AES-256 encryption.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <Shield className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">No Payment Data Stored</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              No payment or card information is ever stored on our servers.
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <Key className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Full Control</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Users can disconnect their Stripe account at any time with one click.
            </p>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          {/* Stripe Integration Security */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              Stripe Integration Security
            </h2>
            <p className="mb-4">
              When you connect your Stripe account to StripeViz, we take security seriously:
            </p>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-[var(--text-primary)]">Read-only API access:</strong> We use Stripe's 
                  restricted API keys that only allow reading data. We cannot create charges, issue refunds, 
                  modify subscriptions, or perform any write operations.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-[var(--text-primary)]">OAuth authentication:</strong> We use Stripe's 
                  official OAuth flow for secure authorization. Your Stripe credentials are never shared with us.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-[var(--text-primary)]">Token encryption:</strong> Access tokens are 
                  encrypted and stored securely. They are never exposed in logs or client-side code.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-[var(--text-primary)]">Instant revocation:</strong> You can disconnect 
                  StripeViz from your Stripe account at any time, either from our settings or directly from 
                  your Stripe dashboard.
                </span>
              </li>
            </ul>
          </section>

          {/* Data Encryption */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Data Encryption
            </h2>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Encryption Standards</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span><strong className="text-[var(--text-primary)]">In Transit:</strong> All data is encrypted using TLS 1.3 (HTTPS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span><strong className="text-[var(--text-primary)]">At Rest:</strong> AES-256 encryption for stored data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span><strong className="text-[var(--text-primary)]">Passwords:</strong> Securely hashed using bcrypt with salt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span><strong className="text-[var(--text-primary)]">API Tokens:</strong> Encrypted with rotating keys</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Infrastructure Security */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              Infrastructure Security
            </h2>
            <p className="mb-4">
              Our infrastructure is built with security-first principles:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Hosted on secure, SOC 2 compliant cloud infrastructure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Regular security updates and patch management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>DDoS protection and Web Application Firewall (WAF)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Automated backups with encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Access logging and monitoring for suspicious activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Principle of least privilege for all system access</span>
              </li>
            </ul>
          </section>

          {/* What We Don't Store */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">What We Don't Store</h2>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-6">
              <p className="mb-3 text-sm">StripeViz <strong className="text-red-400">NEVER</strong> stores:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Credit card numbers or CVV codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Bank account or routing numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Your Stripe secret API keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Your customers' full payment details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Social Security or government ID numbers</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Account Security */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Your Account Security</h2>
            <p className="mb-4">
              We provide tools to help you keep your account secure:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Strong password requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Secure session management with automatic timeouts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Login notifications for new devices (coming soon)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Ability to sign out from all devices</span>
              </li>
            </ul>
          </section>

          {/* Responsible Disclosure */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              Responsible Disclosure
            </h2>
            <p className="mb-4">
              We take security vulnerabilities seriously. If you discover a security issue, please report it 
              responsibly:
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Report Security Issues</p>
                  <a href="mailto:security@stripeviz.com" className="text-purple-400 hover:text-purple-300">
                    security@stripeviz.com
                  </a>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Please include a detailed description of the vulnerability and steps to reproduce. We will 
                acknowledge receipt within 48 hours and work to resolve verified issues promptly.
              </p>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Compliance</h2>
            <p className="mb-4">
              StripeViz is committed to maintaining high security and privacy standards:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>GDPR compliant data handling practices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Data processing agreements available upon request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Regular security assessments and improvements</span>
              </li>
            </ul>
          </section>

          {/* Questions */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Questions?</h2>
            <p className="mb-4">
              If you have questions about our security practices, please contact us:
            </p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6">
              <p className="text-sm">
                <strong className="text-[var(--text-primary)]">Security:</strong>{" "}
                <a href="mailto:security@stripeviz.com" className="text-purple-400 hover:text-purple-300">security@stripeviz.com</a>
              </p>
              <p className="text-sm mt-2">
                <strong className="text-[var(--text-primary)]">General:</strong>{" "}
                <a href="mailto:support@stripeviz.com" className="text-purple-400 hover:text-purple-300">support@stripeviz.com</a>
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
            <Link to="/security" className="text-purple-400">Security</Link>
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
